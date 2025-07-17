import React, { useState, useEffect } from "react";
import axios from "axios";
import ".././../styles/WhatsInMyKitchen.css";
import { Clock, ChevronDown, X } from "lucide-react";

const RecipeGenerator = () => {
  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);

  const handleGenerateRecipe = async (e) => {
    e.preventDefault();
    if (!ingredients.trim()) {
      setError("Please add some ingredients first!");
      return;
    }

    setLoading(true);
    setError(null);
    setRecipes([]);

    try {
      const ingredientsList = ingredients
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
      const response = await axios.post(
        "http://localhost:5000/api/recipes/generate",
        {
          ingredients: ingredientsList,
          count: 3, // Request 3 recipes
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setRecipes(response.data);
    } catch (err) {
      console.error("Error details:", err.response?.data || err.message);
      setError(
        err.response?.data?.error ||
          "Failed to generate recipe. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasteIngredients = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setIngredients(prevIngredients => {
        // If there are existing ingredients, append with a comma
        return prevIngredients ? `${prevIngredients}, ${clipboardText}` : clipboardText;
      });
    } catch (err) {
      setError('Failed to paste ingredients');
    }
  };

  return (
    <div className="recipe-generator">
      <form onSubmit={handleGenerateRecipe} className="recipe-form">
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <textarea
            className="ingredient-input"
            placeholder="Enter ingredients separated by commas (e.g., tomatoes, onions, chicken)"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
          <button
            type="button"
            onClick={handlePasteIngredients}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              height: 'fit-content',
              minWidth: '100px'
            }}
          >
            Paste
          </button>
        </div>
        <button type="submit" disabled={loading} className="generate-btn">
          {loading ? "Generating..." : "Generate Recipe"}
        </button>
      </form>

      {loading && <p className="loading-text">Creating your recipes...</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="recipes-grid">
        {recipes.map((recipe, index) => (
          <div
            key={index}
            className={`recipe-card ${
              expandedRecipeId === index ? "expanded" : ""
            }`}
            onClick={() =>
              setExpandedRecipeId(expandedRecipeId === index ? null : index)
            }
          >
            <div className="recipe-card-content">
              {recipe.imageUrl && (
                <div className="recipe-image">
                  <img src={recipe.imageUrl} alt={recipe.title} />
                </div>
              )}
              <h3 className="recipe-title">{recipe.title}</h3>
              <div className="recipe-time">
                <Clock size={16} />
                <span>{recipe.prepTime + recipe.cookTime} mins</span>
              </div>
            </div>

            {expandedRecipeId === index && (
              <div className="recipe-details">
                <div className="recipe-meta">
                  <div className="meta-item">
                    <strong>Cuisine:</strong> {recipe.cuisine}
                  </div>
                  <div className="meta-item">
                    <strong>Difficulty:</strong> {recipe.difficulty}
                  </div>
                  <div className="meta-item">
                    <strong>Prep:</strong> {recipe.prepTime} mins
                  </div>
                  <div className="meta-item">
                    <strong>Cook:</strong> {recipe.cookTime} mins
                  </div>
                </div>

                <div className="recipe-ingredients">
                  <h4>Ingredients</h4>
                  <ul>
                    {recipe.ingredients?.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>

                <div className="recipe-instructions">
                  <h4>Instructions</h4>
                  <ol>
                    {recipe.instructions?.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                {recipe.nutrition && (
                  <div className="nutrition-info">
                    <h4>Nutrition Information</h4>
                    <div className="nutrition-grid">
                      <div className="nutrition-item">
                        <span>Calories</span>
                        <strong>{recipe.nutrition.calories}kcal</strong>
                      </div>
                      <div className="nutrition-item">
                        <span>Protein</span>
                        <strong>{recipe.nutrition.protein}g</strong>
                      </div>
                      <div className="nutrition-item">
                        <span>Fat</span>
                        <strong>{recipe.nutrition.fat}g</strong>
                      </div>
                      <div className="nutrition-item">
                        <span>Carbs</span>
                        <strong>{recipe.nutrition.carbs}g</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeGenerator;
