// models/ShoppingList.js
const mongoose = require("mongoose");

const ShoppingListSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    week: { type: String, required: true },
    ingredients: [
      {
        name: String,
        quantity: String,
        added: { type: Boolean, default: false },
        recipeId: { type: String },
        recipeName: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShoppingList", ShoppingListSchema);
