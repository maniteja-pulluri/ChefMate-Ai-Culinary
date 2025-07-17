const mongoose = require("mongoose");
const Recipe = require("./models/Recipe");
const fs = require("fs");
const path = require("path");
const cloudinary = require("./cloudinary"); // Import Cloudinary config

// Connect to MongoDB
mongoose.connect("mongodb+srv://apimate:apimate@api.u4z67.mongodb.net/?retryWrites=true&w=majority&appName=api", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ Database Connected"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// Load JSON data (Ensure correct path)
const filePath = path.join(__dirname, "recipes.json");
if (!fs.existsSync(filePath)) {
  console.error("❌ Error: recipes.json file not found!");
  process.exit(1);
}

let fileContent = fs.readFileSync(filePath, "utf-8");

let recipes;
try {
  recipes = JSON.parse(fileContent);

  // ✅ Handle case where JSON contains an object with key "recipes"
  if (recipes.hasOwnProperty("recipes") && Array.isArray(recipes.recipes)) {
    recipes = recipes.recipes;
  } else if (!Array.isArray(recipes)) {
    throw new Error("recipes.json must contain an array!");
  }

} catch (error) {
  console.error("❌ JSON Parsing Error:", error.message);
  process.exit(1);
}

// Function to upload image to Cloudinary
const uploadImage = async (imagePath) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath); // Upload to Cloudinary
    return result.secure_url; // Return the secure image URL
  } catch (error) {
    console.error("❌ Cloudinary Upload Error:", error.message);
    return null; // Return null if upload fails
  }
};

// Bulk Insert with Image Handling
const importData = async () => {
  try {
    // Loop through each recipe and upload its image
    for (let recipe of recipes) {
      if (recipe.image && recipe.image.trim() !== "") {
        const localImagePath = path.join(__dirname, "uploads", "recipes", recipe.image); // Path to the local image file
        
        // Ensure the image file exists before uploading
        if (fs.existsSync(localImagePath)) {
          const cloudinaryImageUrl = await uploadImage(localImagePath);
          
          if (cloudinaryImageUrl) {
            recipe.image = cloudinaryImageUrl; // Update recipe with Cloudinary URL
          } else {
            console.error(`❌ Image upload failed for ${recipe.title}`);
            recipe.image = "https://via.placeholder.com/300.png?text=No+Image"; // Default image URL
          }
        } else {
          console.error(`❌ Image file not found for ${recipe.title}: ${recipe.image}`);
          recipe.image = "https://via.placeholder.com/300.png?text=No+Image"; // Default image URL
        }
      }
    }

    // Insert recipes into MongoDB
    await Recipe.insertMany(recipes);
    console.log("🎉 Recipes Imported Successfully!");
    mongoose.connection.close(); // Close DB connection
  } catch (error) {
    console.error("❌ Error during import:", error);
    mongoose.connection.close();
  }
};

// Run import function
importData();
