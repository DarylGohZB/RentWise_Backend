const express = require('express');
const router = express.Router();
const mapController = require('../controller/mapController');

router.all('/test', async (req, res) => {
	try {
		const result = await mapController.handleTest(req);
		return res.json(result === true);
	} catch (err) {
		return res.json(false);
	}
});

module.exports = router;
