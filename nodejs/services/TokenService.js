const jwt = require('jsonwebtoken');

// Secret used to sign tokens. In production, store this securely (secrets manager).
const SECRET = process.env.JWT_SECRET || 'change-me-to-a-secure-secret';

// Time to live for tokens. Adjust via JWT_TTL or default to 1 hour.
const TTL = process.env.JWT_TTL || '1h';

module.exports = {
  issue: function (userDetails) {
    const payload = {
      displayName: userDetails.displayName,
      email: userDetails.email,
      isDisable: !!userDetails.isDisable,
      user_id: userDetails.user_id,
      userRole: userDetails.userRole,
    };

    try {
      const token = jwt.sign(payload, SECRET, { expiresIn: TTL });
      console.log(`[SERVICES/TOKENSERVICE] Issued token for ${payload.email} (role: ${payload.userRole}, ttl: ${TTL})`);
      return token;
    } catch (err) {
      console.error('[SERVICES/TOKENSERVICE] Error issuing token:', err);
      throw err;
    }
  },

  verify: function (token) {
    try {
      const decoded = jwt.verify(token, SECRET);
      console.log(`[SERVICES/TOKENSERVICE] Verified token for ${decoded.email} (role: ${decoded.userRole})`);
      return { ok: true, payload: decoded };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        console.warn('[SERVICES/TOKENSERVICE] Verification failed: token expired');
      } else {
        console.warn('[SERVICES/TOKENSERVICE] Verification failed:', err.message);
      }
      return { ok: false, error: err };
    }
  },
};
