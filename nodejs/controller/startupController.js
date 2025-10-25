const startupService = require('../services/startupService');

module.exports = {
  runStartupSync: async function () {
    return await startupService.runStartupSync();
  },
  ensureTables: async function () {
    return await startupService.ensureTables();
  }
};

