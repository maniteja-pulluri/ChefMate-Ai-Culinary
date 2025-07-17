const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateRecipesFromIngredients(ingredients) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error("Invalid ingredients list");
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `Generate 3 different Indian recipes using some or all of these ingredients: ${ingredients.join(
      ", "
    )}. Make the recipes diverse in terms of difficulty and cooking time. 
    Return the response in this exact JSON format:
    {
      "recipes": [
        {
          "title": "Recipe Name",
          "ingredients": ["ingredient1", "ingredient2"],
          "instructions": ["step1", "step2"],
          "cuisine": "Indian",
          "difficulty": "Easy/Medium/Hard",
          "prepTime": number,
          "cookTime": number,
          "servings": number,
          "nutrition": {
            "calories": number,
            "protein": number,
            "fat": number,
            "carbs": number
          }
        },
        // Two more recipe objects with the same structure
      ]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const cleanedResponse = text.replace(/```json|```/g, "").trim();
      const recipesData = JSON.parse(cleanedResponse);
      return recipesData.recipes;
    } catch (parseError) {
      console.error("Parse error:", parseError);
      throw new Error("Failed to parse generated recipes");
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    if (error.status === 403 && error.errorDetails?.[0]?.reason === 'SERVICE_DISABLED') {
      throw new Error("Gemini API is not enabled. Please enable it in the Google Cloud Console and try again in a few minutes.");
    }
    throw new Error("Failed to generate recipes using provided ingredients");
  }
}

module.exports = {
  generateRecipesFromIngredients,
};
