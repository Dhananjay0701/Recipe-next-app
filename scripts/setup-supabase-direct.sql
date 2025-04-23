-- Direct Supabase SQL setup for Better Auth
-- Paste this entire file into your Supabase SQL Editor and run it

-- Create the exec_sql function needed by the setup script
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the user_information table for Better Auth
CREATE TABLE IF NOT EXISTS public.user_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" TIMESTAMP WITH TIME ZONE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a sessions table (required by Better Auth)
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES public.user_information(id) ON DELETE CASCADE,
  "sessionToken" TEXT UNIQUE NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create an accounts table for linking social providers (required by Better Auth)
CREATE TABLE IF NOT EXISTS public.auth_accounts (
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
);

-- Create verification tokens table for email verification
CREATE TABLE IF NOT EXISTS public.auth_verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Add Row Level Security (RLS) policies if needed
ALTER TABLE public.user_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Grant access to the authenticated Supabase service role
-- This allows the server-side API to work with the auth tables
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.user_information TO service_role;
GRANT ALL ON public.auth_sessions TO service_role;
GRANT ALL ON public.auth_accounts TO service_role;
GRANT ALL ON public.auth_verification_tokens TO service_role;

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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON public.auth_sessions("userId");
CREATE INDEX IF NOT EXISTS idx_auth_accounts_user_id ON public.auth_accounts("userId");
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON public.auth_sessions("sessionToken");

-- Add a test user for quick testing (optional - you can remove this)
-- The test user's password will be 'Test123!'
DO $$
BEGIN
  -- First check if user exists in Supabase Auth
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'test@example.com'
  ) THEN
    -- Insert into Supabase Auth (this uses auth.users which is Supabase's built-in users table)
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, 
      confirmation_sent_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(), 'test@example.com', 
      crypt('Test123!', gen_salt('bf')), -- Password with bcrypt hashing
      now(), now(), now(), now()
    );
  END IF;
END;
$$; 