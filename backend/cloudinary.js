require('dotenv').config(); // For environment variables
const cloudinary = require('cloudinary').v2;

// Set up Cloudinary configuration using your .env values
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

module.exports = cloudinary;
