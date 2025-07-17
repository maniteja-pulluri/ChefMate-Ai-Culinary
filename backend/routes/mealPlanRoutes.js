// routes/mealPlanRoutes.js
const express = require("express");
const router = express.Router();
const MealPlan = require("../models/MealPlan");

// Add Meal Plan
router.post("/add", async (req, res) => {
  try {
    const mealPlan = new MealPlan(req.body);
    await mealPlan.save();
    res.status(201).json({ message: "Meal plan created", mealPlan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Meal Plan by User
router.get("/:userId", async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({ user: req.params.userId }).populate("days.recipes");
    res.status(200).json(mealPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
