const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

let User;

if (!mongoose.models.User) {
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    mobile: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Invalid mobile number format"]
    },
    profilePicture: { type: String, default: "" },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
    recommendations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
    dietPreferences: [{ type: String, enum: ["Vegetarian", "Vegan", "Keto", "High-Protein", "Balanced"] }],
    allergies: [{ type: String }],
    shoppingList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ingredient" }],
    mealPlans: [{ type: mongoose.Schema.Types.ObjectId, ref: "MealPlan" }],
    role: { type: String, enum: ["user", "admin"], default: "user" },
    age: { type: Number },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    weight: { type: Number },
    height: { type: Number },
    cookingSkill: { type: String, enum: ["Beginner", "Intermediate", "Advanced"] },
    preferredCuisines: [{ type: String }],
  }, { timestamps: true });

  // ✅ Remove hashing from pre("save") to avoid double hashing
  User = mongoose.model("User", userSchema);
} else {
  User = mongoose.models.User;
}

module.exports = User;
