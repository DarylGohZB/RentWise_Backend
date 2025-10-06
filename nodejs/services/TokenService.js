const jwt = require('jsonwebtoken');

// Secret used to sign tokens. In production, store this securely (secrets manager).
const SECRET = process.env.JWT_SECRET || 'change-me-to-a-secure-secret';

// Time to live for tokens. Change this value to adjust token expiry (e.g., '1h', '24h').
// You can also expose this via environment variable JWT_TTL.
const TTL = process.env.JWT_TTL || '1h'; // <-- change TTL here or via env JWT_TTL

module.exports = {
  issue: function (userDetails) {
    // Allowed fields: displayName, email, isDisable, user_id, userRole
    const payload = {
      displayName: userDetails.displayName,
      email: userDetails.email,
      isDisable: !!userDetails.isDisable,
      user_id: userDetails.user_id,
      userRole: userDetails.userRole,
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: process.env.JWT_TTL || TTL });
    return token;
  },

  verify: function (token) {
    try {
      const decoded = jwt.verify(token, SECRET);
      return { ok: true, payload: decoded };
    } catch (err) {
      return { ok: false, error: err };
    }
  }
};
