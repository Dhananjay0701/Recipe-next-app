import { NextResponse } from 'next/server';
import { getRecipes, saveRecipes } from '../../../../../utils/recipe';
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

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

export async function GET(request, { params }) {
  try {
    // Get the recipe id and filename from the URL
    const recipeId = params.id;
    const filename = params.filename;
    
    // Construct the full path to the object in R2
    const objectKey = `recipe-photos/${recipeId}/${filename}`;
    
    // Fetch the image from R2
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    });

    const response = await R2.send(command);
    
    // Convert the stream to a buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Create a response with the image data and correct Content-Type
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error fetching image from R2:', error);
    return NextResponse.json(
      { message: 'Error fetching image', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a specific photo
export async function DELETE(request, { params }) {
  try {
    const { id, filename } = params;
    const recipes = getRecipes();
    const recipeIndex = recipes.findIndex(r => String(r.id) === String(id));
    
    if (recipeIndex === -1) {
      return NextResponse.json(
        { message: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    const decodedFilename = decodeURIComponent(filename);
    
    // Remove the photo from the recipe
    if (recipes[recipeIndex].photos) {
      const photoIndex = recipes[recipeIndex].photos.indexOf(decodedFilename);
      if (photoIndex !== -1) {
        recipes[recipeIndex].photos.splice(photoIndex, 1);
        
        // Delete the file from R2
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: decodedFilename,
          });
          
          await R2.send(deleteCommand);
        } catch (err) {
          console.error('Error deleting photo from R2:', err);
          // Continue even if file deletion fails
        }
        
        saveRecipes(recipes);
        return NextResponse.json({ message: 'Photo deleted successfully' });
      }
    }
    
    return NextResponse.json(
      { message: 'Photo not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { message: 'Error deleting photo', error: error.toString() },
      { status: 500 }
    );
  }
}