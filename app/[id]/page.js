import { fetchRecipeById } from '../_utils/config';
import RecipeDetail from '../../components/RecipeDetail/RecipeDetail';
import TopBar from '../../components/TopBar/TopBar';
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable cache completely

export default async function RecipeDetailPage({ params }) {
  try {
    const { id } = params;
    // Add cache-busting timestamp to ensure we always get fresh data
    const timestamp = Date.now();
    const recipe = await fetchRecipeById(id, timestamp);
    
    return (
      <ErrorBoundary>
        <TopBar />
        {recipe ? (
          <RecipeDetail 
            recipe={recipe} 
            recipeId={id}
            key={`recipe-${id}-${timestamp}`} // Force component to re-render with fresh data
          />
        ) : (
          <div className="error">Recipe not found</div>
        )}
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return (
      <ErrorBoundary>
        <TopBar />
        <div className="error">Failed to load recipe</div>
      </ErrorBoundary>
    );
  }
}