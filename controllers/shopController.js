const cloudinary = require('cloudinary').v2; // Ensure you have Cloudinary properly configured
const QRCode = require('qrcode');
const Shop = require('../models/Shop');
const Item = require('../models/Item')
const fs = require('fs');

exports.createShop = async (req, res, next) => {
  try {
    const { shopName, category, openAndCloseTime, description_e, description_b, address, coordinates } = req.body;

    // Check if the user is a seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can create shops' });
    }

    // Ensure all required fields are present
    if (!shopName || !category || !openAndCloseTime || !description_e || !description_b || !address || !coordinates) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if a shop with the same name already exists
    const existingShop = await Shop.findOne({ shopName, seller: req.user._id });
    if (existingShop) {
      return res.status(409).json({ message: 'Shop already exists' });
    }

    // Upload shop image if provided
    let shopImageUrl = '';
    if (req.files?.shopImage) {
      const result = await cloudinary.uploader.upload(req.files.shopImage[0].path, {
        folder: 'gram_bazer/shops',
        public_id: `shop-${req.user._id}-${Date.now()}`,
        resource_type: 'image',
      });
      shopImageUrl = result.secure_url;

      // Remove the local file after upload
      fs.unlinkSync(req.files.shopImage[0].path);
    }

    // Parse coordinates
    function getCoordinates(jsonString) {
      const data = JSON.parse(jsonString);
      return [data.lon, data.lat];
    }

    // Create a new shop instance
    const shop = new Shop({
      shopName,
      category,
      shopImage: shopImageUrl,
      openAndCloseTime,
      description_e, // English description
      description_b, // Bengali description
      address,
      location: {
        type: 'Point',
        coordinates: getCoordinates(coordinates), // [longitude, latitude]
      },
      seller: req.user._id, // The current authenticated user
    });

    // Save the shop in the database
    await shop.save();
    res.status(201).json({ success: true, shop });
  } catch (error) {
    console.error('Error creating shop:', error);
    next(error);
  }
};

// Controller function to get a shop by seller ID
exports.getShopBySellerId = async (req, res) => {
  try {
    const sellerId = req.user.id; // Get the seller ID from the request parameters

    // Find the shop by seller ID and populate seller info
    const shop = await Shop.findOne({ seller: sellerId }).populate('seller', 'name email');

    // If the shop doesn't exist, return a 404 response
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    // If the shop is found, return it as the response
    res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    console.error('Error fetching shop:', error);

    // Return a 500 response if there's a server error
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// Get all shops within 10km of a given location
exports.getShopsNearby = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'Please provide longitude and latitude' });
    }

    const shops = await Shop.find(
      {
      location: {
        $geoWithin: {
          $centerSphere: [
            [longitude, latitude],  // [longitude, latitude]
            10 / 6378.1  // 10km in radians (radius of Earth = 6378.1 km)
          ]
        }  
      }
    }
  ).populate('seller');

    res.status(200).json({ success: true, shops });
  } catch (error) {
    next(error);
  }
};


// Search for shops within a 10km radius and matching description
exports.searchShops = async (req, res, next) => {
    try {
      const { description, longitude, latitude } = req.query;
  
      if (!longitude || !latitude) {
        return res.status(400).json({ message: 'Please provide both longitude and latitude' });
      }
  
      // Convert the radius to meters (10km = 10000 meters)
      const radius = 10000;
  
      // Geospatial query and text search combined
      const shops = await Shop.find({
        $text: { $search: description },
        location: {
          $geoWithin: {
            $centerSphere: [[longitude, latitude], radius / 6378.1]  // Earth radius in kilometers
          }
        }
      });
  
      res.status(200).json({ success: true, shops });
    } catch (error) {
      next(error);
    }
  };

  // Controller to get shop details by shopId
exports.getShopDetails = async (req, res, next) => {
  try {
    const { shopId } = req.query;

    // Validate that shopId is provided
    if (!shopId) {
      return res.status(400).json({ success: false, message: 'shopId is required in query parameters.' });
    }

    // Find the shop by ID and populate the seller details
    const shop = await Shop.findById(shopId)
      .populate({
        path: 'seller',
        select: '-password -__v', // Exclude sensitive fields
      })
      .lean(); // Convert to plain JavaScript object

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found.' });
    }

    // Fetch all items associated with the shop
    const items = await Item.find({ shop: shopId }).select('-shop').lean();

    res.status(200).json({
      success: true,
      shop,
      items,
    });
  } catch (error) {
    console.error('Error fetching shop details:', error);
    next(error); // Pass the error to the global error handler
  }
};

// Function to generate shop QR code and save it to Cloudinary and DB
exports.generateShopQR = async (req, res, next) => {
  try {
    const shopId = req.params.shopId;
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    const shopUrl = `https://grambazer.gramsaba.in/shop/${shopId}`;
    // Check if QR code already exists
    if (shop.qrCodeUrl) {
      return res.status(200).json({
        success: true,
        message: 'QR code already exists', 
        qrCodeUrl: shop.qrCodeUrl,
        seller:shop.shopName,
        shopurl:shopUrl
      });
    }

    // Generate the QR code URL
    const qrCodeDataURL = await QRCode.toDataURL(shopUrl);

    // Upload the QR code to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(qrCodeDataURL, {
      folder: 'shop_qrcodes',
      public_id: `shop_qr_${shopId}`,
      overwrite: true,
      format: 'png'
    });

    // Save the Cloudinary URL in the database
    shop.qrCodeUrl = uploadResponse.secure_url;
    await shop.save();

    // Send the response with the QR code URL
    res.status(201).json({
      success: true,
      message: 'QR code generated and saved successfully',
      qrCodeUrl: shop.qrCodeUrl,
      seller:shop.shopName,
      shopurl:shopUrl
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    next(error); // Handle errors
  }
};