const multer = require('multer');
exports.upload = multer({ dest: 'uploads/' }); // Define the destination folder for uploaded files.
