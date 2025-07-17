const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// General authentication middleware
const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Extract token value from Authorization header
    const tokenValue = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

    // Verify the JWT token
    const decoded = jwt.verify(tokenValue, SECRET_KEY);

    // Attach userId to the request object
    req.userId = decoded.userId;

    // Ensure the user ID is valid
    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Find the user by ID and attach user to the request
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; // Attach the user object to the request
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }

    return res.status(401).json({ message: "Invalid token or unauthorized access" });
  }
};

// Export the middleware
module.exports = {
  authMiddleware
};
