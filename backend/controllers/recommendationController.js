const Recipe = require("../models/Recipe");
const User = require("../models/User");
const mongoose = require("mongoose");

// ✅ Personalized Recommendations based on diet, allergies & favorites
const generateRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the user with preferences
    const user = await User.findById(userId).populate("favorites");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { dietPreferences, allergies, favorites } = user;

    // Prepare allergy filters (case-insensitive match)
    const allergyFilters = allergies.map(allergy => new RegExp(allergy, "i"));

    // Exclude favorite recipe IDs
    const favoriteRecipeIds = favorites.map(recipe => recipe._id);

    // Find recipes matching diet preference & excluding allergens and favorites
    const recommendedRecipes = await Recipe.find({
      $and: [
        {
          $or: [
            { category: dietPreferences },
            { cuisine: dietPreferences }
          ]
        },
        {
          ingredients: {
            $not: {
              $elemMatch: { $in: allergyFilters }
            }
          }
        },
        {
          _id: { $nin: favoriteRecipeIds }
        }
      ]
    })
    .sort({ createdAt: -1 }) // Optional: Show latest recipes first
    .limit(20); // Limit results for performance

    // Save recommendations to the user's profile (optional)
    user.recommendations = recommendedRecipes.map(recipe => recipe._id);
    await user.save();

    res.status(200).json({
      message: "Personalized recommendations generated successfully.",
      recommendations: recommendedRecipes
    });

  } catch (error) {
    console.error("Error generating recommendations:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  generateRecommendations,
};
