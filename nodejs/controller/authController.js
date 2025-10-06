// authController.js
const authService = require('../services/authService');
const crypto = require('crypto');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = {
  handleTest: async function (req) {
    return true;
  },

  login: async function (req) {
    // validate input minimally
    const { email, password } = req.body || {};
    if (!email || !password) {
      return { status: 400, body: { message: 'email and password required' } };
    }
    if (!emailRegex.test(email)) {
      return { status: 400, body: { message: 'Invalid email format' } };
    }
    const serviceResult = await authService.login({ email, password });
    if (serviceResult.ok) {
      // return token and basic user info
      return { status: 200, body: { message: 'Login successful', token: serviceResult.token, user: serviceResult.user } };
    }
    return { status: 401, body: { message: 'Invalid email or password' } };
  },

  register: async function (req) {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return { status: 400, body: { message: 'email and password required' } };
    }
    if (!emailRegex.test(email)) {
      return { status: 400, body: { message: 'Invalid email format' } };
    }
    const displayName = email.split('@')[0];
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const result = await authService.register({ email, passwordHash, displayName });
    if (result.ok) return { status: 200, body: { message: 'Registration successful', insertId: result.insertId} };
    // Check for duplicate entry (MySQL error code ER_DUP_ENTRY)
    if (result.error && result.error.code === 'ER_DUP_ENTRY') {
      return { status: 409, body: { message: 'Username already exists' } };
    }
    return { status: 500, body: { message: 'Database error' } };
  }
};
