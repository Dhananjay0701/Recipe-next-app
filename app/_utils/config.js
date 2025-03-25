// Get deployment URL from Vercel environment or use default
const getBaseUrl = () => {
  // Check if we're running in the browser
  
  // Server-side rendering
  //return 'http://localhost:3000';
  return 'http://broiscooked.vercel.app';
};

// Define API URL without the trailing slash
const API_URL = `${getBaseUrl()}/api`

export default API_URL;

export const fetchRecipes = async () => {
  const response = await fetch(`${API_URL}/recipes`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const fetchRecipeById = async (id) => {
  console.log(`${API_URL}/recipes/${id}`);
  const response = await fetch(`${API_URL}/recipes/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};
  