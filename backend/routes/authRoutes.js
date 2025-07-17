const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User");
const { validateToken } = require("../controllers/authController");

dotenv.config(); // Load environment variables

const router = express.Router();
router.get("/validate", validateToken); // ✅ Route for token validation

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"; // Use .env for production

// ✅ Register User
router.post("/register", async (req, res) => {
  console.log("📌 Registering user:", req.body);

  try {
    const { username, email, password, mobile } = req.body;

    let user = await User.findOne({ $or: [{ email }, { mobile }] });
    if (user) {
      console.log("❌ User already exists");
      return res.status(400).json({ message: "Email or Mobile already registered" });
    }

    // ✅ Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("🔹 Hashed Password Generated:", hashedPassword);

    // ✅ Save the hashed password in DB
    user = new User({ username, email, password: hashedPassword, mobile });
    await user.save();

    console.log("✅ User registered successfully!");
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Error in registration:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Login User
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("📌 Incoming Login Request:", email);

    // ✅ Find User
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔹 Password Match Result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password does not match");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "7d" }
    );

    console.log("✅ Login Successful:", { userId: user._id, token });

    // ✅ Send Response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        profilePicture: user.profilePicture,
        age: user.age,
        gender: user.gender,
        weight: user.weight,
        height: user.height,
        cookingSkill: user.cookingSkill,
        dietPreferences: user.dietPreferences,
        allergies: user.allergies,
        preferredCuisines: user.preferredCuisines
      },
    });

  } catch (error) {
    console.error("❌ Error in login:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/validate", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ valid: false, message: "No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ valid: false, message: "User not found." });
    }

    res.status(200).json({
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        profilePicture: user.profilePicture,
        age: user.age,
        gender: user.gender,
        weight: user.weight,
        height: user.height,
        cookingSkill: user.cookingSkill,
        dietPreferences: user.dietPreferences,
        allergies: user.allergies,
        preferredCuisines: user.preferredCuisines
      }
    });
  } catch (error) {
    console.error("Token validation error:", error.message);
    res.status(401).json({ valid: false, message: "Invalid or expired token" });
  }
});

module.exports = router;