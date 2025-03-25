import { NextResponse } from 'next/server';
import { getRecipes, saveRecipes } from '../../../../_utils/recipe';

// PUT endpoint to update recipe links
export async function PUT(request, { params }) {
  try {
    const recipeId = params.id;
    const { links } = await request.json();
    
    if (!links || !Array.isArray(links)) {
      return NextResponse.json(
        { message: 'Valid links array is required' },
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
    
    recipes[recipeIndex].links = links;
    saveRecipes(recipes);
    
    return NextResponse.json(recipes[recipeIndex]);
  } catch (error) {
    console.error('Error updating links:', error);
    return NextResponse.json(
      { message: 'Error updating links', error: error.toString() },
      { status: 500 }
    );
  }
}