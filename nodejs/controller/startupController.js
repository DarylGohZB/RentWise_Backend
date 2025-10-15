const startupService = require('../services/startupService');

module.exports = {
  runStartupSync: async function () {
    return await startupService.runStartupSync();
  }
};

