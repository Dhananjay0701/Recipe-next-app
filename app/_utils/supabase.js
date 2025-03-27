import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured() {
  return supabaseUrl && supabaseAnonKey;
}

// Function to get all recipes from Supabase
export async function fetchRecipesFromSupabase() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*');
  
  if (error) {
    console.error('Error fetching recipes from Supabase:', error);
    throw error;
  }
  
  return data;
}

// Function to get a recipe by ID from Supabase
export async function fetchRecipeByIdFromSupabase(id) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching recipe ${id} from Supabase:`, error);
    throw error;
  }
  
  return data;
}

// Function to save a new recipe to Supabase
export async function saveRecipeToSupabase(recipe) {
  const { data, error } = await supabase
    .from('recipes')
    .insert([recipe])
    .select();
  
  if (error) {
    console.error('Error saving recipe to Supabase:', error);
    throw error;
  }
  
  return data[0];
}

// Function to update an existing recipe in Supabase
export async function updateRecipeInSupabase(id, recipe) {
  const { data, error } = await supabase
    .from('recipes')
    .update(recipe)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error(`Error updating recipe ${id} in Supabase:`, error);
    throw error;
  }
  
  return data[0];
}

// Function to delete a recipe from Supabase
export async function deleteRecipeFromSupabase(id) {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting recipe ${id} from Supabase:`, error);
    throw error;
  }
  
  return true;
}