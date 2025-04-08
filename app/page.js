'use client';

import { useState, useEffect } from 'react';
import { useAuth, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import TopBar from '../components/TopBar/TopBar';
import BannerText from '../components/BannerText/BannerText';
import FilterBar from '../components/FilterBar/FilterBar';
import RecipeButton from '../components/RecipeButton/RecipeButton';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';
import { fetchRecipes } from './_utils/config';

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const getRecipes = async () => {
    try {
      setLoading(true);
      // Add timestamp to avoid caching
      const timestamp = Date.now();
      const data = await fetchRecipes(timestamp);
      setRecipes(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Failed to load recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      getRecipes();
    }
    
    // Listen for recipe updates
    const handleRecipeUpdate = () => {
      getRecipes();
    };
    
    window.addEventListener('recipe-updated', handleRecipeUpdate);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('recipe-updated', handleRecipeUpdate);
    };
  }, [userId]);
  
  const handleAddRecipe = async () => {
    // Refresh recipes after adding a new one
    getRecipes();
  };
  
  const handleRecipeDeleted = (deletedRecipeId) => {
    // Optimistically update UI by filtering out the deleted recipe
    setRecipes(prevRecipes => 
      prevRecipes.filter(recipe => recipe.id !== deletedRecipeId)
    );
    
    // Dispatch an event to notify other components that a recipe was deleted
    window.dispatchEvent(new CustomEvent('recipe-updated'));
  };
  
  // Show loading state while Clerk loads
  if (!isLoaded) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <ErrorBoundary>
      <SignedIn>
        <main>
          <TopBar onAddRecipe={handleAddRecipe} />
          <BannerText />
          <FilterBar />
          {loading && recipes.length === 0 ? (
            <div className="loading">Loading recipes...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : recipes.length === 0 ? (
            <div className="no-recipes">No recipes found. Add your first recipe!</div>
          ) : (
            <RecipeButton 
              images={recipes} 
              onRecipeDeleted={handleRecipeDeleted}
            />
          )}
        </main>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ErrorBoundary>
  );
}