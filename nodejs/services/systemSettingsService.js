const SystemSettingsModel = require('../model/SystemSettingsModel');

module.exports = {
  async getSecuritySettings() {
    const allSettings = await SystemSettingsModel.getAllSettings();
    return {
      twoFactorEnabled: allSettings['2fa_enabled'] === 'true',
      sessionTimeout: parseInt(allSettings['session_timeout']) || 30, // default: 30 mins
    };
  },

  async updateSecuritySettings({ twoFactorEnabled, sessionTimeout }) {
    await SystemSettingsModel.setSetting('2fa_enabled', twoFactorEnabled ? 'true' : 'false');
    await SystemSettingsModel.setSetting('session_timeout', sessionTimeout.toString());
  }
};
