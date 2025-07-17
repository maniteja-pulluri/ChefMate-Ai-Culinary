import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// ✅ Register a New User
export const register = async (req, res) => {
  try {
    const { username, email, password, mobile } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email or Mobile already registered" });
    }

    console.log("📌 Registering user:", { username, email });

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword, mobile });
    await newUser.save();

    console.log("✅ User registered successfully!");
    res.status(201).json({ message: "User registered successfully!" });

  } catch (error) {
    console.error("❌ Register Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Login User
// authController.js

// ✅ Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "7d" }
    );

    // Sending additional user details (including personal settings) along with the token
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        age: user.age,
        gender: user.gender,
        weight: user.weight,
        height: user.height,
        cookingSkill: user.cookingSkill,
        dietPreferences: user.dietPreferences,
        allergies: user.allergies,
        preferredCuisines: user.preferredCuisines,
      },
    });

  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// ✅ Validate Token


export const validateToken = (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ valid: false, message: "Token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, message: "Invalid or expired token" });
  }
};

// PUT /auth/profile-picture/:userId
export const updateProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    // ✅ Upload to Cloudinary using stream
    const uploadFromBuffer = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profile_pics" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });

    const result = await uploadFromBuffer();

    // ✅ Save Cloudinary URL to MongoDB
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: result.secure_url },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("❌ Error updating profile picture:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete Account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete user from database
    await User.findByIdAndDelete(userId);

    console.log("🗑️ User deleted:", userId);
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting account:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Change Password Controller
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?._id.toString();  // depending on how you attach user in middleware
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized or invalid token" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect current password" });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedNewPassword;
    await user.save();

    console.log(`🔐 Password changed for user: ${user.email}`);
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Error updating password:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



export const updatePersonalSettings = async (req, res) => {
  console.log("User ID from middleware:", req.userId);

  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    console.log("User found:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update personal settings
    const {
      age,
      gender,
      weight,
      height,
      cookingSkill,
      dietPreferences,
      allergies,
      preferredCuisines,
    } = req.body;

    user.age = age || user.age;
    user.gender = gender || user.gender;
    user.weight = weight || user.weight;
    user.height = height || user.height;
    user.cookingSkill = cookingSkill || user.cookingSkill;
    user.dietPreferences = dietPreferences || user.dietPreferences;
    user.allergies = allergies || user.allergies;
    user.preferredCuisines = preferredCuisines || user.preferredCuisines;

    await user.save();

    res.status(200).json({ message: "Personal settings updated successfully", user });
  } catch (error) {
    console.error("Error updating personal settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
