const express = require('express');
const router = express.Router();
const enquiryController = require('../controller/enquiryController');

router.all('/test', async (req, res) => {
	try {
		const result = await enquiryController.handleTest(req);
		return res.json(result === true);
	} catch (err) {
		return res.json(false);
	}
});

module.exports = router;
