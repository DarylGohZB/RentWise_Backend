const profileService = require('../services/profileService');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = {
  // Used for /test endpoint
  handleTest: async function (req) {
    console.log('[CONTROLLER/PROFILECONTROLLER] handleTest called');
    return true;
  },

  updateProfile: async function (req) {
    const { newEmail, newDisplayName } = req.body || {};
    const user_id = req.user?.user_id;

    console.log('[CONTROLLER/PROFILECONTROLLER] updateProfile attempt for user_id:', user_id);

    // Validate user_id exists (should be set by verifyTokenMiddleware)
    if (!user_id) {
      console.warn('[CONTROLLER/PROFILECONTROLLER] updateProfile failed: missing user_id in request');
      return { status: 401, body: { message: 'User not authenticated' } };
    }

    // Validate at least one field is provided
    if (!newEmail && !newDisplayName) {
      console.warn('[CONTROLLER/PROFILECONTROLLER] updateProfile failed: no fields to update');
      return { status: 400, body: { message: 'At least one field (newEmail or newDisplayName) is required' } };
    }

    // Validate email format if email is provided
    if (newEmail && !emailRegex.test(newEmail)) {
      console.warn('[CONTROLLER/PROFILECONTROLLER] updateProfile failed: invalid email format');
      return { status: 400, body: { message: 'Invalid email format' } };
    }

    // Call service to update profile
    const result = await profileService.updateProfile({
      user_id,
      newEmail,
      newDisplayName,
    });

    if (result.ok) {
      console.log('[CONTROLLER/PROFILECONTROLLER] updateProfile successful for user_id:', user_id);
      return {
        status: 200,
        body: {
          message: 'Profile updated successfully',
          token: result.token,
          user: result.user,
        },
      };
    }

    // Handle duplicate email error
    if (result.error && result.error.code === 'ER_DUP_ENTRY') {
      console.warn('[CONTROLLER/PROFILECONTROLLER] updateProfile failed: email already exists');
      return { status: 409, body: { message: 'Email already exists' } };
    }

    // Handle user not found
    if (result.error && result.error.code === 'USER_NOT_FOUND') {
      console.warn('[CONTROLLER/PROFILECONTROLLER] updateProfile failed: user not found');
      return { status: 404, body: { message: 'User not found' } };
    }

    // Handle unknown errors
    console.error('[CONTROLLER/PROFILECONTROLLER] updateProfile failed:', result.error);
    return {
      status: 500,
      body: {
        message: 'Failed to update profile',
        error: result.error?.message || 'Unknown error',
      },
    };
  },

  // Keep old method name for backward compatibility if needed
  saveUpdatedProfile: async function (req) {
    return await module.exports.updateProfile(req);
  },
};

