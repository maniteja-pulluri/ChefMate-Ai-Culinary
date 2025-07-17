// src/components/DashboardSidebar/ShoppingList.jsx
import React, { useState, useEffect } from "react";
import { Check, Trash2, RefreshCw, Trash, Loader2 } from "lucide-react";
import {
  getShoppingList,
  removeFromShoppingList,
  removeRecipeFromShoppingList,
  updateShoppingListItem,
} from "../../services/dashboardService";
import "../../styles/ShoppingList.css";
import { toast } from "react-hot-toast";

const ShoppingList = () => {
  const [shoppingList, setShoppingList] = useState([]);
  const [localShoppingList, setLocalShoppingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingRecipe, setDeletingRecipe] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingToggles, setPendingToggles] = useState({});

  const fetchShoppingList = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      console.log("Fetching shopping list...");
      const response = await getShoppingList();
      console.log("Shopping list response:", response.data);
      setShoppingList(response.data.items || []);
      console.log(
        "Shopping list items count:",
        (response.data.items || []).length
      );
      setError(null);
    } catch (error) {
      console.error("Error fetching shopping list:", error);
      setError("Failed to fetch shopping list");
      setShoppingList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShoppingList();
  }, []);

  useEffect(() => {
    setLocalShoppingList(shoppingList);
  }, [shoppingList]);

  const handleToggleItem = async (itemId, currentStatus, recipeId) => {
    // Optimistically update local UI
    setLocalShoppingList((prev) =>
      prev.map((recipe) =>
        recipe.recipeId === recipeId
          ? {
            ...recipe,
            ingredients: recipe.ingredients.map((ingredient) =>
              ingredient._id === itemId
                ? { ...ingredient, added: !currentStatus }
                : ingredient
            ),
          }
          : recipe
      )
    );
    try {
      await updateShoppingListItem(itemId, { added: !currentStatus });
      fetchShoppingList();
    } catch (error) {
      setError("Failed to update item");
      toast.error("Failed to update item");
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      console.log("Removing item:", itemId);
      await removeFromShoppingList(itemId);
      fetchShoppingList();
      toast.success("Item removed from shopping list");
    } catch (error) {
      console.error("Error removing item:", error);
      setError("Failed to remove item");
      toast.error("Failed to remove item");
    }
  };

  const handleRemoveRecipe = async (recipeId, recipeName) => {
    try {
      setDeletingRecipe(recipeId);
      console.log("Removing all items for recipe:", recipeId);

      const response = await removeRecipeFromShoppingList(recipeId);
      console.log("Remove recipe response:", response.data);

      toast.success(`Removed all ingredients from ${recipeName}`);
      fetchShoppingList();
    } catch (error) {
      console.error("Error removing recipe items:", error);
      setError("Failed to remove recipe items");
      toast.error("Failed to remove recipe items");
    } finally {
      setDeletingRecipe(null);
    }
  };

  const handleToggleAllIngredients = async (recipe) => {
    const allAdded = recipe.ingredients.every((ingredient) => ingredient.added);
    // Optimistically update local UI
    setLocalShoppingList((prev) =>
      prev.map((r) =>
        r.recipeId === recipe.recipeId
          ? {
            ...r,
            ingredients: r.ingredients.map((ingredient) => ({
              ...ingredient,
              added: !allAdded,
            })),
          }
          : r
      )
    );
    try {
      await Promise.all(
        recipe.ingredients.map((ingredient) =>
          updateShoppingListItem(ingredient._id, { added: !allAdded })
        )
      );
      fetchShoppingList();
    } catch (error) {
      setError("Failed to update all ingredients");
      toast.error("Failed to update all ingredients");
    }
  };

  if (loading) {
    return (
      <div className="shopping-list-container">
        <div className="loading-state">
          <Loader2 className="animate-spin mr-2" size={20} />
          Loading shopping list...
        </div>
      </div>
    );
  }

  return (
    <div className="shopping-list-container">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Shopping List
          </h2>
          <button
            onClick={fetchShoppingList}
            className="refresh-btn"
            disabled={refreshing}
            aria-label="Refresh shopping list"
          >
            {refreshing ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>
        {error && <div className="error-message mt-2">{error}</div>}
      </div>

      {localShoppingList.length === 0 ? (
        <div className="empty-state">
          <p>Your shopping list is empty.</p>
          <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
            Add ingredients from recipes to get started.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto flex-1">
          {localShoppingList.map((recipe) => (
            <div
              key={recipe.recipeId || recipe.recipeName}
              className="recipe-items p-4"
            >
              <div className="recipe-header">
                <button
                  onClick={() => handleToggleAllIngredients(recipe)}
                  className={`checkbox-custom ${recipe.ingredients.every(ingredient => ingredient.added) ? "checked" : ""}`}
                  aria-label={`Mark all ingredients in ${recipe.recipeName} as ${recipe.ingredients.every(ingredient => ingredient.added) ? "not bought" : "bought"}`}
                  style={{ marginRight: '10px' }}
                >
                  <Check
                    size={14}
                    className={`${recipe.ingredients.every(ingredient => ingredient.added) ? "text-white" : "hidden"}`}
                  />
                </button>
                <h3 className="font-medium">{recipe.recipeName}</h3>
                <div className="recipe-actions">
                  <button
                    onClick={() =>
                      handleRemoveRecipe(recipe.recipeId, recipe.recipeName)
                    }
                    disabled={deletingRecipe === recipe.recipeId}
                    className="delete-recipe-btn"
                    aria-label={`Remove all items from ${recipe.recipeName}`}
                    title="Remove all items from this recipe"
                  >
                    {deletingRecipe === recipe.recipeId ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash size={16} />
                    )}
                  </button>
                </div>
              </div>
              <ul className="space-y-2 mt-3">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient._id} className="ingredient-item">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleItem(ingredient._id, ingredient.added, recipe.recipeId)}
                        className={`checkbox-custom ${ingredient.added ? "checked" : ""}`}
                        aria-label={`Mark ${ingredient.name} as ${ingredient.added ? "not bought" : "bought"}`}
                      >
                        <Check
                          size={14}
                          className={`${ingredient.added ? "text-white" : "hidden"}`}
                        />
                      </button>
                      <span
                        className={`text-sm ${ingredient.added
                          ? "line-through text-gray-400 dark:text-gray-500"
                          : "text-gray-700 dark:text-gray-300"
                          }`}
                      >
                        {ingredient.name}{" "}
                        {ingredient.quantity !== "1" ? `- ${ingredient.quantity}` : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
