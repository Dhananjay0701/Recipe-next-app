import { NextResponse } from 'next/server';
import { getRecipes, saveRecipes } from '../../../../utils/recipe';
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

// GET endpoint to get all photos for a recipe
export async function GET(request, { params }) {
  try {
    const recipeId = params.id;
    const recipes = getRecipes();
    const recipe = recipes.find(r => String(r.id) === String(recipeId));
    
    if (!recipe) {
      return NextResponse.json(
        { message: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    const photosList = recipe.photos || [];
    return NextResponse.json({ photos: photosList });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { message: 'Error fetching photos', error: error.toString() },
      { status: 500 }
    );
  }
}

// POST endpoint to add a photo to a recipe
export async function POST(request, { params }) {
  try {
    const recipeId = params.id;
    const formData = await request.formData();
    const photoFile = formData.get('photo');
    
    if (!photoFile) {
      return NextResponse.json(
        { message: 'No photo uploaded', error: 'No file received' },
        { status: 400 }
      );
    }
    
    const recipes = getRecipes();
    const recipeIndex = recipes.findIndex(r => String(r.id) === String(recipeId));
    
    if (recipeIndex === -1) {
      return NextResponse.json(
        { message: 'Recipe not found', error: `Recipe with ID ${recipeId} not found` },
        { status: 404 }
      );
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
    if (!recipes[recipeIndex].photos) {
      recipes[recipeIndex].photos = [];
    }
    
    // Add the new photo to the recipe
    recipes[recipeIndex].photos.push(r2Path);
    saveRecipes(recipes);
    
    return NextResponse.json(
      { message: 'Photo added successfully', photoPath: r2Path },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding photo:', error);
    return NextResponse.json(
      { message: 'Error adding photo', error: error.toString(), details: error.message },
      { status: 500 }
    );
  }
}