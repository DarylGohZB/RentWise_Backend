const express = require('express');
const router = express.Router();
const searchController = require('../controller/searchController');

router.all('/test', async (req, res) => {
	try {
		const result = await searchController.handleTest(req);
		return res.json(result === true);
	} catch (err) {
		return res.json(false);
	}
});

module.exports = router;
