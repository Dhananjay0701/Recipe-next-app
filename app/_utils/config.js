// Get deployment URL from Vercel environment or use default
const getBaseUrl = () => {
  // Check if we're running in the browser
  // For server-side rendering or when window is not available
  return process.env.NEXT_PUBLIC_API_URL
};

// Define API URL without the trailing slash
const API_URL = `${getBaseUrl()}/api`

export default API_URL;

export const fetchRecipes = async (timestamp = Date.now()) => {
  const url = `${API_URL}/recipes?t=${timestamp}`;
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export const fetchRecipeById = async (id, timestamp = Date.now()) => {
  console.log(`${API_URL}/recipes/${id}`);
  
  // Add timestamp to URL as a query parameter for cache busting
  const url = `${API_URL}/recipes/${id}?t=${timestamp}`;
  
  // Enhanced fetch with strong cache control headers
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export const saveRecipe = async (recipe) => {
  const url = recipe.id 
    ? `${API_URL}/recipes/${recipe.id}` 
    : `${API_URL}/recipes`;
  
  const method = recipe.id ? 'PUT' : 'POST';
  
  // Add cache control headers to ensure updates are processed immediately
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    cache: 'no-store',
    body: JSON.stringify(recipe),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Check if Supabase environment variables are set
export function isSupabaseConfigured() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}