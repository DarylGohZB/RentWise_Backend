const express = require('express');
const router = express.Router();
const profileController = require('../controller/profileController');
const { verifyTokenMiddleware } = require('../middleware/AuthMiddleware');

// Basic test endpoint
router.all('/test', async (req, res) => {
  console.log('[ROUTES/PROFILE] /test called');
  try {
    const result = await profileController.handleTest(req);
    console.log('[ROUTES/PROFILE] /test result:', result);
    res.json(result === true);
  } catch (err) {
    console.error('[ROUTES/PROFILE] /test error:', err);
    res.json(false);
  }
});

// PUT /update - Update user profile (requires authentication)
router.put('/update', verifyTokenMiddleware, async (req, res) => {
  console.log('[ROUTES/PROFILE] /update called for user:', req.user?.email || 'unknown');
  try {
    const result = await profileController.updateProfile(req);
    console.log('[ROUTES/PROFILE] /update result:', result.status || 200);
    res.status(result.status || 200).json(result.body);
  } catch (err) {
    console.error('[ROUTES/PROFILE] /update error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
});

module.exports = router;

