// Get deployment URL from Vercel environment or use default
const getBaseUrl = () => {
  // Check if we're running in the browser
  if (typeof window !== 'undefined') {
    // In browser, use the current window location
    return window.location.origin;
  }
  
  // Server-side rendering
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
};

// Define API URL without the trailing slash
const API_URL = getBaseUrl() ? `${getBaseUrl()}/api` : '/api';

export default API_URL;

export const fetchRecipes = async () => {
  const response = await fetch(`${API_URL}/recipes`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const fetchRecipeById = async (id) => {
  const response = await fetch(`${API_URL}/recipes/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};
  