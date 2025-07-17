const express = require("express");
const multer = require("multer");
const Recipe = require("../models/Recipe");
const upload = require("../middlewares/upload");
const User = require("../models/User");
const router = express.Router();
const { getRecommendations } = require("../controllers/recipeController");
const { generateRecipesFromIngredients } = require("../services/geminiService");

router.get('/recommendations/:userId', getRecommendations);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});


// ✅ Create a new recipe with an image
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { title, ingredients, instructions, cuisine, difficulty, category, prepTime, cookTime, servings, nutrition } = req.body;

    const newRecipe = new Recipe({
      title,
      ingredients: ingredients.split(","), // Ensure array format
      instructions: instructions.split(". "),
      cuisine,
      difficulty,
      category,
      prepTime,
      cookTime,
      servings,
      dietType: req.body.dietType,
      mealType: req.body.mealType,
      mainCourseRegion: req.body.mainCourseRegion,
      nutrition: JSON.parse(nutrition),
      image: req.file ? `/uploads/${req.file.filename}` : "", // Save image path
    });

    await newRecipe.save();
    res.status(201).json({ message: "Recipe added successfully!", recipe: newRecipe });
  } catch (error) {
    res.status(500).json({ error: "Error adding recipe" });
  }
});

// ✅ Update recipe with an image
router.put("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const updatedData = req.body;
    if (req.file) {
      updatedData.image = `/uploads/${req.file.filename}`;
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.status(200).json({ message: "Recipe updated successfully!", recipe: updatedRecipe });
  } catch (error) {
    res.status(500).json({ error: "Error updating recipe" });
  }
});



