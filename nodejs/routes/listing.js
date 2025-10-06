const express = require('express');
const router = express.Router();
const listingController = require('../controller/listingController');

router.all('/test', async (req, res) => {
	try {
		const result = await listingController.handleTest(req);
		return res.json(result === true);
	} catch (err) {
		return res.json(false);
	}
});

module.exports = router;
