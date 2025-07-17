// routes/shoppingListRoutes.js
const express = require("express");
const router = express.Router();
const ShoppingList = require("../models/ShoppingList");
const MealPlan = require("../models/MealPlan");
const User = require("../models/User");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Generate Shopping List from Meal Plan
router.post("/generate/:userId/:week", async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({
      user: req.params.userId,
      week: req.params.week,
    }).populate("days.recipes");

    if (!mealPlan)
      return res.status(404).json({ message: "Meal plan not found" });

    let ingredientsMap = {};

    mealPlan.days.forEach((day) => {
      day.recipes.forEach((recipe) => {
        recipe.ingredients.forEach((ingredient) => {
          if (ingredientsMap[ingredient]) {
            ingredientsMap[ingredient] += 1; // Counting duplicates
          } else {
            ingredientsMap[ingredient] = 1;
          }
        });
      });
    });

    const shoppingList = new ShoppingList({
      user: req.params.userId,
      week: req.params.week,
      ingredients: Object.keys(ingredientsMap).map((name) => ({
        name,
        quantity: ingredientsMap[name].toString(),
      })),
    });

    await shoppingList.save();
    res.status(201).json({ message: "Shopping list generated", shoppingList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add recipe ingredients to shopping list
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { recipeId, recipeName, ingredients } = req.body;
    const userId = req.user._id;

    console.log("Adding to shopping list:", {
      userId,
      recipeId,
      recipeName,
      ingredientsCount: ingredients.length,
    });

    // Get current date and format week string
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const weekNumber = Math.ceil(
      (pastDaysOfYear + startOfYear.getDay() + 1) / 7
    );
    const week = `${now.getFullYear()}-W${weekNumber}`;

    console.log("Current week:", week);

    // Find or create shopping list for current week
    let shoppingList = await ShoppingList.findOne({ user: userId, week });

    if (!shoppingList) {
      console.log("Creating new shopping list");
      shoppingList = new ShoppingList({
        user: userId,
        week,
        ingredients: [],
      });
    } else {
      console.log(
        "Found existing shopping list with",
        shoppingList.ingredients.length,
        "ingredients"
      );
    }

    // Add recipe ingredients to shopping list
    const newIngredients = ingredients.map((ingredient) => ({
      name: ingredient,
      quantity: "1",
      recipeId: recipeId,
      recipeName: recipeName,
    }));

    console.log("Adding", newIngredients.length, "new ingredients");

    shoppingList.ingredients.push(...newIngredients);
    const savedList = await shoppingList.save();

    console.log(
      "Shopping list saved with",
      savedList.ingredients.length,
      "total ingredients"
    );

    res.status(201).json({
      message: "Recipe ingredients added to shopping list",
      shoppingList: savedList,
    });
  } catch (error) {
    console.error("Error adding to shopping list:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Shopping List
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get current date and format week string
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const weekNumber = Math.ceil(
      (pastDaysOfYear + startOfYear.getDay() + 1) / 7
    );
    const week = `${now.getFullYear()}-W${weekNumber}`;

    const shoppingList = await ShoppingList.findOne({ user: userId, week });

    // If no shopping list exists yet for this week
    if (!shoppingList) {
      return res.status(200).json({
        message: "No shopping list found for current week",
        items: [],
      });
    }

    // Group ingredients by recipe
    const groupedItems = {};
    shoppingList.ingredients.forEach((ingredient) => {
      const recipeName = ingredient.recipeName || "Other Items";
      if (!groupedItems[recipeName]) {
        groupedItems[recipeName] = {
          recipeName,
          recipeId: ingredient.recipeId,
          ingredients: [],
        };
      }
      groupedItems[recipeName].ingredients.push({
        _id: ingredient._id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        added: ingredient.added || false,
      });
    });

    res.status(200).json({
      items: Object.values(groupedItems),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Shopping List by userId and week
router.get("/:userId/:week", async (req, res) => {
  try {
    const shoppingList = await ShoppingList.findOne({
      user: req.params.userId,
      week: req.params.week,
    });
    res.status(200).json(shoppingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update shopping list item status
router.put("/:itemId", authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { added } = req.body;
    const userId = req.user._id;

    // Get current week
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const weekNumber = Math.ceil(
      (pastDaysOfYear + startOfYear.getDay() + 1) / 7
    );
    const week = `${now.getFullYear()}-W${weekNumber}`;

    // Find the shopping list and update the specific ingredient
    const shoppingList = await ShoppingList.findOne({ user: userId, week });

    if (!shoppingList) {
      return res.status(404).json({ message: "Shopping list not found" });
    }

    // Find the ingredient by ID
    const ingredient = shoppingList.ingredients.id(itemId);

    if (!ingredient) {
      return res
        .status(404)
        .json({ message: "Item not found in shopping list" });
    }

    // Update the added status
    ingredient.added = added;
    await shoppingList.save();

    res.status(200).json({ message: "Item updated", shoppingList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete item from shopping list
router.delete("/:itemId", authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    // Get current week
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const weekNumber = Math.ceil(
      (pastDaysOfYear + startOfYear.getDay() + 1) / 7
    );
    const week = `${now.getFullYear()}-W${weekNumber}`;

    // Find the shopping list
    const shoppingList = await ShoppingList.findOne({ user: userId, week });

    if (!shoppingList) {
      return res.status(404).json({ message: "Shopping list not found" });
    }

    // Remove the ingredient by ID
    shoppingList.ingredients.pull(itemId);
    await shoppingList.save();

    res
      .status(200)
      .json({ message: "Item removed from shopping list", shoppingList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all ingredients of a recipe from shopping list
router.delete("/recipe/:recipeId", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user._id;

    // Get current week
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const weekNumber = Math.ceil(
      (pastDaysOfYear + startOfYear.getDay() + 1) / 7
    );
    const week = `${now.getFullYear()}-W${weekNumber}`;

    // Find the shopping list
    const shoppingList = await ShoppingList.findOne({ user: userId, week });

    if (!shoppingList) {
      return res.status(404).json({ message: "Shopping list not found" });
    }

    // Find the original count of ingredients
    const originalCount = shoppingList.ingredients.length;

    // Remove all ingredients with the specified recipeId
    shoppingList.ingredients = shoppingList.ingredients.filter(
      (ingredient) => ingredient.recipeId !== recipeId
    );

    // Calculate how many items were removed
    const removedCount = originalCount - shoppingList.ingredients.length;

    await shoppingList.save();

    res.status(200).json({
      message: `${removedCount} items removed from shopping list`,
      shoppingList,
    });
  } catch (error) {
    console.error("Error removing recipe ingredients:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
