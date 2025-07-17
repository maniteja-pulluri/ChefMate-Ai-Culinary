const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");
const ingredientNutritionDB = require("../utils/ingredientNutritionDB");

// Analyze recipe nutrition based on local data
router.post("/analyze/:recipeId", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    recipe.ingredients.forEach(ingredient => {
      const name = ingredient.toLowerCase().trim();
      const nutrition = ingredientNutritionDB[name];

      if (nutrition) {
        totalCalories += nutrition.calories;
        totalProtein += nutrition.protein;
        totalFat += nutrition.fat;
        totalCarbs += nutrition.carbs;
      }
    });

    recipe.nutrition = {
      calories: totalCalories,
      protein: totalProtein,
      fat: totalFat,
      carbs: totalCarbs,
    };

    await recipe.save();

    res.status(200).json({
      message: "Nutrition calculated and saved successfully.",
      nutrition: recipe.nutrition,
    });
  } catch (error) {
    console.error("Error analyzing nutrition:", error);
    res.status(500).json({ message: "Failed to analyze nutrition." });
  }
});

// Filter recipes by nutrition values
router.get("/filter", async (req, res) => {
  try {
    const { maxCalories, minProtein, maxFat, maxCarbs } = req.query;

    const filters = {};
    if (maxCalories) filters["nutrition.calories"] = { $lte: Number(maxCalories) };
    if (minProtein) filters["nutrition.protein"] = { $gte: Number(minProtein) };
    if (maxFat) filters["nutrition.fat"] = { $lte: Number(maxFat) };
    if (maxCarbs) filters["nutrition.carbs"] = { $lte: Number(maxCarbs) };

    const recipes = await Recipe.find(filters);

    res.status(200).json(recipes);
  } catch (error) {
    console.error("Error filtering recipes:", error);
    res.status(500).json({ message: "Error filtering recipes." });
  }
});

module.exports = router;
