import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for admin-level operations
// WARNING: This should only be used on the server side and never exposed to the client
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase admin credentials. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.');
}

// Initialize the Supabase admin client with service role credentials 
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // This is your service role key, not the anon key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

export { supabaseAdmin };

// Helper function to execute raw SQL through the Supabase admin client
export async function executeSql(sqlString) {
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
      sql_query: sqlString 
    });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('SQL Execution Error:', error);
    return { success: false, error };
  }
}

// Creates or updates auth tables based on the SQL file content
export async function setupAuthTables() {
  // This function can be expanded to read your SQL file and apply it
  try {
    // Load the migrations from create_user_information.sql or inline the SQL
    const { success, error } = await executeSql(`
      -- Your SQL migration scripts here if needed
    `);
    
    if (!success) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error setting up auth tables:', error);
    return { success: false, error };
  }
} 