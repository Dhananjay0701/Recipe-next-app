import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

async function getRecipes() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'recipes.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error loading recipes:', error);
    return [];
  }
}

export default async function RecipesPage() {
  const recipes = await getRecipes();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">All Recipes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.length > 0 ? (
          recipes.map((recipe) => (
            <div key={recipe.id} className="border rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-2">{recipe.title}</h2>
              {recipe.image && (
                <div className="aspect-video relative mb-4">
                  <img 
                    src={recipe.image} 
                    alt={recipe.title}
                    className="object-cover w-full h-full rounded"
                  />
                </div>
              )}
              <p className="text-gray-600 mb-4 line-clamp-3">{recipe.description}</p>
              <Link href={`/recipes/${recipe.id}`}>
                <span className="text-blue-600 hover:underline">View Recipe</span>
              </Link>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">No recipes found.</p>
        )}
      </div>
    </div>
  );
}
