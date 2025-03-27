
import { getRecipeById, updateRecipe, deleteRecipe } from '../../../_utils/recipe';
import { isSupabaseConfigured } from '../../../_utils/config';

// Handler for database connection errors
const handleDatabaseError = (error) => {
  console.error('Database connection error:', error);
  return Response.json({ 
    error: 'Database connection error', 
    message: 'Could not connect to Supabase database',
    details: error.message
  }, { status: 503 });
};

// Ensure we're running with Supabase access
const ensureSupabaseAccess = () => {
  if (!isSupabaseConfigured()) {
    const error = new Error('Supabase configuration required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    throw error;
  }
};

// GET endpoint to retrieve a specific recipe by ID
export async function GET(request, { params }) {
  try {
    console.log('GET request to /api/recipes/[id]', params);
    const { id } = params;
    
    if (!id) {
      return Res.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }
    
    // Add validation to ensure ID is a number
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return Response.json(
        { error: `Invalid recipe ID: ${id}. ID must be a number.` },
        { status: 400 }
      );
    }
    
    // Ensure we have Supabase database access
    ensureSupabaseAccess();
    
    // Fetch the recipe
    const recipe = await getRecipeById(numericId);
    
    // If recipe not found
    if (!recipe) {
      return Response.json(
        { error: `Recipe not found with ID: ${id}` },
        { status: 404 }
      );
    }
    
    return Response.json(recipe);
  } catch (error) {
    console.error(`Error fetching recipe with ID: ${params?.id}`, error);
    return handleDatabaseError(error);
  }
}

// PUT endpoint to update an entire recipe
export async function PUT(request, { params }) {
  try {
    const recipeId = params.id;
    
    // Add validation to ensure ID is a number
    const numericId = Number(recipeId);
    if (isNaN(numericId)) {
      return Response.json(
        { error: `Invalid recipe ID: ${recipeId}. ID must be a number.` },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Basic validation
    if (!data) {
      return Response.json(
        { message: 'No update data provided' },
        { status: 400 }
      );
    }
    
    // Ensure we have Supabase database access
    ensureSupabaseAccess();
    
    // Get existing recipe
    const existingRecipe = await getRecipeById(numericId);
    
    if (!existingRecipe) {
      return Response.json(
        { message: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    // Update recipe in Supabase
    const updatedRecipe = await updateRecipe(numericId, data);
    
    return Response.json(updatedRecipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    return handleDatabaseError(error);
  }
}

// DELETE endpoint to remove a recipe
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return Response.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }
    
    // Add validation to ensure ID is a number
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return Response.json(
        { error: `Invalid recipe ID: ${id}. ID must be a number.` },
        { status: 400 }
      );
    }
    
    // Ensure we have Supabase database access
    ensureSupabaseAccess();
    
    // Try to delete the recipe
    await deleteRecipe(numericId);
    
    return Response.json(
      { message: `Recipe with ID: ${id} has been deleted` }
    );
  } catch (error) {
    console.error(`Error deleting recipe with ID: ${params?.id}`, error);
    return handleDatabaseError(error);
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    },
  });
}