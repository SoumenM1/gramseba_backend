// config/cloudinaryConfig.js

const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // e.g., 'dvfs7vdry'
  api_key: process.env.CLOUDINARY_API_KEY,       // e.g., '761112221269974'
  api_secret: process.env.CLOUDINARY_API_SECRET, // e.g., 'Kgwnu_eOv2XNQ97G4t5VOSvnvus'
});

module.exports = { cloudinary };
