const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const router = express.Router();

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// Setup multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: req.file.mimetype,
        },
      },
      {
        text: 'Identify all fruits, vegetables, and ingredients shown in this image. Respond with a plain JSON array like: ["onion", "tomato", "banana"]',
      },
    ]);

    const response = await result.response;
    const text = await response.text();

    res.json({ result: text });
  } catch (error) {
    console.error("Error details:", error.stack || error);
    res.status(500).json({ error: "Failed to process image." });
  }
});

module.exports = router;
