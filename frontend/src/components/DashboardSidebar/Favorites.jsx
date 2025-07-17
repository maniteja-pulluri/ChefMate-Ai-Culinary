import { useFavorites } from '../../context/FavoritesContext';
import { Clock } from 'lucide-react';

const Favorites = () => {
  const { favorites, loading } = useFavorites();

  if (loading) return <div>Loading your favorite recipes...</div>;

  return (
    <div className="favorites-container p-4">
      <h1 className="text-2xl font-bold mb-6">My Favorite Recipes</h1>
      {favorites.length === 0 ? (
        <p className="text-gray-600">No favorite recipes yet.</p>
      ) : (
        <div className="grid gap-4">
          {favorites.map((recipe) => (
            <div key={recipe._id} className="recipe-card flex bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
              <img
                src={recipe.imageUrl || recipe.image}
                alt={recipe.name || recipe.title}
                className="w-32 h-32 object-cover"
              />
              <div className="flex flex-col justify-between p-4 flex-grow">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{recipe.name || recipe.title}</h3>
                  <p className="text-gray-600 mb-2">{recipe.cuisine} • {recipe.category}</p>
                  <p className="text-sm text-gray-500">{recipe.description}</p>
                </div>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Clock size={16} className="mr-1" />
                  <span>Prep: {recipe.prepTime} mins</span>
                  <span className="mx-2">|</span>
                  <span>Cook: {recipe.cookTime} mins</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {recipe.tags && recipe.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
