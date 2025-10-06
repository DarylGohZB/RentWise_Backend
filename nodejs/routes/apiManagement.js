const express = require('express');
const router = express.Router();
const apiManagementController = require('../controller/apiManagementController');

router.all('/test', async (req, res) => {
	try {
		const result = await apiManagementController.handleTest(req);
		return res.json(result === true);
	} catch (err) {
		return res.json(false);
	}
});

module.exports = router;
