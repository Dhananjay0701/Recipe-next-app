const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
  