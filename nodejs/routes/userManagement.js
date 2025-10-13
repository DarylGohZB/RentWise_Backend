const express = require('express');
const router = express.Router();
const userManagementController = require('../controller/userManagementController');
const { verifyTokenMiddleware, isAdmin } = require('../middleware/AuthMiddleware');

// Basic test endpoint
router.all('/test', async (req, res) => {
  console.log('[ROUTES/USER_MANAGEMENT] /test called');
  try {
    const result = await userManagementController.handleTest(req);
    console.log('[ROUTES/USER_MANAGEMENT] /test result:', result);
    res.json(result === true);
  } catch (err) {
    console.error('[ROUTES/USER_MANAGEMENT] /test error:', err);
    res.json(false);
  }
});

// GET /api/usermanagement/users - Get all users
router.get('/users', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const result = await userManagementController.getAllUsers(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTE/USER_MANAGEMENT] getAllUsers error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/usermanagement/user/:userId - Update user by admin
router.put('/user/:userId', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const result = await userManagementController.updateUserByAdmin(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTE/USER_MANAGEMENT] updateUserByAdmin error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/usermanagement/user/:userId/disable - Toggle user disable status
router.put('/user/:userId/disable', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const result = await userManagementController.toggleUserDisable(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTE/USER_MANAGEMENT] toggleUserDisable error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/usermanagement/user/:userId - Delete user
router.delete('/user/:userId', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const result = await userManagementController.deleteUserById(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTE/USER_MANAGEMENT] deleteUserById error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
