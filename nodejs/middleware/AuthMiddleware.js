const TokenService = require('../services/TokenService');

// Express middleware to verify token and attach user payload to req.user
function verifyTokenMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[AUTHMIDDLEWARE] Missing or invalid Authorization header from', req.ip);
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const verification = TokenService.verify(token);
  if (!verification.ok) {
    console.warn('[AUTHMIDDLEWARE] Invalid token from', req.ip);
    return res.status(401).json({ message: 'Invalid token' });
  }

  req.user = verification.payload;
  console.log(`[AUTHMIDDLEWARE] Verified user ${req.user.email || 'unknown'} (${req.user.userRole})`);
  next();
}

// roleChecker factory: checks if user has one of allowed roles
function roleChecker(allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      console.warn('[AUTHMIDDLEWARE] No user payload attached to request');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const role = (req.user.userRole || '').toUpperCase();
    if (allowedRoles.includes(role)) {
      console.log(`[AUTHMIDDLEWARE] Access granted for ${role}`);
      return next();
    }

    console.warn(`[AUTHMIDDLEWARE] Access denied for ${role}, requires: [${allowedRoles.join(', ')}]`);
    return res.status(403).json({ message: 'Forbidden' });
  };
}

// Middleware for token verification that returns JSON response (for /verify endpoint)
function verifyTokenResponseMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const verification = TokenService.verify(token);

  if (!verification.ok) {
    return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }

  res.json({ valid: true, user: verification.payload });
}

module.exports = {
  verifyTokenMiddleware,
  verifyTokenResponseMiddleware,
  // isRegistered: allow LANDLORD and ADMIN (MIGHT NOT NEED THIS)
  isRegistered: roleChecker(['LANDLORD', 'ADMIN']),
  // isAdmin: allow only ADMIN
  isAdmin: roleChecker(['ADMIN']),
};
