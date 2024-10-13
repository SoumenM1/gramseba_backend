const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { protect } = require('../middlewares/authMiddleware');
const {upload} = require('../middlewares/uploadMiddleware')

// Seller creates a shop
router.post('/create', protect, upload.fields([{ name: 'shopImage' }]),shopController.createShop);

// Define the route for getting a single shop by ID
router.get('/shops', protect, shopController.getShopBySellerId);

// Get all shops within 10km radius
router.get('/nearby', shopController.getShopsNearby);

// Search shops by description and location
router.get('/search',shopController.searchShops);

// Route to get shop details by shopId
router.get('/shop-details',  shopController.getShopDetails);

// Route to generate a QR code for a shop
router.get('/:shopId/generateQR', shopController.generateShopQR);


module.exports = router;
