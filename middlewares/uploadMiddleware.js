// middlewares/uploadMiddleware.js

const multer = require('multer');

// Configure Multer to use memory storage
const storage = multer.memoryStorage();

// File size limit: 1MB
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and PDF are allowed.'));
    }
  },
});

module.exports = upload;
