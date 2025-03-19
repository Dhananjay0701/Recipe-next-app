import { NextResponse } from 'next/server';
import { getRecipes, saveRecipes } from '../../../../../utils/recipe';
import fs from 'fs';
import path from 'path';

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
        
        // Try to delete the actual file
        try {
          const uploadDir = '/Users/dhananjaytalati/code/recipe-manager/recipe-manager-new/frontend/public/static';
          const filePath = path.join(uploadDir, decodedFilename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error('Error deleting photo file:', err);
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