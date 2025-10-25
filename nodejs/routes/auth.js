const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { verifyTokenResponseMiddleware } = require('../middleware/AuthMiddleware');

// Basic test endpoint
router.all('/test', async (req, res) => {
  console.log('[ROUTES/AUTH] /test called');
  try {
    const result = await authController.handleTest(req);
    console.log('[ROUTES/AUTH] /test result:', result);
    res.json(result === true);
  } catch (err) {
    console.error('[ROUTES/AUTH] /test error:', err);
    res.json(false);
  }
});

// POST /login  (moved from authLogin.js)
router.post('/login', async (req, res) => {
  console.log('[ROUTES/AUTH] /login attempt:', req.body?.email || 'unknown user');
  try {
    const result = await authController.login(req);
    console.log('[ROUTES/AUTH] /login result:', result.status || 200);
    res.status(result.status || 200).json(result.body);
  } catch (err) {
    console.error('[ROUTES/AUTH] /login error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
});

// POST /register (moved from model/register.js)
router.post('/register', async (req, res) => {
  console.log('[ROUTES/AUTH] /register attempt:', req.body?.email || 'unknown user');
  try {
    const result = await authController.register(req);
    console.log('[ROUTES/AUTH] /register result:', result.status || 200);
    res.status(result.status || 200).json(result.body);
  } catch (err) {
    console.error('[ROUTES/AUTH] /register error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
});

router.post('/register/confirm', async (req, res) => {
  console.log('[ROUTES/AUTH] /register/confirm for:', req.body?.email || 'unknown user');
  try {
    const result = await authController.confirmRegistration(req);
    console.log('[ROUTES/AUTH] /register/confirm result:', result.status || 200);
    res.status(result.status || 200).json(result.body);
  } catch (err) {
    console.error('[ROUTES/AUTH] /register/confirm error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
});

// GET /verify (simple JWT validity check)
router.get('/verify', verifyTokenResponseMiddleware);

// POST /refresh - Refresh access token using refresh token
router.post('/refresh', async (req, res) => {
  console.log('[ROUTES/AUTH] /refresh called');
  try {
    const result = await authController.refreshAccessToken(req);
    console.log('[ROUTES/AUTH] /refresh result:', result.status || 200);
    res.status(result.status || 200).json(result.body);
  } catch (err) {
    console.error('[ROUTES/AUTH] /refresh error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
});

// POST /logout - Revoke refresh token
router.post('/logout', async (req, res) => {
  console.log('[ROUTES/AUTH] /logout called');
  try {
    const result = await authController.logout(req);
    console.log('[ROUTES/AUTH] /logout result:', result.status || 200);
    res.status(result.status || 200).json(result.body);
  } catch (err) {
    console.error('[ROUTES/AUTH] /logout error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
});

module.exports = router;