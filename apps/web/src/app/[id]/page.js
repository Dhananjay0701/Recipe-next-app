import { fetchRecipeById } from '../../../lib/api/config';
import RecipeDetail from '../../../components/RecipeDetail/RecipeDetail';
import TopBar from '../../../components/TopBar/TopBar';
import ErrorBoundary from '../../../components/ErrorBoundary/ErrorBoundary';

export default async function RecipeDetailPage({ params }) {
  try {
    const { id } = params;
    const recipe = await fetchRecipeById(id);
    
    return (
      <ErrorBoundary>
        <TopBar />
        {recipe ? (
          <RecipeDetail recipe={recipe} />
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