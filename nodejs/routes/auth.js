const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const TokenService = require('../services/TokenService');

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
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const verification = TokenService.verify(token);

  if (!verification.ok) {
    return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }

  res.json({ valid: true, user: verification.payload });
});

module.exports = router;