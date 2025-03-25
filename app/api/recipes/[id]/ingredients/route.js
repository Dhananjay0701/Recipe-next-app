import { NextResponse } from 'next/server';
import { getRecipes, saveRecipes } from '../../../../_utils/recipe';
// OPTIONS handler for preflight request

// PUT endpoint to update recipe ingredients
export async function PUT(request, { params }) {
  try {
    const recipeId = params.id;
    const { ingredients } = await request.json();
    console.log('ingredientsid', recipeId);
    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { message: 'Valid ingredients array is required' },
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
    
    recipes[recipeIndex].ingredients = ingredients;
    saveRecipes(recipes);
    
    return NextResponse.json(recipes[recipeIndex]);
  } catch (error) {
    console.error('Error updating ingredients:', error);
    return NextResponse.json(
      { message: 'Error updating ingredients', error: error.toString() },
      { status: 500 }
    );
  }
}