import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// This script should be run using Node.js
// node data/migrate_to_supabase.js

// Load environment variables
dotenv.config();

// Get current file directory (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? '✓ Set (hidden for security)' : 'Not set');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verify connection to Supabase
async function verifySupabaseConnection() {
  try {
    console.log('Verifying Supabase connection...');
    
    // Simple query to verify connection
    const { data, error } = await supabase.from('recipes').select('count').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Table "recipes" does not exist yet. This is okay, we will create it now.');
        return true; // Continue with migration
      } else {
        console.error('❌ Supabase connection failed:', error.message);
        console.error('Error details:', error);
        return false;
      }
    }
    
    console.log('✅ Successfully connected to Supabase!');
    return true;
  } catch (err) {
    console.error('❌ Failed to connect to Supabase:', err.message);
    console.error('Error details:', err);
    return false;
  }
}

// Check if recipes table exists
async function checkRecipesTable() {
  try {
    console.log('Checking if recipes table exists...');
    
    // Using system tables to check if our table exists
    const { data, error } = await supabase
      .rpc('check_table_exists', { table_name: 'recipes' });
    
    if (error) {
      console.error('❌ Error checking if table exists:', error.message);
      
      // Try to create the function if it doesn't exist
      await supabase.rpc('create_check_table_function');
      
      // Alternative approach - try direct SQL
      const { data: tableExists, error: tableCheckError } = await supabase.from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'recipes')
        .eq('table_schema', 'public');
      
      if (tableCheckError) {
        console.error('❌ Could not verify table existence. Continuing anyway...');
        return false;
      }
      
      return tableExists && tableExists.length > 0;
    }
    
    return data;
  } catch (err) {
    console.error('❌ Error checking table:', err.message);
    return false;
  }
}

async function migrateRecipes() {
  try {
    console.log('Starting migration to Supabase...');
    
    // First verify connection
    const isConnected = await verifySupabaseConnection();
    if (!isConnected) {
      console.error('❌ Cannot proceed with migration due to connection issues.');
      process.exit(1);
    }
    
    // STEP 1: Create the table in Supabase (using SQL)
    console.log('Creating recipes table if it doesn\'t exist...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS recipes (
        id BIGINT PRIMARY KEY,
        name TEXT NOT NULL,
        image_path TEXT,
        date TEXT,
        rating REAL,
        recipe_text TEXT,
        ingredients JSONB DEFAULT '[]',
        links JSONB DEFAULT '[]',
        photos JSONB DEFAULT '[]'
      );
    `;
    
    // Execute the create table SQL
    const { error: createTableError } = await supabase.rpc('run_sql', { sql: createTableSQL });
    
    if (createTableError) {
      console.error('❌ Error creating table:', createTableError.message);
      console.log('You may need to create the table manually in the Supabase dashboard using this SQL:');
      console.log(createTableSQL);
    } else {
      console.log('✅ Table created or already exists');
    }
    
    // STEP 2: Load the JSON file with recipes
    const recipesFilePath = path.join(process.cwd(), 'data/recipes.json');
    console.log(`Loading recipes from ${recipesFilePath}`);
    
    if (!fs.existsSync(recipesFilePath)) {
      console.error(`❌ File not found: ${recipesFilePath}`);
      process.exit(1);
    }
    
    const rawData = fs.readFileSync(recipesFilePath, 'utf8');
    const recipes = JSON.parse(rawData);
    
    // STEP 3: Insert each recipe into Supabase
    console.log(`Found ${recipes.length} recipes to migrate`);
    
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const recipe of recipes) {
      try {
        // Convert the recipe object to match the Supabase schema
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
        
        console.log(`Inserting recipe: ${recipe.Name} (ID: ${recipe.id})`);
        
        // Insert into Supabase with detailed error handling
        const { data, error } = await supabase
          .from('recipes')
          .insert([supabaseRecipe])
          .select();
        
        if (error) {
          console.error(`❌ Error inserting recipe ${recipe.id}:`, error.message);
          console.error('Error details:', error);
          errorCount++;
        } else if (!data || data.length === 0) {
          console.error(`⚠️ No data returned when inserting recipe ${recipe.id}`);
          errorCount++;
        } else {
          console.log(`✅ Inserted recipe: ${recipe.Name} (ID: ${recipe.id})`);
          insertedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing recipe ${recipe.id}:`, error.message);
        console.error('Error details:', error);
        errorCount++;
      }
    }
    
    console.log('\nMigration Summary:');
    console.log(`- Total recipes: ${recipes.length}`);
    console.log(`- Successfully inserted: ${insertedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
    if (insertedCount === recipes.length) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️ Migration completed with some errors.');
    }
    
  } catch (error) {
    console.error(`❌ Migration failed:`, error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run migration
migrateRecipes(); 