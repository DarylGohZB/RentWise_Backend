const systemSettingsService = require('../services/systemSettingsService');

module.exports = {
  /**
   * Test endpoint
   */
  handleTest: async function (req) {
    return true;
  },

  async getSecuritySettings(req, res) {
    try {
      const settings = await systemSettingsService.getSecuritySettings();
      res.json({ success: true, settings });
    } catch (error) {
      console.error('[SYSTEM_SETTINGS_CONTROLLER] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to load settings' });
    }
  },

  async updateSecuritySettings(req, res) {
    try {
      const { twoFactorEnabled, sessionTimeout } = req.body;
      await systemSettingsService.updateSecuritySettings({ twoFactorEnabled, sessionTimeout });
      res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
      console.error('[SYSTEM_SETTINGS_CONTROLLER] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
  }
};
