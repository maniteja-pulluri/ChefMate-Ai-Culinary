const User = require("../models/User"); // Import User model
const mongoose = require("mongoose");

const getUserProfile = async (req, res) => {
    try {
        // Fetch the user by their ID stored in the decoded token
        const user = await User.findById(req.user._id).select("-password");

        // If user is not found, return an error
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return the user data excluding the password
        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user profile:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Export the function to use in routes
module.exports = {
    getUserProfile,
};
