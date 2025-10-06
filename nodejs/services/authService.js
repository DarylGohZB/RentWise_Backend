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
        
        const result = await UserModel.createUser(email, passwordHash, displayName);
        console.log(result)
        if (result.ok) return { ok: true, insertId: result.insertId};
        return { ok: false, error: result.error };
    }
};
