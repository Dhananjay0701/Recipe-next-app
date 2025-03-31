import React from 'react';
import Link from 'next/link';
import { fetchRecipes } from '../_utils/config';
import { getR2Url } from '../_utils/r2';

// Function to get the correct image URL (R2 or static)
function getImageUrl(imagePath) {
  if (!imagePath) return '';
  
  // If the image path is already a full URL, use it as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If the image path starts with 'static/', it's an R2 path
  if (imagePath.startsWith('static/')) {
    return getR2Url(imagePath);
  }
  
  // Otherwise, assume it's a local static file
  return `/static/${imagePath}`;
}

export default async function RecipesPage() {
  let recipes = [];
  let error = null;
  
  try {
    console.log('Fetching recipes for RecipesPage...');
    recipes = await fetchRecipes();
    console.log(`Successfully fetched ${recipes.length} recipes`);
  } catch (err) {
    console.error('Error loading recipes:', err);
    error = err.message;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">All Recipes</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error loading recipes: {error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.length > 0 ? (
          recipes.map((recipe) => (
            <div key={recipe.id} className="border rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-2">{recipe.name || recipe.Name}</h2>
              {(recipe.image_path || recipe.Image_path) && (
                <div className="aspect-video relative mb-4">
                  <img 
                    src={getImageUrl(recipe.image_path || recipe.Image_path)}
                    alt={recipe.name || recipe.Name}
                    className="object-cover w-full h-full rounded"
                  />
                </div>
              )}
              <p className="text-gray-600 mb-4 line-clamp-3">{recipe.recipe_text || recipe.recipeText}</p>
              <div className="flex justify-between items-center">
                <Link href={`/recipes/${recipe.id}`}>
                  <span className="text-blue-600 hover:underline">View Recipe</span>
                </Link>
                <div className="text-yellow-500">
                  Rating: {recipe.rating || recipe.Rating}/5
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
            {error ? 'Failed to load recipes.' : 'No recipes found.'}
          </p>
        )}
      </div>
    </div>
  );
}
