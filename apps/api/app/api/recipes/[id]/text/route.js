import { NextResponse } from 'next/server';
import { getRecipes, saveRecipes } from '../../../../utils/recipe';

// PUT endpoint to update recipe text
export async function PUT(request, { params }) {
  try {
    const recipeId = params.recipeId;
    const { recipeText } = await request.json();
    
    if (recipeText === undefined) {
      return NextResponse.json(
        { message: 'Recipe text is required' },
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
    
    recipes[recipeIndex].recipeText = recipeText;
    saveRecipes(recipes);
    
    return NextResponse.json(recipes[recipeIndex]);
  } catch (error) {
    return NextResponse.json(
      { message: 'Error updating recipe text', error: error.toString() },
      { status: 500 }
    );
  }
}