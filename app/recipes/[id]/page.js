import React from 'react';
import Link from 'next/link';
import { fetchRecipeById } from '../../_utils/config';

export default async function RecipeDetailPage({ params }) {
  const { id } = params;
  let recipe = null;
  let error = null;
  
  try {
    console.log(`Fetching recipe with ID: ${id}`);
    recipe = await fetchRecipeById(id);
    console.log('Recipe fetched:', recipe);
  } catch (err) {
    console.error(`Error loading recipe ID ${id}:`, err);
    error = err.message;
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error loading recipe: {error}</p>
        </div>
        <Link href="/recipes">
          <span className="text-blue-600 hover:underline">← Back to Recipes</span>
        </Link>
      </div>
    );
  }
  
  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Recipe not found.</p>
        </div>
        <Link href="/recipes">
          <span className="text-blue-600 hover:underline">← Back to Recipes</span>
        </Link>
      </div>
    );
  }
  
  // Normalize field names (handle both camelCase and PascalCase fields)
  const name = recipe.name || recipe.Name;
  const imagePath = recipe.image_path || recipe.Image_path;
  const date = recipe.date;
  const rating = recipe.rating || recipe.Rating;
  const recipeText = recipe.recipe_text || recipe.recipeText;
  const ingredients = recipe.ingredients || [];
  const links = recipe.links || [];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/recipes">
        <span className="text-blue-600 hover:underline mb-4 inline-block">← Back to Recipes</span>
      </Link>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {imagePath && (
            <div className="md:w-1/3">
              <img 
                src={`/static/${imagePath}`} 
                alt={name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-6 md:w-2/3">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
            
            <div className="flex items-center mb-4">
              <div className="text-yellow-500 mr-2">
                Rating: {rating}/5
              </div>
              <div className="text-gray-500 text-sm">
                Added on {date}
              </div>
            </div>
            
            {recipeText && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Instructions</h2>
                <div className="text-gray-700 whitespace-pre-line">
                  {recipeText}
                </div>
              </div>
            )}
            
            {ingredients.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Ingredients</h2>
                <ul className="list-disc list-inside text-gray-700">
                  {ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {links.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Related Links</h2>
                <ul className="list-disc list-inside text-blue-600">
                  {links.map((link, index) => (
                    <li key={index}>
                      <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 