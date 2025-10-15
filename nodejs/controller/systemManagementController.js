const systemManagementService = require('../services/systemManagementService');

module.exports = {
  // Provide a handleTest function like authController.handleTest that returns true
  handleTest: async function (req) {
    console.log('[CONTROLLER/SYSTEMCONTROLLER] handleTest called');
    return true;
  },
};
