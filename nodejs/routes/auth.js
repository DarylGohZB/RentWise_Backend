const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');

router.all('/test', async (req, res) => {
  try {
    const result = await authController.handleTest(req);
    return res.json(result === true);
  } catch (err) {
    return res.json(false);
  }
});

// POST /login  (moved from authLogin.js)
router.post('/login', async (req, res) => {
  try {
    const result = await authController.login(req);
    return res.status(result.status || 200).json(result.body);
  } catch (err) {
    console.error('Auth route error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// POST /register (moved from model/register.js)

router.post('/register', async (req, res) => {
  try {
    const result = await authController.register(req);
    return res.status(result.status || 200).json(result.body);
  } catch (err) {
    console.error('Register route error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.post('/register/confirm', async (req, res) => {
  try {
    const result = await authController.confirmRegistration(req);
    return res.status(result.status || 200).json(result.body);
  } catch (err) {
    console.error('Confirm registration route error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

module.exports = router;
