const UserModel = require('../model/UserModel');
const TokenService = require('./TokenService');
const crypto = require('crypto');

module.exports = {
    login: async function ({ email, password }) {
    // Hash password with SHA256 (same as original)
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    try {
        const user = await UserModel.getUser(email, hash);
        if (!user) return { ok: false };
        // build user details for token
        const userDetails = {
        displayName: user.displayName || user.username || '',
        email: user.email || '',
        isDisable: !!user.isDisable,
        user_id: user.user_id,
        userRole: (user.userRole || 'LANDLORD').toUpperCase(),
        };
        const token = TokenService.issue(userDetails);
        return { ok: true, token, user: userDetails };
    } 
    catch (err) {
        console.error('authService.login error', err);
        return { ok: false };
    }
    },

    register: async function ({ email, passwordHash, displayName }) {
            // store pending registration in redis and send OTP
            const payload = { email, passwordHash, displayName };
            try {
                const otpRes = await require('./OTPService').startRegistration(email, payload);
                // send email via MailService (placeholder credentials must be set)
                await require('./MailService').sendRegistrationOtp(email, otpRes.otp);
                return { ok: true, pendingKey: otpRes.key, ttl: otpRes.ttl };
            } catch (err) {
                console.error('authService.register error', err);
                return { ok: false, error: err };
            }
    },

    confirmRegistration: async function ({ email, otp }) {
        try {
            const verify = await require('./OTPService').verifyRegistration(email, otp);
            if (!verify.ok) return { ok: false, reason: verify.reason };
            const payload = verify.payload;
            // create user in DB
            const result = await UserModel.createUser(payload.email, payload.passwordHash, payload.displayName);
            if (result.ok) return { ok: true, insertId: result.insertId };
            return { ok: false, error: result.error };
        } catch (err) {
            console.error('authService.confirmRegistration error', err);
            return { ok: false, error: err };
        }
    }
};
