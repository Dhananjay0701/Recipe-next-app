import { createAuthClient } from 'better-auth/react';

// Ensure we have the correct API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
                (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

console.log('Initializing auth client with API URL:', API_URL);

// Create the client instance.
// It automatically connects to the API route handler (/api/auth)
export const authClient = createAuthClient({
  // Make sure the baseURL is set correctly
  baseURL: API_URL,
  debug: true, // Enable debugging
});

console.log('Auth client initialized with baseURL:', API_URL);

// Wrap sign-up function with better error handling
const originalSignUp = authClient.signUp;
authClient.signUp = {
  ...originalSignUp,
  email: async (params) => {
    console.log('Client-side email sign-up attempt:', params.email);
    try {
      const result = await originalSignUp.email(params);
      console.log('Sign-up result:', result);
      return result;
    } catch (err) {
      console.error('Client-side sign-up error:', err);
      throw err;
    }
  }
};

// Wrap sign-in function with better error handling
const originalSignIn = authClient.signIn;
authClient.signIn = {
  ...originalSignIn,
  emailAndPassword: async (params) => {
    console.log('Client-side email sign-in attempt:', params.email);
    try {
      const result = await originalSignIn.emailAndPassword(params);
      console.log('Sign-in result:', result);
      return result;
    } catch (err) {
      console.error('Client-side sign-in error:', err);
      throw err;
    }
  }
};

// Export common methods and hooks for convenience
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  // Add other exports if needed, e.g.:
  // manageAccount,
  // resetPassword,
  // Other useful exports
  getSession,
  refreshSession,
  updateSession
} = authClient;

// Google OAuth signin helper function with more configuration options
export const signInWithGoogle = async (options = {}) => {
  console.log('Starting Google sign-in process...');
  
  try {
    console.log('Redirect URL:', options.callbackUrl || '/');
    
    // The actual sign-in call
    const result = await signIn.google({
      callbackUrl: options.callbackUrl || '/', // Redirect to home page after successful sign in
      // Optional additional parameters
      scope: options.scope || 'email profile',
      // For redirect flow
      redirect: true
    });
    
    console.log('Google sign-in result:', result);
    return result;
  } catch (error) {
    console.error('Google sign-in failed with error:', error);
    throw error;
  }
}; 