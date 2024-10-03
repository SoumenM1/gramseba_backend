const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { protect } = require('../middlewares/authMiddleware');

// Create a new offer (Organizations only)
router.post('/create', protect, offerController.createOffer);

// Get all offers within 10km range for a user
router.get('/location', offerController.getOffersByLocation);

module.exports = router;
