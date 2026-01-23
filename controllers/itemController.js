const Item = require('../models/Item');
const Shop = require('../models/Shop');
const { cloudinary } = require('../config/cloudinaryConfig');
const fs = require('fs');
const path = require('path');

// Helper function to check if the authenticated user is the seller of the shop
const isSellerOfShop = async (shopId, userId) => {
  const shop = await Shop.findById(shopId);
  if (!shop) return false;
  return shop.seller.toString() === userId.toString();
};
// Create a new item
exports.createItem = async (req, res, next) => {
  try {
    const { shopId, title, description, price, phone } = req.body;
    // const itemImage = req.file; // Multer's single file
    // if (!shopId || !title || !description || !price || !itemImage) {
    //   // Remove the uploaded file if validation fails
    //   if (itemImage && fs.existsSync(itemImage.path)) {
    //     fs.unlinkSync(itemImage.path);
    //   }
    //   return res.status(400).json({ success: false, message: 'All fields are required.' });
    // }
    // const isSeller = await isSellerOfShop(shopId, req.user._id);
    // if (!isSeller) {
    //   // Remove the uploaded file if user is not the seller
    //   if (itemImage && fs.existsSync(itemImage.path)) {
    //     fs.unlinkSync(itemImage.path);
    //   }
    //   return res.status(403).json({ success: false, message: 'You are not authorized to add items to this shop.' });
    // }
    // // Upload the image to Cloudinary
    // const uploadResult = await cloudinary.uploader.upload(itemImage.path, {
    //   folder: 'gram_bazer/items',
    //   public_id: `item-${shopId}-${Date.now()}`,
    //   resource_type: 'image',
    //   transformation: [
    //     { width: 800, height: 800, crop: 'limit' }, 
    //     { quality: 'auto:good' }, 
    //     { fetch_format: 'auto' }
    //   ]
    // });
    // const imageUrl = uploadResult.secure_url;
    // // Remove the local image file after uploading
    // fs.unlinkSync(itemImage.path);

    // Create the new item
    const item = new Item({
      title,
      // description,
      // price,
      // imageUrl,
      // shop: shopId,
      phone: phone
    });

    await item.save();

    res.status(201).json({
      success: true,
      message: 'Item created successfully.',
      item,
    });
  } catch (error) {
    console.error('Error creating item:', error);
    // Remove the uploaded file in case of any error
  //   if (req.file && fs.existsSync(req.file.path)) {
  //     fs.unlinkSync(req.file.path);
  //   }
  //   next(error);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { id } = req.params; // Item ID from URL
    const { title, description, price } = req.body;
    const itemImage = req.file; // Optional: new image file

    // Find the item by ID
    const item = await Item.findById(id);
    if (!item) {
      // Remove the uploaded file if item not found
      if (itemImage && fs.existsSync(itemImage.path)) {
        fs.unlinkSync(itemImage.path);
      }
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    // Check if the authenticated user is the seller of the shop
    const isSeller = await isSellerOfShop(item.shop, req.user._id);
    if (!isSeller) {
      // Remove the uploaded file if user is not the seller
      if (itemImage && fs.existsSync(itemImage.path)) {
        fs.unlinkSync(itemImage.path);
      }
      return res.status(403).json({ success: false, message: 'You are not authorized to update this item.' });
    }

    // Prepare the update object
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (price) updateData.price = price;

    // If a new image is uploaded, handle Cloudinary upload and delete the old image
    if (itemImage) {
      // Upload the new image to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(itemImage.path, {
        folder: 'gram_bazer/items',
        public_id: `item-${item.shop}-${Date.now()}`,
        resource_type: 'image',
      });

      const newImageUrl = uploadResult.secure_url;
      updateData.imageUrl = newImageUrl;

      // Remove the local image file after uploading
      fs.unlinkSync(itemImage.path);

      // Optionally, delete the old image from Cloudinary
      // Extract public ID from the old image URL
      const oldImageUrl = item.imageUrl;
      const oldPublicId = path.basename(oldImageUrl, path.extname(oldImageUrl)).split('/').pop(); // Assumes standard Cloudinary URL structure
      await cloudinary.uploader.destroy(`gram_bazer/items/${oldPublicId}`, { resource_type: 'image' });
    }

    // Update the item
    const updatedItem = await Item.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      success: true,
      message: 'Item updated successfully.',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error updating item:', error);
    // Remove the uploaded file in case of any error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};
// Delete an item
exports.deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params; // Item ID from URL

    // Find the item by ID
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    // Check if the authenticated user is the seller of the shop
    const isSeller = await isSellerOfShop(item.shop, req.user._id);
    if (!isSeller) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this item.' });
    }

    // Extract public ID from the image URL
    const imageUrl = item.imageUrl;
    const publicId = path.basename(imageUrl, path.extname(imageUrl)).split('/').pop(); // Assumes standard Cloudinary URL structure

    // Delete the image from Cloudinary
    await cloudinary.uploader.destroy(`gram_bazer/items/${publicId}`, { resource_type: 'image' });

    // Delete the item from the database
    await Item.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    next(error);
  }
};
