const express = require('express');
const router = express.Router();
const adminListingController = require('../controller/adminListingController');

router.all('/test', async (req, res) => {
	try {
		const result = await adminListingController.handleTest(req);
		if (result === true) return res.json(true);
		return res.json(false);
	} catch (err) {
		// In case controller throws, return false per instruction
		return res.json(false);
	}
});

module.exports = router;
