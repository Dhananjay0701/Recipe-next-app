import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Get the current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if Supabase credentials exist
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing!');
  process.exit(1);
}

// For migrations, we need the service role key
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is missing!');
  console.error('This is required to run migrations. Add it to your .env file.');
  process.exit(1);
}

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Read the SQL file
const sqlFilePath = path.join(__dirname, '..', 'create_user_information.sql');
let sqlContent;

try {
  sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  console.log('Successfully read SQL file.');
} catch (error) {
  console.error('Error reading SQL file:', error.message);
  process.exit(1);
}

// Execute SQL statements
async function runMigration() {
  try {
    console.log('Running migration...');
    
    // Most Supabase instances have the pg_raw extension enabled which allows executing raw SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }
    
    console.log('Migration successful!');
    console.log('Auth tables are now set up and ready to use with better-auth.');
    
  } catch (error) {
    console.error('Error executing migration:', error.message);
    
    if (error.message.includes('function "exec_sql" does not exist')) {
      console.error('\nThe exec_sql function seems to be missing in your Supabase instance.');
      console.error('You may need to:');
      console.error('1. Enable the pg_raw extension in your Supabase dashboard');
      console.error('2. Create the exec_sql function manually in the SQL editor:');
      console.error(`
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      console.error('3. Try running this script again');
    } else if (error.message.includes('permission denied')) {
      console.error('\nPermission denied error. Make sure:');
      console.error('1. You are using the SUPABASE_SERVICE_ROLE_KEY, not the anon key');
      console.error('2. The service role has necessary permissions');
    }
    
    process.exit(1);
  }
}

// Run the migration
runMigration(); 