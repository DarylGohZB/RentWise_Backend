const express = require('express');
const router = express.Router();
const listingManagementController = require('../controller/listingManagementController');
const AuthMiddleware = require('../middleware/AuthMiddleware');

// Test endpoint
router.all('/test', listingManagementController.test);

// Get all listings pending review (Admin only)
router.get('/pending', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, listingManagementController.getPendingListings);

// Get specific listing for review (Admin only)
router.get('/review/:listingId', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, listingManagementController.getListingForReview);

// Approve listing (Admin only)
router.post('/approve/:listingId', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, listingManagementController.approveListing);

// Reject listing (Admin only)
router.post('/reject/:listingId', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, listingManagementController.rejectListing);

// Request more information from landlord (Admin only)
router.post('/request-info/:listingId', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, listingManagementController.requestMoreInfo);

// Get review statistics (Admin only)

router.get('/stats', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, listingManagementController.getStatistics);

// Get count of listings created today (Admin only)
router.get('/today-count', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, listingManagementController.getTodayListings);

router.get('/total-count', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, listingManagementController.getAllListingsCount);

module.exports = router;
