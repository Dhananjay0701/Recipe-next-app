import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

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

async function createTables() {
  console.log('Setting up auth tables directly using Supabase API...');
  
  try {
    // 1. Create user_information table
    console.log('Creating user_information table...');
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'user_information',
      definition: `
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        email TEXT UNIQUE,
        "emailVerified" TIMESTAMP WITH TIME ZONE,
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `
    });
    
    // 2. Create auth_sessions table
    console.log('Creating auth_sessions table...');
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'auth_sessions',
      definition: `
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES public.user_information(id) ON DELETE CASCADE,
        "sessionToken" TEXT UNIQUE NOT NULL,
        expires TIMESTAMP WITH TIME ZONE NOT NULL
      `
    });
    
    // 3. Create auth_accounts table
    console.log('Creating auth_accounts table...');
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'auth_accounts',
      definition: `
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES public.user_information(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at BIGINT,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, "providerAccountId")
      `
    });
    
    // 4. Create auth_verification_tokens table
    console.log('Creating auth_verification_tokens table...');
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'auth_verification_tokens',
      definition: `
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY (identifier, token)
      `
    });
    
    console.log('All tables created successfully!');
    
    // 5. Create indexes
    console.log('Creating indexes...');
    await supabase.rpc('create_index_if_not_exists', {
      table_name: 'auth_sessions',
      index_name: 'idx_auth_sessions_user_id',
      column_name: '"userId"'
    });
    
    await supabase.rpc('create_index_if_not_exists', {
      table_name: 'auth_accounts',
      index_name: 'idx_auth_accounts_user_id',
      column_name: '"userId"'
    });
    
    await supabase.rpc('create_index_if_not_exists', {
      table_name: 'auth_sessions',
      index_name: 'idx_auth_sessions_token',
      column_name: '"sessionToken"'
    });
    
    console.log('All indexes created successfully!');
    
    // 6. Set up RLS policies
    console.log('Setting up RLS policies...');
    
    // Enable RLS on all tables
    await Promise.all([
      supabase.rpc('enable_rls', { table_name: 'user_information' }),
      supabase.rpc('enable_rls', { table_name: 'auth_sessions' }),
      supabase.rpc('enable_rls', { table_name: 'auth_accounts' }),
      supabase.rpc('enable_rls', { table_name: 'auth_verification_tokens' })
    ]);
    
    console.log('RLS enabled on all tables');
    
    // Create policies
    // Note: This part might still need direct SQL, but you can execute it manually
    console.log('\nAUTOMATED SETUP COMPLETED!');
    console.log('\nYou still need to create RLS policies. Please run the following SQL in your Supabase SQL Editor:');
    console.log(`
-- Create RLS policies for user_information table
DROP POLICY IF EXISTS "Users can view their own data" ON public.user_information;
CREATE POLICY "Users can view their own data" 
  ON public.user_information FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role has full access to user_information" ON public.user_information;
CREATE POLICY "Service role has full access to user_information" 
  ON public.user_information 
  USING (auth.jwt() ? 'service_role');

-- Create RLS policies for auth_sessions table  
DROP POLICY IF EXISTS "Service role has full access to auth_sessions" ON public.auth_sessions;
CREATE POLICY "Service role has full access to auth_sessions" 
  ON public.auth_sessions 
  USING (auth.jwt() ? 'service_role');

DROP POLICY IF EXISTS "Users can access their own sessions" ON public.auth_sessions;
CREATE POLICY "Users can access their own sessions" 
  ON public.auth_sessions FOR SELECT
  USING ("userId" = auth.uid());

-- Create RLS policies for auth_accounts table
DROP POLICY IF EXISTS "Service role has full access to auth_accounts" ON public.auth_accounts;
CREATE POLICY "Service role has full access to auth_accounts" 
  ON public.auth_accounts
  USING (auth.jwt() ? 'service_role');

DROP POLICY IF EXISTS "Users can access their own accounts" ON public.auth_accounts;
CREATE POLICY "Users can access their own accounts" 
  ON public.auth_accounts FOR SELECT
  USING ("userId" = auth.uid());

-- Create RLS policies for auth_verification_tokens table
DROP POLICY IF EXISTS "Service role has full access to auth_verification_tokens" ON public.auth_verification_tokens;
CREATE POLICY "Service role has full access to auth_verification_tokens" 
  ON public.auth_verification_tokens
  USING (auth.jwt() ? 'service_role');
    `);
    
  } catch (error) {
    console.error('Error setting up tables:', error.message);
    
    // Handle missing RPC functions
    if (error.message.includes('does not exist')) {
      console.error('\nIt seems some required RPC functions are missing. You will need to create the tables manually.');
      console.error('Please go to the Supabase SQL Editor and execute the create_user_information.sql script directly.');
    }
  }
}

createTables(); 