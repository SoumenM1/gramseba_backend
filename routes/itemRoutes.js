const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController')
const {upload }= require('../middlewares/uploadMiddleware')
const { protect } = require('../middlewares/authMiddleware');

router.post('/create',protect, upload.single('itemImage'),itemController.createItem);

router.put('/update',itemController.updateItem);

router.delete('/delete',itemController.deleteItem);

module.exports = router;
