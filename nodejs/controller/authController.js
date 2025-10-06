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
    const result = await authService.login({ email, password });
    if (result.ok) {
      // return token and basic user info
      return { status: 200, body: { message: 'Login successful', token: result.token, user: result.user } };
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
    if (result.ok) return { status: 202, body: { message: 'OTP sent', pendingKey: result.pendingKey, ttl: result.ttl } };
    return { status: 500, body: { message: 'Failed to start registration', error: result.error } };
  },

  confirmRegistration: async function (req) {
    const { email, otp } = req.body || {};
    if (!email || !otp) return { status: 400, body: { message: 'email and otp required' } };
    const result = await authService.confirmRegistration({ email, otp });
    if (result.ok) return { status: 200, body: { message: 'Registration confirmed',token: result.token, user: result.user,insertId: result.insertId} };
    if (result.reason === 'not_found_or_expired') return { status: 410, body: { message: 'OTP expired or not found' } };
    if (result.reason === 'invalid_otp') return { status: 401, body: { message: 'Invalid OTP' } };
    if (result.error && result.error.code === 'ER_DUP_ENTRY') return { status: 409, body: { message: 'User already exists' } };
    return { status: 500, body: { message: 'Failed to confirm registration', error: result.error } };
  }
};
