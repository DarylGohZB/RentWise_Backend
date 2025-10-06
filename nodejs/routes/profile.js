const express = require('express');
const router = express.Router();
const profileController = require('../controller/profileController');

router.all('/test', async (req, res) => {
	try {
		const result = await profileController.handleTest(req);
		return res.json(result === true);
	} catch (err) {
		return res.json(false);
	}
});

module.exports = router;
