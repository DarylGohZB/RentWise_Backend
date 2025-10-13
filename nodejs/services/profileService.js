const UserModel = require('../model/UserModel');
const TokenService = require('./TokenService');

module.exports = {
  updateProfile: async function ({ user_id, newEmail, newDisplayName }) {
    console.log('[SERVICES/PROFILESERVICE] updateProfile called for user_id:', user_id);

    try {
      // Call UserModel to update the profile
      const result = await UserModel.updateUserProfile(user_id, newEmail, newDisplayName);

      if (!result.ok) {
        console.warn('[SERVICES/PROFILESERVICE] updateProfile failed:', result.error);
        return { ok: false, error: result.error };
      }

      // Fetch updated user data
      const updatedUser = await UserModel.getUserById(user_id);
      
      if (!updatedUser) {
        console.error('[SERVICES/PROFILESERVICE] Failed to fetch updated user data');
        return { ok: false, error: { message: 'Failed to fetch updated user data' } };
      }

      // Generate new JWT token with updated user data
      const userDetails = {
        displayName: updatedUser.displayName || '',
        email: updatedUser.email || '',
        isDisable: !!updatedUser.isDisable,
        user_id: updatedUser.user_id,
        userRole: (updatedUser.userRole || 'LANDLORD').toUpperCase(),
      };

      const token = TokenService.issue(userDetails);

      console.log('[SERVICES/PROFILESERVICE] updateProfile successful for user_id:', user_id);
      return { 
        ok: true, 
        affectedRows: result.affectedRows,
        token,
        user: userDetails,
      };
    } catch (err) {
      console.error('[SERVICES/PROFILESERVICE] updateProfile error:', err);
      return { ok: false, error: err };
    }
  },
};
