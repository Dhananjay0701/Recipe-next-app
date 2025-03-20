'use client';

import { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar/TopBar';
import BannerText from '../../components/BannerText/BannerText';
import FilterBar from '../../components/FilterBar/FilterBar';
import RecipeButton from '../../components/RecipeButton/RecipeButton';
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';
import { fetchRecipes } from '../../lib/api/config';

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const getRecipes = async () => {
      try {
        const data = await fetchRecipes();
        setRecipes(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching recipes:', error);
        setLoading(false);
      }
    };
    
    getRecipes();
    
    // Listen for recipe updates
    const handleRecipeUpdate = () => {
      getRecipes();
    };
    
    window.addEventListener('recipe-updated', handleRecipeUpdate);
    
    // Add event listener for the Add Recipe button
  
    
    return () => {
      window.removeEventListener('recipe-updated', handleRecipeUpdate);
    };
  }, []);
  
  const handleAddRecipe = async () => {
    // Refresh recipes after adding a new one
    try {
      const data = await fetchRecipes();
      setRecipes(data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };
  
  return (
    <ErrorBoundary>
      <main>
        <TopBar />
        <BannerText />
        <FilterBar />
        {loading ? (
          <div className="loading">Loading recipes...</div>
        ) : (
          <RecipeButton images={recipes} />
        )}
      </main>
    </ErrorBoundary>
  );
}