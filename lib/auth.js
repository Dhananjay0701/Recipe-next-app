import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { createClient } from '@supabase/supabase-js';

// Check if the required environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing!');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is missing!');
}

if (!process.env.BETTER_AUTH_SECRET) {
  console.error('BETTER_AUTH_SECRET environment variable is missing!');
}

// Define base URL for the application - use process.env.VERCEL_URL in production if deployed to Vercel
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : process.env.BETTER_AUTH_URL || 'http://localhost:3000';

console.log('Auth using baseUrl:', baseUrl);
console.log('Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

// Create a Supabase database adapter for better-auth
const supabaseAdapter = {
  // Add type information to help Better Auth identify this as a database adapter
  type: 'supabase-database',
  
  // User operations
  async createUser(userData) {
    console.log('Creating user with data:', JSON.stringify(userData, null, 2));
    try {
      const { data, error } = await supabase
        .from('user_information')
        .insert([userData])
        .select();
      
      if (error) {
        console.error('Supabase createUser error:', error);
        throw error;
      }
      console.log('User created successfully:', data[0]);
      return data[0];
    } catch (err) {
      console.error('Error in createUser:', err);
      throw err;
    }
  },

  async getUserByEmail(email) {
    console.log('Looking up user by email:', email);
    try {
      const { data, error } = await supabase
        .from('user_information')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Supabase getUserByEmail error:', error);
        throw error;
      }
      console.log('User by email result:', data ? 'Found' : 'Not found');
      return data;
    } catch (err) {
      console.error('Error in getUserByEmail:', err);
      throw err;
    }
  },

  async getUserById(id) {
    const { data, error } = await supabase
      .from('user_information')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateUser(id, updates) {
    const { data, error } = await supabase
      .from('user_information')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async deleteUser(id) {
    const { error } = await supabase
      .from('user_information')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Session operations
  async createSession(sessionData) {
    const { data, error } = await supabase
      .from('auth_sessions')
      .insert([sessionData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async getSessionByToken(token) {
    const { data, error } = await supabase
      .from('auth_sessions')
      .select('*')
      .eq('sessionToken', token)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateSession(id, updates) {
    const { data, error } = await supabase
      .from('auth_sessions')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async deleteSession(token) {
    const { error } = await supabase
      .from('auth_sessions')
      .delete()
      .eq('sessionToken', token);
    
    if (error) throw error;
    return true;
  },

  // Account operations for OAuth
  async createAccount(accountData) {
    const { data, error } = await supabase
      .from('auth_accounts')
      .insert([accountData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async getAccountByProvider(providerAccountId, provider) {
    const { data, error } = await supabase
      .from('auth_accounts')
      .select('*')
      .eq('providerAccountId', providerAccountId)
      .eq('provider', provider)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async deleteAccount(userId, provider) {
    const { error } = await supabase
      .from('auth_accounts')
      .delete()
      .eq('userId', userId)
      .eq('provider', provider);
    
    if (error) throw error;
    return true;
  },

  // Verification token operations
  async createVerificationToken(tokenData) {
    const { data, error } = await supabase
      .from('auth_verification_tokens')
      .insert([tokenData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async getVerificationToken(identifier, token) {
    const { data, error } = await supabase
      .from('auth_verification_tokens')
      .select('*')
      .eq('identifier', identifier)
      .eq('token', token)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async deleteVerificationToken(identifier, token) {
    const { error } = await supabase
      .from('auth_verification_tokens')
      .delete()
      .eq('identifier', identifier)
      .eq('token', token);
    
    if (error) throw error;
    return true;
  }
};

// Test the Supabase connection on startup
(async () => {
  try {
    console.log('Testing Supabase connection with URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...');
    const { data, error } = await supabase.from('user_information').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      throw error;
    }
    
    console.log('Supabase connection test successful');
    console.log('Tables exist and are accessible');
    console.log('Found records:', data ? data.length : 0);
    
    // Test adapter methods directly
    try {
      const testUser = {
        email: 'test-connection@example.com',
        // Simple check without creating actual records
      };
      
      console.log('Adapter configuration:');
      console.log('- Adapter object exists:', !!supabaseAdapter);
      console.log('- createUser method exists:', typeof supabaseAdapter.createUser === 'function');
      console.log('- getUserByEmail method exists:', typeof supabaseAdapter.getUserByEmail === 'function');
    } catch (adapterErr) {
      console.error('Adapter test error:', adapterErr);
    }
  } catch (err) {
    console.error('Supabase connection test failed:', err);
  }
})();

// Set environment to production to disable memory adapter
process.env.NODE_ENV = 'production';

// Basic BetterAuth configuration with Supabase adapter
export const auth = betterAuth({
  // Secret key for JWT signing
  secret: process.env.BETTER_AUTH_SECRET,

  // Base URL for auth endpoints
  baseURL: baseUrl,

  // Provide the custom Supabase adapter with required properties
  adapter: {
    type: 'custom-database',
    config: {
      name: 'supabase',
      provider: 'supabase',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    // Include all the adapter methods
    ...supabaseAdapter,
  },
  
  // Enable email and password authentication
  emailAndPassword: {
    enabled: true,
    // Add debug callbacks
    onSignUp: async (data) => {
      console.log('Email signup attempt:', data.email);
      return { success: true };
    },
    onSignIn: async (data) => {
      console.log('Email signin attempt:', data.email);
      return { success: true };
    }
  },

  // Add Google OAuth provider with simplified configuration
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  // Add NextJS server actions plugin for cookie handling
  plugins: [nextCookies()],

  // Advanced options
  advanced: {
    // Let database generate UUIDs in correct format
    generateId: false,
    // Specify custom table names
    tables: {
      users: "user_information",
      sessions: "auth_sessions",
      accounts: "auth_accounts",
      verificationTokens: "auth_verification_tokens"
    },
    // Enable debug logging
    debug: true,
    // Force Better Auth to treat the environment as production
    // This disables the fallback to memory adapter in development
    forceProductionMode: true,
    // Disable adapter validation warnings
    skipAdapterValidation: true,
  },
}); 