// ✅ Image upload route (for Step 6)
// POST /api/recipes/:id/upload-image
router.post("/:id/upload-image", upload.single("image"), async (req, res) => {
  try {
    const recipeId = req.params.id;
    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found!" });
    }

    recipe.image = `/uploads/${req.file.filename}`;
    await recipe.save();

    res.status(200).json({
      message: "Image uploaded successfully!",
      imageUrl: recipe.image,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 🔍 Advanced Search & Filtering Route
router.get("/search", async (req, res) => {
  try {
    const { title, ingredients, cuisine, category, difficulty, mealType, dietType, mainCourseRegion, page = 1, limit = 10, sort } = req.query;
    let query = {};

    if (title) {
      query.title = { $regex: title, $options: "i" };
    }

    if (ingredients) {
      const ingredientsArray = ingredients.split(",").map((ing) => ing.trim());
      query.$or = ingredientsArray.map((ingredient) => ({
        ingredients: { $regex: ingredient, $options: "i" },
      }));
    }

    if (cuisine) {
      query.cuisine = { $regex: cuisine, $options: "i" };
    }

    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (mealType) {
      query.mealType = { $regex: mealType, $options: "i" };
    }
    if (dietType) {
      query.dietType = { $regex: dietType, $options: "i" };
    }
    if (mainCourseRegion) {
      query.mainCourseRegion = { $regex: mainCourseRegion, $options: "i" };
    }

    let sortOptions = {};
    if (sort === "newest") sortOptions = { createdAt: -1 };
    if (sort === "oldest") sortOptions = { createdAt: 1 };
    if (sort === "calories") sortOptions = { "nutrition.calories": 1 };
    if (sort === "cookTime") sortOptions = { cookTime: 1 };

    const recipes = await Recipe.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    if (recipes.length === 0) {
      return res.status(404).json({ message: "No recipes found!" });
    }

    res.status(200).json({
      totalResults: recipes.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(recipes.length / parseInt(limit)),
      recipes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Create Recipe (POST)
router.post("/add", async (req, res) => {
  try {
    const newRecipe = new Recipe(req.body);
    await newRecipe.save();
    res.status(201).json({ message: "Recipe added successfully!", newRecipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get All Recipes (GET)
router.get("/", async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.status(200).json(recipes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get Single Recipe by Title (GET)
router.get("/title/:title", async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ title: { $regex: req.params.title, $options: "i" } });
    if (!recipe) return res.status(404).json({ message: "Recipe not found!" });
    res.status(200).json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get Single Recipe by ID (GET)
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found!" });
    res.status(200).json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update Recipe (PUT)
router.put("/:id", async (req, res) => {
  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRecipe) return res.status(404).json({ message: "Recipe not found!" });
    res.status(200).json({ message: "Recipe updated successfully!", updatedRecipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete Recipe (DELETE)
router.delete("/:id", async (req, res) => {
  try {
    const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!deletedRecipe) return res.status(404).json({ message: "Recipe not found!" });
    res.status(200).json({ message: "Recipe deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Add or Update Rating
router.post("/:id/rate", async (req, res) => {
  try {
    const recipeId = req.params.id;
    const { userId, score } = req.body;

    if (!userId || !score) {
      return res.status(400).json({ message: "User ID and score are required." });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    // Check if user has already rated
    const existingRating = recipe.ratings.find((rating) =>
      rating.user.toString() === userId
    );

    if (existingRating) {
      existingRating.score = score; // Update score
    } else {
      recipe.ratings.push({ user: userId, score }); // Add new rating
    }

    await recipe.save();

    res.status(200).json({ message: "Rating submitted successfully." });
  } catch (error) {
    console.error("Error rating recipe:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// ✅ Get Average Rating
router.get("/:id/average-rating", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    if (recipe.ratings.length === 0) {
      return res.status(200).json({ averageRating: 0 });
    }

    const total = recipe.ratings.reduce((sum, rating) => sum + rating.score, 0);
    const averageRating = total / recipe.ratings.length;

    res.status(200).json({ averageRating: averageRating.toFixed(2) });
  } catch (error) {
    console.error("Error fetching average rating:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// ✅ Add Recipe to Favorites
router.post("/:id/favorite", async (req, res) => {
  try {
    const { userId } = req.body;
    const recipeId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!user.favorites.includes(recipeId)) {
      user.favorites.push(recipeId);
      await user.save();
      return res.status(200).json({ message: "Recipe added to favorites!" });
    } else {
      return res.status(400).json({ message: "Recipe already in favorites." });
    }
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// ✅ Remove Recipe from Favorites
router.post("/:id/unfavorite", async (req, res) => {
  try {
    const { userId } = req.body;
    const recipeId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.favorites = user.favorites.filter(
      (favId) => favId.toString() !== recipeId
    );
    await user.save();

    res.status(200).json({ message: "Recipe removed from favorites!" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// ✅ Get User's Favorite Recipes
router.get("/user/:userId/favorites", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("favorites");
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// 🔍 Advanced Search & Filtering Route with Allergy Filter
router.get("/search", async (req, res) => {
  try {
    const {
      title,
      ingredients,
      cuisine,
      category,
      difficulty,
      mealType,
      dietType,
      mainCourseRegion,
      prepTime,
      cookTime,
      page = 1,
      limit = 10,
      sort,
      userId, // ✅ Pass userId to check allergies
    } = req.query;

    let query = {};

    if (title) {
      query.title = { $regex: title, $options: "i" };
    }

    if (ingredients) {
      const ingredientsArray = ingredients.split(",").map((ing) => ing.trim());
      query.$or = ingredientsArray.map((ingredient) => ({
        ingredients: { $regex: ingredient, $options: "i" },
      }));
    }

    if (cuisine) {
      query.cuisine = { $regex: cuisine, $options: "i" };
    }

    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (mealType) {
      query.mealType = { $regex: mealType, $options: "i" };
    }
    if (dietType) {
      query.dietType = { $regex: dietType, $options: "i" };
    }
    if (mainCourseRegion) {
      query.mainCourseRegion = { $regex: mainCourseRegion, $options: "i" };
    }

    // ✅ Allergy filter
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.allergies.length > 0) {
        query.ingredients = {
          $not: {
            $elemMatch: {
              $in: user.allergies.map((allergy) => new RegExp(allergy, "i")),
            },
          },
        };
      }
    }

    let sortOptions = {};
    if (sort === "newest") sortOptions = { createdAt: -1 };
    if (sort === "oldest") sortOptions = { createdAt: 1 };
    if (sort === "calories") sortOptions = { "nutrition.calories": 1 };
    if (sort === "cookTime") sortOptions = { cookTime: 1 };

    const recipes = await Recipe.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    if (recipes.length === 0) {
      return res.status(404).json({ message: "No recipes found!" });
    }

    res.status(200).json({
      totalResults: recipes.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(recipes.length / parseInt(limit)),
      recipes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// Recipe Generation Route
router.post('/generate', async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ 
        error: 'Please provide a valid list of ingredients' 
      });
    }

    const recipe = await generateRecipesFromIngredients(ingredients);
    res.json(recipe);
  } catch (error) {
    console.error('Recipe generation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate recipe' 
    });
  }
});

module.exports = router;
