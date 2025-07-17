const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    ingredients: [{ type: String, required: true }],
    instructions: { type: [String], required: true },
    cuisine: { type: String },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    image: { type: String, default: "" }, // ✅ Stores the uploaded image path (handled via multer)
    category: { type: String }, // veg, non-veg, ice creams, sweets, desserts, snacks, breads, drinks, salads, starters, juices
    prepTime: { type: Number },
    cookTime: { type: Number },
    servings: { type: Number },
    dietType: { type: String }, // high, low, balanced
    mealType: { type: String }, // breakfast, lunch, dinner
    mainCourseRegion: { type: String }, // South, North, East, West
    nutrition: {
      calories: { type: Number },
      protein: { type: Number },
      fat: { type: Number },
      carbs: { type: Number },
    },
    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        score: { type: Number, min: 1, max: 5 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", RecipeSchema);