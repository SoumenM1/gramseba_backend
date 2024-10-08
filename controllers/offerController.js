const Offer = require('../models/Offer');
const socketUtil = require('../utils/socket');  // Import socket utility

// Create a new offer and notify users within 10km
exports.createOffer = async (req, res, next) => {
  try {
    const { title, imageUrl, description, coordinates } = req.body;

    if (req.user.role !== 'organization') {
      return res.status(403).json({ message: 'Only organizations can create offers' });
    }

    const offer = new Offer({
      title,
      imageUrl,
      description,
      location: {
        type: 'Point',
        coordinates
      },
      organization: req.user.organization
    });

    await offer.save();

    // Emit the new offer notification
    const io = socketUtil.getIO();
    io.emit('newOffer', { title: offer.title, coordinates: offer.location.coordinates });

    res.status(201).json({ success: true, offer });
  } catch (error) {
    next(error);
  }
};


// Get offers within a 10km range (Location-based for users)
exports.getOffersByLocation = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.query;

    const offers = await Offer.find(
    // {
    //   location: {
    //     $near: {
    //       $geometry: { type: 'Point', coordinates: [longitude, latitude] },
    //       $maxDistance: 10000  // 10km radius
    //     }
    //   }
    // }
    ).populate('organization', 'name');

    res.status(200).json({ success: true, offers });
  } catch (error) {
    next(error);
  }
};
