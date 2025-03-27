import { supabase } from './supabase';

// Get all recipes from Supabase
export async function getRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('id', { ascending: false });
  
  if (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
  
  return data;
}

// Get a recipe by ID from Supabase
export async function getRecipeById(id) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching recipe ${id}:`, error);
    throw error;
  }
  
  return data;
}

// Save a new recipe to Supabase
export async function saveRecipe(recipe) {
  // Convert the recipe object to match the Supabase schema (camelCase to snake_case)
  const supabaseRecipe = {
    id: recipe.id,
    name: recipe.Name,
    image_path: recipe.Image_path,
    date: recipe.date,
    rating: recipe.Rating,
    recipe_text: recipe.recipeText,
    ingredients: recipe.ingredients,
    links: recipe.links,
    photos: recipe.photos
  };
  
  const { data, error } = await supabase
    .from('recipes')
    .insert([supabaseRecipe])
    .select();
  
  if (error) {
    console.error('Error saving recipe:', error);
    throw error;
  }
  
  // Convert the returned Supabase data back to the application format
  const savedRecipe = {
    id: data[0].id,
    Name: data[0].name,
    Image_path: data[0].image_path,
    date: data[0].date,
    Rating: data[0].rating,
    recipeText: data[0].recipe_text,
    ingredients: data[0].ingredients,
    links: data[0].links,
    photos: data[0].photos
  };
  
  return savedRecipe;
}

// Update an existing recipe in Supabase
export async function updateRecipe(id, recipe) {
  // Convert the recipe object to match the Supabase schema
  const supabaseRecipe = {};
  
  // Handle all possible property name variations (camelCase, PascalCase, snake_case)
  if (recipe.Name !== undefined) supabaseRecipe.name = recipe.Name;
  if (recipe.name !== undefined) supabaseRecipe.name = recipe.name;
  
  if (recipe.Image_path !== undefined) supabaseRecipe.image_path = recipe.Image_path;
  if (recipe.image_path !== undefined) supabaseRecipe.image_path = recipe.image_path;
  
  if (recipe.date !== undefined) supabaseRecipe.date = recipe.date;
  
  if (recipe.Rating !== undefined) supabaseRecipe.rating = recipe.Rating;
  if (recipe.rating !== undefined) supabaseRecipe.rating = recipe.rating;
  
  if (recipe.recipeText !== undefined) supabaseRecipe.recipe_text = recipe.recipeText;
  if (recipe.recipe_text !== undefined) supabaseRecipe.recipe_text = recipe.recipe_text;
  
  if (recipe.ingredients !== undefined) supabaseRecipe.ingredients = recipe.ingredients;
  if (recipe.links !== undefined) supabaseRecipe.links = recipe.links;
  if (recipe.photos !== undefined) supabaseRecipe.photos = recipe.photos;
  
  console.log(`Updating recipe ${id} with:`, supabaseRecipe);
  
  const { data, error } = await supabase
    .from('recipes')
    .update(supabaseRecipe)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error(`Error updating recipe ${id}:`, error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    console.error(`No data returned when updating recipe ${id}`);
    throw new Error('No data returned from database update operation');
  }
  
  // Convert the returned Supabase data back to the application format
  const updatedRecipe = {
    id: data[0].id,
    Name: data[0].name,
    name: data[0].name,
    Image_path: data[0].image_path,
    image_path: data[0].image_path,
    date: data[0].date,
    Rating: data[0].rating,
    rating: data[0].rating,
    recipeText: data[0].recipe_text,
    recipe_text: data[0].recipe_text,
    ingredients: data[0].ingredients,
    links: data[0].links,
    photos: data[0].photos
  };
  
  return updatedRecipe;
}

// Delete a recipe from Supabase
export async function deleteRecipe(id) {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting recipe ${id}:`, error);
    throw error;
  }
  
  return true;
}
