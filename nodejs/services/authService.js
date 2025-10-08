const UserModel = require('../model/UserModel');
const TokenService = require('./TokenService');
const OTPService = require('./OTPService');
const MailService = require('./MailService');
const crypto = require('crypto');

module.exports = {
  login: async function ({ email, password }) {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    console.log('[SERVICES/AUTHSERVICE] login attempt:', email);

    try {
      const user = await UserModel.getUser(email, hash);
      if (!user) {
        console.warn('[SERVICES/AUTHSERVICE] login failed: user not found for', email);
        return { ok: false };
      }

      const userDetails = {
        displayName: user.displayName || user.username || '',
        email: user.email || '',
        isDisable: !!user.isDisable,
        user_id: user.user_id,
        userRole: (user.userRole || 'LANDLORD').toUpperCase(),
      };

      const token = TokenService.issue(userDetails);

      console.log('[SERVICES/AUTHSERVICE] login successful for:', email);
      return { ok: true, token, user: userDetails };
    } catch (err) {
      console.error('[SERVICES/AUTHSERVICE] login error:', err);
      return { ok: false };
    }
  },

  register: async function ({ email, passwordHash, displayName }) {
    console.log('[SERVICES/AUTHSERVICE] registration started for:', email);

    try {
      const exists = await UserModel.checkEmailExists(email);
      if (exists && exists.ok === false) {
        console.warn('[SERVICES/AUTHSERVICE] registration blocked: email already registered -', email);
        return { ok: false, error: exists.error };
      }

      const payload = { email, passwordHash, displayName };
      const otpRes = await OTPService.startRegistration(email, payload);

      console.log('[SERVICES/AUTHSERVICE] OTP generated and stored for:', email);

      await MailService.sendRegistrationOtp(email, otpRes.otp);
      console.log('[SERVICES/AUTHSERVICE] OTP email sent to:', email);

      return {
        ok: true,
        pendingKey: otpRes.key,
        ttl: otpRes.ttl,
      };
    } catch (err) {
      console.error('[SERVICES/AUTHSERVICE] registration error:', err);
      return { ok: false, error: err };
    }
  },

  confirmRegistration: async function ({ email, otp }) {
    console.log('[SERVICES/AUTHSERVICE] confirmRegistration called for:', email);

    try {
      const verify = await OTPService.verifyRegistration(email, otp);

      if (!verify.ok) {
        console.warn('[SERVICES/AUTHSERVICE] OTP verification failed for:', email, '| Reason:', verify.reason);
        return { ok: false, reason: verify.reason };
      }

      const payload = verify.payload;

      const result = await UserModel.createUser(payload.email, payload.passwordHash, payload.displayName);
      if (!result.ok) {
        console.warn('[SERVICES/AUTHSERVICE] DB user creation failed for:', email);
        return { ok: false, error: result.error };
      }

      const user = await UserModel.getUser(payload.email, payload.passwordHash);

      const userDetails = {
        displayName: user.displayName,
        email: user.email,
        isDisable: !!user.isDisable,
        user_id: user.user_id,
        userRole: user.userRole.toUpperCase(),
      };

      const token = TokenService.issue(userDetails);

      console.log('[SERVICES/AUTHSERVICE] registration confirmed and user created for:', email);

      return {
        ok: true,
        token,
        user: userDetails,
        insertId: result.insertId,
      };
    } catch (err) {
      console.error('[SERVICES/AUTHSERVICE] confirmRegistration error:', err);
      return { ok: false, error: err };
    }
  },
};
