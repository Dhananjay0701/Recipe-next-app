import { getRecipes, getRecipeById, saveRecipe, updateRecipe, deleteRecipe } from '../../_utils/recipe';
import { isSupabaseConfigured } from '../../_utils/config';
import { uploadToR2 } from '../../_utils/r2';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// Handler for database connection errors
const handleDatabaseError = (error) => {
  console.error('Database connection error:', error);
  return Response.json({
      error: 'Database connection error', 
      message: 'Could not connect to Supabase database',
      details: error.message
    },
    { 
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};

// Ensure we have access to Supabase
const ensureSupabaseAccess = () => {
  if (!isSupabaseConfigured()) {
    const error = new Error('Supabase configuration required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    throw error;
  }
};

// Handle GET requests
export async function GET(request) {
  try {
    // Check if we have access to the Supabase database
    console.log('GET request to /api/recipes');
    ensureSupabaseAccess();
    
    // Get all recipes from the database
    const recipes = await getRecipes();
    console.log('Recipes fetched:', recipes.length);
    return Response.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return handleDatabaseError(error);
  }
}

// Handle POST requests
export async function POST(request) {
  try {
    // Check if we have access to the Supabase database
    ensureSupabaseAccess();
    
    const formData = await request.formData();
    
    const name = formData.get('name');
    const rating = formData.get('rating');
    const recipeText = formData.get('recipeText');
    
    let ingredients = [];
    if (formData.get('ingredients')) {
      try {
        ingredients = JSON.parse(formData.get('ingredients'));
      } catch (err) {
        console.error('Invalid ingredients format:', err);
      }
    }
    
    let links = [];
    if (formData.get('links')) {
      try {
        links = JSON.parse(formData.get('links'));
      } catch (err) {
        console.error('Invalid links format:', err);
      }
    }

    let photos = [];
    if (formData.get('photos')) {
      try {
        photos = JSON.parse(formData.get('photos'));
      } catch (err) {
        console.error('Invalid photos format:', err);
      }
    }

    // Validate input
    if (!name || !rating) {
      return Response.json(
        { message: 'Name and rating are required' }, 
        { status: 400 }
      );
    }
    
    // Get the image file
    const imageFile = formData.get('image');
    
    if (!imageFile) {
      return Response.json(
        { message: 'Image file is required' }, 
        { status: 400 }
      );
    }

    // Generate a unique filename
    const imageBytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(imageBytes);
    
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + 
                   imageFile.name.split('.').pop();
    
    // Upload to R2 instead of local filesystem
    const r2Path = await uploadToR2(
      buffer, 
      filename, 
      imageFile.type || 'image/jpeg', 
      'static'
    );

    // Format the date (e.g., "20 Jan 2024")
    const now = new Date();
    const date = now.getDate().toString().padStart(2, '0') + ' ' + 
               now.toLocaleString('en-US', { month: 'short' }) + ' ' + 
               now.getFullYear();

    // Create new recipe object
    const newRecipe = {
      id: Date.now(), // Use timestamp as ID
      Name: name,
      Image_path: r2Path, // Store the R2 path instead of just the filename
      date: date,
      Rating: parseFloat(rating),
      recipeText: recipeText || '',
      ingredients: ingredients || [],
      links: links || [],
      photos: photos || []
    };

    // Save to database
    const savedRecipe = await saveRecipe(newRecipe);
    
    return Response.json(savedRecipe, { status: 201 });
  } catch (error) {
    console.error('Error adding recipe:', error);
    return handleDatabaseError(error);
  }
}

// Handle PUT requests to update existing recipes
export async function PUT(request) {
  try {
    ensureSupabaseAccess();
    
    const { id, ...recipeData } = await request.json();
    
    if (!id) {
      return Response.json(
        { message: 'Recipe ID is required' },
        { status: 400 }
      );
    }
    
    const updatedRecipe = await updateRecipe(id, recipeData);
    
    return Response.json(updatedRecipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    return handleDatabaseError(error);
  }
}

// Handle DELETE requests
export async function DELETE(request) {
  try {
    ensureSupabaseAccess();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json(
        { message: 'Recipe ID is required' },
        { status: 400 }
      );
    }
    
    await deleteRecipe(id);
    
    return Response.json(
      { message: 'Recipe deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting recipe:', error);
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
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    },
  });
}
