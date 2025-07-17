const Recipe = require('../models/Recipe');
const User = require('../models/User');


const getRecommendations = async (req, res) => {
    try {
      const { userId } = req.params;
  
      const user = await User.findById(userId).populate('favorites');
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const favoriteRecipes = user.favorites;
  
      if (favoriteRecipes.length === 0) {
        const popularRecipes = await Recipe.find().sort({ likes: -1 }).limit(10);
        return res.json({ recommendations: popularRecipes });
      }
  
      const categories = favoriteRecipes.map((r) => r.category);
      const cuisines = favoriteRecipes.map((r) => r.cuisine);
  
      const recommendedRecipes = await Recipe.find({
        $or: [
          { category: { $in: categories } },
          { cuisine: { $in: cuisines } },
        ],
        _id: { $nin: favoriteRecipes.map((r) => r._id) },
      }).limit(10);
  
      res.json({ recommendations: recommendedRecipes });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching recommendations' });
    }
  };
  
  module.exports = { getRecommendations };  