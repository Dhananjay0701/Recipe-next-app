import fs from 'fs';
import path from 'path';

const RECIPES_FILE = path.join(process.cwd(), 'data', 'recipes.json');

// Helper function to read recipes
console.log('RECIPES_FILE:', RECIPES_FILE);
export const getRecipes = () => {
  if (!fs.existsSync(RECIPES_FILE)) {
    // Create the directory if it doesn't exist
    const dir = path.dirname(RECIPES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Create empty recipes file
    fs.writeFileSync(RECIPES_FILE, JSON.stringify([]));
    return [];
  }
  
  const data = fs.readFileSync(RECIPES_FILE, 'utf8');
  const recipes = JSON.parse(data);
  
  // Ensure all recipes have the necessary fields
  recipes.forEach(recipe => {
    if (!recipe.hasOwnProperty('ingredients')) {
      recipe.ingredients = [];
    }
    if (!recipe.hasOwnProperty('recipeText')) {
      recipe.recipeText = '';
    }
  });
  
  return recipes;
};

// Helper function to write recipes
export const saveRecipes = (recipes) => {
  // Create the directory if it doesn't exist
  const dir = path.dirname(RECIPES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));
};
