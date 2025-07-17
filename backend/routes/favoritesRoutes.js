const express = require("express");
const User = require("../models/User");
const Recipe = require("../models/Recipe");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { addFavorite, getFavorites, removeFavorite } = require("../controllers/favoritesController");

const router = express.Router();

// Add to favorites
router.post("/:recipeId", authMiddleware, addFavorite);

// Get all favorites
router.get("/", authMiddleware, getFavorites);

// Remove from favorites
router.delete("/:recipeId", authMiddleware, removeFavorite);

module.exports = router;
