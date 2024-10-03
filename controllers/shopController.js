const Shop = require('../models/Shop');

// Create a new shop (Seller only)
exports.createShop = async (req, res, next) => {
  try {
    const { name, logo, description, coordinates } = req.body;
    
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can create shops' });
    }

    const shop = new Shop({
      name,
      logo,
      description,
      location: {
        type: 'Point',
        coordinates: coordinates,  // [longitude, latitude]
      },
      seller: req.user._id
    });

    await shop.save();
    res.status(201).json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

// Get all shops within 10km of a given location
exports.getShopsNearby = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'Please provide longitude and latitude' });
    }

    const shops = await Shop.find({
      location: {
        $geoWithin: {
          $centerSphere: [
            [longitude, latitude],  // [longitude, latitude]
            10 / 6378.1  // 10km in radians (radius of Earth = 6378.1 km)
          ]
        }
      }
    });

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