const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const User = require("../models/User"); // ✅ Ensure it's imported correctly
const { authMiddleware, protect } = require("../middlewares/authMiddleware");
const { updateProfilePicture, deleteAccount } = require("../controllers/authController"); // ✅ Now includes deleteAccount
const { changePassword } = require("../controllers/authController"); // ✅ Ensure this is imported correctly
const { updatePersonalSettings } = require("../controllers/authController"); // ✅ Ensure this is imported correctly
const { getUserProfile } = require("../controllers/userController");
const cloudinary = require("../cloudinary");
const streamifier = require("streamifier");

const router = express.Router();

/**
 * ✅ Add a Recipe to Favorites
 */
router.post("/favorites/:recipeId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recipeId = req.params.recipeId;

    // Check if already in favorites
    if (user.favorites.includes(recipeId)) {
      return res.status(400).json({ success: false, message: "Recipe already in favorites" });
    }

    user.favorites.push(recipeId);
    await user.save();

    res.status(200).json({ success: true, message: "Recipe added to favorites!", favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ✅ Remove a Recipe from Favorites
 */
router.delete("/favorites/:recipeId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recipeId = req.params.recipeId.toString();

    user.favorites = user.favorites.filter((id) => id.toString() !== recipeId);

    await user.save();
    res.status(200).json({ success: true, message: "Recipe removed from favorites!", favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ✅ Get All Favorite Recipes
 */
router.get("/favorites", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("favorites");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ✅ Update User Profile (Fixed Duplicate)
 */
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { username, email, mobile } = req.body;
    const userId = req.user.id; // ✅ Consistent use of req.user.id

    // ✅ Update user in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, email, mobile },
      { new: true }
    );

    res.json(updatedUser); // ✅ Send updated data back to frontend
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
});

// Multer config for memory storage (no disk save)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * ✅ Upload Profile Picture to Cloudinary
 */
router.post(
  "/upload-profile-picture",
  authMiddleware,
  upload.single("profilePicture"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Upload to Cloudinary from buffer
      const streamUpload = (buffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "profile_pictures" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(buffer).pipe(stream);
        });

      const result = await streamUpload(req.file.buffer);

      // Save Cloudinary URL to user
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.profilePicture = result.secure_url;
      await user.save();

      res.status(200).json({ profilePicture: user.profilePicture });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * ✅ Get Logged-In User Profile (including personal settings)
 */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ✅ Update Profile Picture Route (Moved Below Initialization)
 */
router.put("/profile-picture/:userId", upload.single("profilePicture"), updateProfilePicture);

/**
 * ✅ Delete User Account
 */
router.delete("/delete-account", authMiddleware, deleteAccount); // ✅ New delete route added

router.post("/changepassword", authMiddleware, changePassword);

router.put("/update-personal-settings", authMiddleware, updatePersonalSettings); // ✅ New route for updating personal settings

router.get("/profilr", authMiddleware, getUserProfile);

module.exports = router;
