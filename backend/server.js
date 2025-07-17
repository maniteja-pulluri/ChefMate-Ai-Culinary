const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();

// Middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads/profile")));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Mongoose Models
const User = require("./models/User");
const Recipe = require("./models/Recipe");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const recipeRoutes = require("./routes/recipeRoutes"); // Gemini integrated
const favoritesRoutes = require("./routes/favoritesRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const nutritionRoutes = require("./routes/nutrition");
const shoppingListRoutes = require("./routes/shoppingListRoutes");
const mealPlanRoutes = require("./routes/mealPlanRoutes");
const recognizeRoute = require("./routes/recognize");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recipes", recipeRoutes); // Gemini AI integrated recipes
app.use("/api/favorites", favoritesRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/shopping-list", shoppingListRoutes);
app.use("/api/meal-plan", mealPlanRoutes);
app.use("/api/recognize", recognizeRoute);

// Upload profile image
app.post("/upload", upload.single("profileImage"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ profileImage: imageUrl });
});

// Update profile image
app.post("/update-profile", async (req, res) => {
  const { userId, profileImage } = req.body;
  try {
    await User.findByIdAndUpdate(userId, { profileImage });
    res.json({ message: "Profile updated successfully!", profileImage });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
});

// Test Route
app.get("/", (req, res) => {
  res.send("Welcome to the Indian Recipe API! 🍛");
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Cron job for daily recommendations
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily recommendation refresh...");

  try {
    const users = await User.find();

    for (const user of users) {
      const favoriteCuisines = user.favorites
        .map((recipe) => recipe.cuisine)
        .filter(Boolean);
      const favoriteCategories = user.favorites
        .map((recipe) => recipe.category)
        .filter(Boolean);

      const newRecommendations = await Recipe.find({
        $or: [
          { cuisine: { $in: favoriteCuisines } },
          { category: { $in: favoriteCategories } },
        ],
        _id: { $nin: user.favorites },
      }).limit(10);

      user.recommendations = newRecommendations.map((recipe) => recipe._id);
      await user.save();
    }

    console.log("✅ Daily recommendations updated.");
  } catch (error) {
    console.error("❌ Error updating recommendations:", error);
  }
});
