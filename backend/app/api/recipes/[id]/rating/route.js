import { NextResponse } from 'next/server';
import { getRecipes, saveRecipes } from '../../../../utils/recipe';

// PUT endpoint to update recipe rating
export async function PUT(request, { params }) {
  try {
    const recipeId = params.id;
    const { rating } = await request.json();
    
    if (rating === undefined || rating < 0 || rating > 5) {
      return NextResponse.json(
        { message: 'Invalid rating. Must be between 0 and 5' },
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
    
    recipes[recipeIndex].Rating = parseFloat(rating);
    saveRecipes(recipes);
    
    return NextResponse.json(recipes[recipeIndex]);
  } catch (error) {
    return NextResponse.json(
      { message: 'Error updating rating', error: error.toString() },
      { status: 500 }
    );
  }
}