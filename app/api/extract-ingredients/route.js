
import { extractIngredientsFromRecipe } from '../../_utils/ingredients_llm';

export async function POST(request) {
  try {
    const { recipeText } = await request.json();
    if (!recipeText) {
      return Response.json({ 
        message: 'Recipe text is required',
        ingredients: []
      }, { status: 400 });
    }
    
    const ingredients = await extractIngredientsFromRecipe(recipeText);
    
    return Response.json({ 
      message: 'Ingredients extracted successfully',
      ingredients 
    });
  } catch (error) {
    console.error('Error extracting ingredients:', error);
    return Response.json({ 
      message: 'Error extracting ingredients', 
      error: error.toString(),
      ingredients: []
    }, { status: 500 });
  }
}