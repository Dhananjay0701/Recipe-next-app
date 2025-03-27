import { getRecipeById, updateRecipe } from '../../../../_utils/recipe';
import { isSupabaseConfigured } from '../../../../_utils/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Initialize R2 client
const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

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

// GET endpoint to get all photos for a recipe
export async function GET(request, { params }) {
  try {
    const recipeId = params.id;
    
    ensureSupabaseAccess();
    
    // Get recipe from Supabase
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
    
    const photosList = recipe.photos || [];
    return new Response(
      JSON.stringify({ photos: photosList }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching photos:', error);
    return handleDatabaseError(error);
  }
}

// POST endpoint to add a photo to a recipe
export async function POST(request, { params }) {
  // Immediately create a response to acknowledge receipt of the upload
  // This allows the upload to continue in the background after the response
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  
  // Start the background processing
  processPhotoUpload(request, params, writer).catch(error => {
    console.error('Uncaught error in photo upload:', error);
  });
  
  // Return the stream response immediately, allowing the upload to continue
  return new Response(responseStream.readable);
}

// Background processing function that continues even if client disconnects
async function processPhotoUpload(request, params, writer) {
  try {
    const recipeId = params.id;
    const formData = await request.formData();
    const photoFile = formData.get('photo');
    
    if (!photoFile) {
      writer.write(
        new TextEncoder().encode(JSON.stringify({ 
          message: 'No photo uploaded', 
          error: 'No file received' 
        }))
      );
      writer.close();
      return;
    }
    
    ensureSupabaseAccess();
    
    // Get recipe from Supabase
    const recipe = await getRecipeById(recipeId);
    
    if (!recipe) {
      writer.write(
        new TextEncoder().encode(JSON.stringify({ 
          message: 'Recipe not found', 
          error: `Recipe with ID ${recipeId} not found` 
        }))
      );
      writer.close();
      return;
    }
    
    // Handle the file upload to R2
    const bytes = await photoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a unique filename
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + 
                     photoFile.name.split('.').pop();
    
    // Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `recipe-photos/${recipeId}/${filename}`,
      Body: buffer,
      ContentType: photoFile.type,
    });
    
    await R2.send(uploadCommand);
    
    // Store the R2 path in the recipe data
    const r2Path = `recipe-photos/${recipeId}/${filename}`;
    
    // Initialize photos array if it doesn't exist
    const photos = recipe.photos || [];
    
    // Add the new photo to the recipe
    photos.push(r2Path);
    console.log('Updating recipe with new photo path:', r2Path);
    console.log('Total photos after adding:', photos.length);
    
    // Update the recipe in Supabase with the new photos array
    try {
      await updateRecipe(recipeId, { photos });
      console.log('Recipe updated successfully with new photos');
      
      // Send the success response with the photo path
      writer.write(
        new TextEncoder().encode(JSON.stringify({ 
          message: 'Photo added successfully', 
          photoPath: r2Path 
        }))
      );
      writer.close();
    } catch (updateError) {
      console.error('Error updating recipe with new photo:', updateError);
      writer.write(
        new TextEncoder().encode(JSON.stringify({ 
          message: 'Error updating recipe with photo', 
          error: updateError.toString() 
        }))
      );
      writer.close();
    }
  } catch (error) {
    console.error('Error adding photo:', error);
    writer.write(
      new TextEncoder().encode(JSON.stringify({ 
        error: 'Database connection error', 
        message: 'Could not connect to Supabase database',
        details: error.message
      }))
    );
    writer.close();
  }
}