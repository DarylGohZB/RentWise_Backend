const userManagementService = require('../services/userManagementService');

module.exports = {
  /**
   * Test endpoint
   */
  handleTest: async function (req) {
    return true;
  },

  /**
   * Get all users
   */
  getAllUsers: async function (req) {
    try {
      console.log('[CONTROLLER/USER_MANAGEMENT] getAllUsers called');

      const result = await userManagementService.getAllUsers();

      if (result.ok) {
        console.log('[CONTROLLER/USER_MANAGEMENT] getAllUsers successful, count:', result.users.length);
        return { status: 200, body: result.users };
      }

      console.error('[CONTROLLER/USER_MANAGEMENT] getAllUsers failed:', result.error);
      return { status: 500, body: { message: 'Failed to retrieve users', error: result.error } };
    } catch (err) {
      console.error('[CONTROLLER/USER_MANAGEMENT] getAllUsers error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Update user by admin
   */
  updateUserByAdmin: async function (req) {
    try {
      const { userId } = req.params;
      const { displayName, email, userRole, isDisable } = req.body;

      console.log('[CONTROLLER/USER_MANAGEMENT] updateUserByAdmin called for userId:', userId);

      // Validation
      if (!userId) {
        console.warn('[CONTROLLER/USER_MANAGEMENT] updateUserByAdmin failed: missing userId');
        return { status: 400, body: { message: 'userId is required' } };
      }

      // Email validation if provided
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.warn('[CONTROLLER/USER_MANAGEMENT] updateUserByAdmin failed: invalid email format');
        return { status: 400, body: { message: 'Invalid email format' } };
      }

      // UserRole validation if provided
      if (userRole && !['LANDLORD', 'ADMIN', 'TENANT'].includes(userRole)) {
        console.warn('[CONTROLLER/USER_MANAGEMENT] updateUserByAdmin failed: invalid userRole');
        return { status: 400, body: { message: 'Invalid userRole. Must be LANDLORD, ADMIN, or TENANT' } };
      }

      // Build update data object
      const updateData = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (email !== undefined) updateData.email = email;
      if (userRole !== undefined) updateData.userRole = userRole;
      if (isDisable !== undefined) updateData.isDisable = isDisable;

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        console.warn('[CONTROLLER/USER_MANAGEMENT] updateUserByAdmin failed: no fields to update');
        return { status: 400, body: { message: 'No fields to update' } };
      }

      const result = await userManagementService.updateUserByAdmin(userId, updateData);

      if (result.ok) {
        console.log('[CONTROLLER/USER_MANAGEMENT] updateUserByAdmin successful for userId:', userId);
        return { status: 200, body: { message: 'User updated successfully' } };
      }

      // Handle specific errors
      if (result.error?.code === 'EMAIL_EXISTS') {
        console.warn('[CONTROLLER/USER_MANAGEMENT] updateUserByAdmin failed: email already exists');
        return { status: 409, body: { message: 'Email already exists' } };
      }

      if (result.error?.code === 'USER_NOT_FOUND') {
        console.warn('[CONTROLLER/USER_MANAGEMENT] updateUserByAdmin failed: user not found');
        return { status: 404, body: { message: 'User not found' } };
      }

      console.error('[CONTROLLER/USER_MANAGEMENT] updateUserByAdmin failed:', result.error);
      return { status: 500, body: { message: 'Failed to update user', error: result.error } };
    } catch (err) {
      console.error('[CONTROLLER/USER_MANAGEMENT] updateUserByAdmin error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Toggle user disable status
   */
  toggleUserDisable: async function (req) {
    try {
      const { userId } = req.params;

      console.log('[CONTROLLER/USER_MANAGEMENT] toggleUserDisable called for userId:', userId);

      // Validation
      if (!userId) {
        console.warn('[CONTROLLER/USER_MANAGEMENT] toggleUserDisable failed: missing userId');
        return { status: 400, body: { message: 'userId is required' } };
      }

      const result = await userManagementService.toggleUserDisable(userId);

      if (result.ok) {
        console.log('[CONTROLLER/USER_MANAGEMENT] toggleUserDisable successful for userId:', userId);
        return { status: 200, body: { message: 'User status toggled successfully' } };
      }

      if (result.error?.code === 'USER_NOT_FOUND') {
        console.warn('[CONTROLLER/USER_MANAGEMENT] toggleUserDisable failed: user not found');
        return { status: 404, body: { message: 'User not found' } };
      }

      console.error('[CONTROLLER/USER_MANAGEMENT] toggleUserDisable failed:', result.error);
      return { status: 500, body: { message: 'Failed to toggle user status', error: result.error } };
    } catch (err) {
      console.error('[CONTROLLER/USER_MANAGEMENT] toggleUserDisable error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Delete user by ID
   */
  deleteUserById: async function (req) {
    try {
      const { userId } = req.params;

      console.log('[CONTROLLER/USER_MANAGEMENT] deleteUserById called for userId:', userId);

      // Validation
      if (!userId) {
        console.warn('[CONTROLLER/USER_MANAGEMENT] deleteUserById failed: missing userId');
        return { status: 400, body: { message: 'userId is required' } };
      }

      const result = await userManagementService.deleteUserById(userId);

      if (result.ok) {
        console.log('[CONTROLLER/USER_MANAGEMENT] deleteUserById successful for userId:', userId);
        return { status: 200, body: { message: 'User deleted successfully' } };
      }

      if (result.error?.code === 'USER_NOT_FOUND') {
        console.warn('[CONTROLLER/USER_MANAGEMENT] deleteUserById failed: user not found');
        return { status: 404, body: { message: 'User not found' } };
      }

      console.error('[CONTROLLER/USER_MANAGEMENT] deleteUserById failed:', result.error);
      return { status: 500, body: { message: 'Failed to delete user', error: result.error } };
    } catch (err) {
      console.error('[CONTROLLER/USER_MANAGEMENT] deleteUserById error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Get user statistics
   */
  getUserStats: async function (req) {
    try {
      console.log('[CONTROLLER/USER_MANAGEMENT] getUserStats called');

      const result = await userManagementService.getUserStats();

      if (result.ok) {
        console.log('[CONTROLLER/USER_MANAGEMENT] getUserStats successful');
        return { status: 200, body: result.stats };
      }

      console.error('[CONTROLLER/USER_MANAGEMENT] getUserStats failed:', result.error);
      return { status: 500, body: { message: 'Failed to retrieve user statistics', error: result.error } };
    } catch (err) {
      console.error('[CONTROLLER/USER_MANAGEMENT] getUserStats error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },
};
