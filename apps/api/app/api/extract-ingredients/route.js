import { NextResponse } from 'next/server';
import { extractIngredientsFromRecipe } from '../../utils/ingredients_llm';

export async function POST(request) {
  try {
    const { recipeText } = await request.json();
    if (!recipeText) {
      return NextResponse.json({ 
        message: 'Recipe text is required',
        ingredients: []
      }, { status: 400 });
    }
    
    const ingredients = await extractIngredientsFromRecipe(recipeText);
    
    return NextResponse.json({ 
      message: 'Ingredients extracted successfully',
      ingredients 
    });
  } catch (error) {
    console.error('Error extracting ingredients:', error);
    return NextResponse.json({ 
      message: 'Error extracting ingredients', 
      error: error.toString(),
      ingredients: []
    }, { status: 500 });
  }
}