const express = require('express');
const router = express.Router();
const systemSettingsController = require('../controller/systemSettingsController');
const AuthMiddleware = require('../middleware/AuthMiddleware');

// Basic test endpoint for system management (no auth required, mirrors /api/auth/test)
router.all('/test', async (req, res) => {
	console.log('[ROUTES/SYSTEM] /test called');
	try {
		const result = await systemSettingsController.handleTest(req);
		console.log('[ROUTES/SYSTEM] /test result:', result);
		res.json(result === true);
	} catch (err) {
		console.error('[ROUTES/SYSTEM] /test error:', err);
		res.json(false);
	}
});

router.get('/getSecuritySettings', AuthMiddleware.verifyTokenMiddleware,  AuthMiddleware.isAdmin, systemSettingsController.getSecuritySettings);
router.post('/updateSecuritySettings',  AuthMiddleware.verifyTokenMiddleware,  AuthMiddleware.isAdmin, systemSettingsController.updateSecuritySettings);

module.exports = router;
