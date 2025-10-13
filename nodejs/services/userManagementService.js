const UserModel = require('../model/UserModel');

module.exports = {
  /**
   * Get all users
   */
  getAllUsers: async function () {
    console.log('[SERVICES/USER_MANAGEMENT] getAllUsers called');
    const result = await UserModel.getAllUsers();
    if (result.ok) {
      console.log('[SERVICES/USER_MANAGEMENT] getAllUsers successful, count:', result.users.length);
    } else {
      console.error('[SERVICES/USER_MANAGEMENT] getAllUsers failed:', result.error);
    }
    return result;
  },

  /**
   * Update user by admin
   */
  updateUserByAdmin: async function (user_id, updateData) {
    console.log('[SERVICES/USER_MANAGEMENT] updateUserByAdmin called for user_id:', user_id);
    const result = await UserModel.updateUserByAdmin(user_id, updateData);
    if (result.ok) {
      console.log('[SERVICES/USER_MANAGEMENT] updateUserByAdmin successful for user_id:', user_id);
    } else {
      console.error('[SERVICES/USER_MANAGEMENT] updateUserByAdmin failed:', result.error);
    }
    return result;
  },

  /**
   * Toggle user disable status
   */
  toggleUserDisable: async function (user_id) {
    console.log('[SERVICES/USER_MANAGEMENT] toggleUserDisable called for user_id:', user_id);
    const result = await UserModel.toggleUserDisable(user_id);
    if (result.ok) {
      console.log('[SERVICES/USER_MANAGEMENT] toggleUserDisable successful for user_id:', user_id);
    } else {
      console.error('[SERVICES/USER_MANAGEMENT] toggleUserDisable failed:', result.error);
    }
    return result;
  },

  /**
   * Delete user by ID
   */
  deleteUserById: async function (user_id) {
    console.log('[SERVICES/USER_MANAGEMENT] deleteUserById called for user_id:', user_id);
    const result = await UserModel.deleteUserById(user_id);
    if (result.ok) {
      console.log('[SERVICES/USER_MANAGEMENT] deleteUserById successful for user_id:', user_id);
    } else {
      console.error('[SERVICES/USER_MANAGEMENT] deleteUserById failed:', result.error);
    }
    return result;
  },
};
