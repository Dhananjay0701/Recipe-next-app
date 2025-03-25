import { getRecipes, saveRecipes } from '../../_utils/recipe';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// Handle GET requests
export async function GET() {
  try {
    const recipes = getRecipes();
    return NextResponse.json(recipes, { status: 200 });
  } catch (error) {
    console.error('Error retrieving recipes:', error);
    return NextResponse.json(
      { message: 'Error retrieving recipes', error: error.toString() }, 
      { status: 500 }
    );
  }
}

// Handle POST requests
export async function POST(request) {
  try {
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
      return NextResponse.json(
        { message: 'Name and rating are required' }, 
        { status: 400 }
      );
    }
    
    // Get the image file
    const imageFile = formData.get('image');
    
    if (!imageFile) {
      return NextResponse.json(
        { message: 'Image file is required' }, 
        { status: 400 }
      );
    }

    // Generate a unique filename
    const imageBytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(imageBytes);
    
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + 
                   imageFile.name.split('.').pop();
    
    const uploadDir = join(process.cwd(), 'public', 'static');
    
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Format the date (e.g., "20 Jan 2024")
    const now = new Date();
    const date = now.getDate().toString().padStart(2, '0') + ' ' + 
               now.toLocaleString('en-US', { month: 'short' }) + ' ' + 
               now.getFullYear();

    // Create new recipe object
    const newRecipe = {
      id: Date.now(), // Use timestamp as ID
      Name: name,
      Image_path: filename,
      date: date,
      Rating: parseFloat(rating),
      recipeText: recipeText || '',
      ingredients: ingredients || [],
      links: links || []
    };

    // Add to recipes
    const recipes = getRecipes();
    recipes.push(newRecipe);
    saveRecipes(recipes);

    return NextResponse.json(newRecipe, { status: 201 });
  } catch (error) {
    console.error('Error adding recipe:', error);
    return NextResponse.json(
      { message: 'Error adding recipe', error: error.toString() },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    },
  });
}
