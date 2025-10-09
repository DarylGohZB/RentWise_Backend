const authService = require('../services/authService');
const crypto = require('crypto');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = {
  // Used for /test endpoint
  handleTest: async function (req) {
    console.log('[CONTROLLER/AUTHCONTROLLER] handleTest called');
    return true;
  },

  login: async function (req) {
    const { email, password } = req.body || {};
    console.log('[CONTROLLER/AUTHCONTROLLER] login attempt:', email || 'missing email');

    // Basic validation
    if (!email || !password) {
      console.warn('[CONTROLLER/AUTHCONTROLLER] login failed: missing email or password');
      return { status: 400, body: { message: 'email and password required' } };
    }
    if (!emailRegex.test(email)) {
      console.warn('[CONTROLLER/AUTHCONTROLLER] login failed: invalid email format');
      return { status: 400, body: { message: 'Invalid email format' } };
    }

    const result = await authService.login({ email, password });

    if (result.ok) {
      console.log('[CONTROLLER/AUTHCONTROLLER] login successful for:', email);
      return {
        status: 200,
        body: {
          message: 'Login successful',
          token: result.token,
          user: result.user,
        },
      };
    }

    console.warn('[CONTROLLER/AUTHCONTROLLER] login failed: invalid credentials for', email);
    return { status: 401, body: { message: 'Invalid email or password' } };
  },

  register: async function (req) {
    const { email, password } = req.body || {};
    console.log('[CONTROLLER/AUTHCONTROLLER] registration attempt:', email || 'missing email');

    if (!email || !password) {
      console.warn('[CONTROLLER/AUTHCONTROLLER] register failed: missing email or password');
      return { status: 400, body: { message: 'email and password required' } };
    }
    if (!emailRegex.test(email)) {
      console.warn('[CONTROLLER/AUTHCONTROLLER] register failed: invalid email format');
      return { status: 400, body: { message: 'Invalid email format' } };
    }

    const displayName = email.split('@')[0];
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const result = await authService.register({ email, passwordHash, displayName });

    if (result.ok) {
      console.log('[CONTROLLER/AUTHCONTROLLER] registration started for:', email);
      return {
        status: 202,
        body: {
          message: 'OTP sent',
          pendingKey: result.pendingKey,
          ttl: result.ttl,
        },
      };
    }

    console.error('[CONTROLLER/AUTHCONTROLLER] register failed:', result.error);
    return {
      status: 500,
      body: {
        message: 'Failed to start registration',
        error: result.error,
      },
    };
  },

  confirmRegistration: async function (req) {
    const { email, otp } = req.body || {};
    console.log('[CONTROLLER/AUTHCONTROLLER] confirmRegistration for:', email || 'missing email');

    if (!email || !otp) {
      console.warn('[CONTROLLER/AUTHCONTROLLER] confirmRegistration failed: missing email or OTP');
      return { status: 400, body: { message: 'email and otp required' } };
    }

    const result = await authService.confirmRegistration({ email, otp });

    if (result.ok) {
      console.log('[CONTROLLER/AUTHCONTROLLER] registration confirmed for:', email);
      return {
        status: 200,
        body: {
          message: 'Registration confirmed',
          token: result.token,
          user: result.user,
          insertId: result.insertId,
        },
      };
    }

    if (result.reason === 'not_found_or_expired') {
      console.warn('[CONTROLLER/AUTHCONTROLLER] OTP expired or not found for:', email);
      return { status: 410, body: { message: 'OTP expired or not found' } };
    }

    if (result.reason === 'invalid_otp') {
      console.warn('[CONTROLLER/AUTHCONTROLLER] Invalid OTP for:', email);
      return { status: 401, body: { message: 'Invalid OTP' } };
    }

    if (result.error && result.error.code === 'ER_DUP_ENTRY') {
      console.warn('[CONTROLLER/AUTHCONTROLLER] Duplicate registration attempt for:', email);
      return { status: 409, body: { message: 'User already exists' } };
    }

    console.error('[CONTROLLER/AUTHCONTROLLER] confirmRegistration failed:', result.error);
    return {
      status: 500,
      body: {
        message: 'Failed to confirm registration',
        error: result.error,
      },
    };
  },
};
