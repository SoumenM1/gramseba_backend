const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { protect } = require('../middlewares/authMiddleware');

// Seller creates a shop
router.post('/create', protect, shopController.createShop);

// Define the route for getting a single shop by ID
router.get('/shops', protect, shopController.getShopBySellerId);

// Get all shops within 10km radius
router.get('/nearby', shopController.getShopsNearby);

// Search shops by description and location
router.get('/search',shopController.searchShops);

module.exports = router;
