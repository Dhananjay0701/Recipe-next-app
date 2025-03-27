import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY, // Store API key in environment variables
});

/**
 * Extract ingredients from recipe text using Replicate API
 * @param {string} recipeText - The recipe text to analyze
 * @returns {Promise<Array>} - A promise that resolves to an array of ingredient objects
 */
export async function extractIngredientsFromRecipe(recipeText) {
  if (!recipeText || recipeText.trim() === '') {
    return [];
  }

  try {
    const response = await replicate.run(
      "meta/meta-llama-3-8b-instruct", // Using LLaMA 3 model
      {
        input: {
          prompt: `Extract all ingredients from this recipe: ${recipeText}. Return only a JSON array of ingredients and the quantity with no additional text. Each ingredient should be an object with a 'name' property and 'checked' set to false.`,
          temperature: 0.3,
          max_length: 1000
        }
      }
    );
    console.log(response);
    const content = response.join('').trim();
    
    // Handle different response formats
    try {
      // Try parsing directly
      const ingredients = JSON.parse(content);
      return Array.isArray(ingredients) ? ingredients : [];
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const ingredients = JSON.parse(jsonMatch[0]);
          return Array.isArray(ingredients) ? ingredients : [];
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
        }
      }
      
      // As a fallback, split by lines and create ingredients
      const lines = content.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => {
          // Strip numbers, bullets, etc.
          const cleaned = line.replace(/^[\d\.\-\*\•]+\s*/, '').trim();
          return { name: cleaned, checked: false };
        });
      
      return lines;
    }
  } catch (error) {
    console.error('Error calling Replicate API:', error);
    throw error;
  }
}