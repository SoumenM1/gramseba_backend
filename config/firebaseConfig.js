const admin = require('firebase-admin');

const serviceAccount = require('./hello-app-ebcf1-firebase-adminsdk-5gd8z-c92d7e1794.json'); // Your Firebase credentials

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_BUCKET || "your-bucket-name.appspot.com",
});

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };
