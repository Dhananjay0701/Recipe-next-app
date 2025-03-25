import { NextResponse } from 'next/server';
import { getRecipes, saveRecipes } from '../../../_utils/recipe';


// GET endpoint to retrieve a specific recipe by ID
export async function GET(request, { params }) {
  try {
    const recipeId = params.id;
    const recipes = getRecipes();
    // Find recipe by ID
    const recipe = recipes.find(r => String(r.id) === String(recipeId));
    
    if (!recipe) {
      return NextResponse.json(
        { message: 'Recipe not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(recipe);
  } catch (error) {
    return NextResponse.json(
      { message: 'Error retrieving recipe', error: error.toString() },
      { status: 500 }
    );
  }
}

// PUT endpoint to update an entire recipe
export async function PUT(request, { params }) {
  try {
    const recipeId = params.id;
    const data = await request.json();
    
    // Basic validation
    if (!data) {
      return NextResponse.json(
        { message: 'No update data provided' },
        { status: 400 }
      );
    }
    
    const recipes = getRecipes();
    const recipeIndex = recipes.findIndex(r => String(r.id) === String(recipeId));
    
    if (recipeIndex === -1) {
      return NextResponse.json(
        { message: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    // Update recipe fields (excluding id and creation properties)
    const updatedRecipe = {
      ...recipes[recipeIndex],
      ...data,
      // Preserve the original id
      id: recipes[recipeIndex].id
    };
    
    recipes[recipeIndex] = updatedRecipe;
    saveRecipes(recipes);
    
    return NextResponse.json(updatedRecipe);
  } catch (error) {
    return NextResponse.json(
      { message: 'Error updating recipe', error: error.toString() },
      { status: 500 }
    );
  }
}