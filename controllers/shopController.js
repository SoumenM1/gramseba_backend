const { toArray } = require('cluster/lib/utils');
const Shop = require('../models/Shop');

// Create a new shop (Seller only)
exports.createShop = async (req, res, next) => {
  try {
    const { shopName, shopImage, openAndCloseTime, description_e, description_b, address, coordinates } = req.body;

    // Check if the user is a seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can create shops' });
    }
    // Ensure all required fields are present
    if (!shopName || !openAndCloseTime || !description_e || !description_b || !address || !coordinates) {
    
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
  
    function getCoordinates(jsonString) {
      // Parse the JSON string into an object
      const data = JSON.parse(jsonString);
      // Return the coordinates as an array
      return [data.lon, data.lat];
  }   

  // Check if a shop with the same name already exists
    const existingShop = await Shop.findOne({ shopName, seller: req.user._id });
    if (existingShop) {
      return res.status(409).json({ message: 'Shop already exists' });
    }
    // Create a new shop instance
    const shop = new Shop({
      shopName,
      shopImage,
      openAndCloseTime,
      description_e, // English description
      description_b, // Bengali description
      address,
      location: {
        type: 'Point',
        coordinates: getCoordinates(coordinates),  // [longitude, latitude] from req.body
      },
      seller: req.user._id, // The current authenticated user
    });

    // // Save the shop in the database
    await shop.save();
    res.status(201).json({ success: true ,shop});
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
    //   {
    //   location: {
    //     $geoWithin: {
    //       $centerSphere: [
    //         [longitude, latitude],  // [longitude, latitude]
    //         10 / 6378.1  // 10km in radians (radius of Earth = 6378.1 km)
    //       ]
    //     }  
    //   }
    // }
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