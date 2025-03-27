
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

// PUT endpoint to update recipe text
export async function PUT(request, { params }) {
  try {
    const recipeId = params.id;
    const { recipeText } = await request.json();
    
    if (recipeText === undefined) {
      return new Response(
        JSON.stringify({ message: 'Recipe text is required' }),
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
    
    // Update recipe text using updateRecipe function
    const updatedRecipe = await updateRecipe(recipeId, { recipeText });
    
    return new Response(
      JSON.stringify(updatedRecipe),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error updating recipe text:', error);
    return handleDatabaseError(error);
  }
}