const mongoose = require("mongoose");

const MealPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    week: { type: String, required: true }, // Example: "2025-W10"
    days: [
      {
        day: { type: String, required: true }, // Example: "Monday"
        breakfast: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
        lunch: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
        dinner: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
        snacks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }], // ✅ Optional snacks
      },
    ],
    shoppingList: [{ type: String }], // ✅ Weekly auto-generated ingredients list
  },
  { timestamps: true }
);

module.exports = mongoose.model("MealPlan", MealPlanSchema);
