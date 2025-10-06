const TokenService = require('../services/TokenService');

// Express middleware to verify token and attach user payload to req.user
function verifyTokenMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const verification = TokenService.verify(token);
  if (!verification.ok) return res.status(401).json({ message: 'Invalid token' });

  req.user = verification.payload;
  next();
}

// roleChecker factory: checks if user has one of allowed roles
function roleChecker(allowedRoles) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const role = (req.user.userRole || '').toUpperCase();
    if (allowedRoles.includes(role)) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
}

module.exports = {
  verifyTokenMiddleware,
  // isRegistered: allow LANDLORD and ADMIN
  isRegistered: roleChecker(['LANDLORD', 'ADMIN']),
  // isAdmin: allow only ADMIN
  isAdmin: roleChecker(['ADMIN']),
};
