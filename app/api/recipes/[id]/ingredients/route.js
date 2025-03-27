import { getRecipeById, updateRecipe } from '../../../../_utils/recipe';
import { isSupabaseConfigured } from '../../../../_utils/config';

// Handler for database connection errors
const handleDatabaseError = (error) => {
  console.error('Database connection error:', error);
  return new Response(
    JSON.stringify({ 
      error: 'Database connection error', 
      message: 'Could not connect to Supabase database',
      details: error.message
    }),
    { 
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};

// Ensure we're running with Supabase access
const ensureSupabaseAccess = () => {
  if (!isSupabaseConfigured()) {
    const error = new Error('Supabase configuration required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    throw error;
  }
};

// PUT endpoint to update recipe ingredients
export async function PUT(request, { params }) {
  try {
    const recipeId = params.id;
    const { ingredients } = await request.json();
    console.log('ingredientsid', recipeId);
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return new Response(
        JSON.stringify({ message: 'Valid ingredients array is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    ensureSupabaseAccess();
    
    // Get existing recipe
    const recipe = await getRecipeById(recipeId);
    
    if (!recipe) {
      return new Response(
        JSON.stringify({ message: 'Recipe not found' }),
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Update ingredients using updateRecipe function
    const updatedRecipe = await updateRecipe(recipeId, { ingredients });
    
    // Get the fully updated recipe to return
    const fullUpdatedRecipe = await getRecipeById(recipeId);
    
    return new Response(
      JSON.stringify(fullUpdatedRecipe),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Error updating ingredients:', error);
    return handleDatabaseError(error);
  }
}