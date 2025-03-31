'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './RecipeButton.css';
import StarRating from '../StarRating/StarRating';
import { getR2Url } from '../../app/_utils/r2';

const RecipeButton = ({ images, onRecipeDeleted }) => {
  const [hoveredImage, setHoveredImage] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  
  const handleMouseEnter = (id) => {
    setHoveredImage(id);
  };

  const handleMouseLeave = () => {
    setHoveredImage(null);
    // Don't hide confirmation dialog on mouse leave
  };

  const handleRecipeClick = (recipe) => {
    router.push(`/${recipe.id}`);
  };

  // Function to get the correct image URL (R2 or static)
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    console.log('imagePath', imagePath);
    // If the image path is already a full URL, use it as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If the image path starts with 'static/', it's an R2 path
    if (imagePath.startsWith('static/')) {
      return getR2Url(imagePath);
    }
    
    // Otherwise, assume it's a local static file
    return `/static/${imagePath}`;
  };

  // Function to prompt confirmation before deleting
  const handleDeleteClick = (e, recipeId) => {
    e.stopPropagation(); // Prevent opening the recipe detail
    setShowConfirmDelete(recipeId);
  };

  // Function to cancel deletion
  const handleCancelDelete = (e) => {
    e.stopPropagation(); // Prevent opening the recipe detail
    setShowConfirmDelete(null);
  };

  // Function to confirm and execute deletion
  const handleConfirmDelete = async (e, recipeId) => {
    e.stopPropagation(); // Prevent opening the recipe detail
    
    if (isDeleting) return; // Prevent multiple clicks
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/recipes?id=${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting recipe: ${response.statusText}`);
      }
      
      // Call the callback to notify parent that a recipe was deleted
      if (onRecipeDeleted) {
        onRecipeDeleted(recipeId);
      }
      
      // Reset states
      setShowConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      alert('Failed to delete recipe. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="recipe-grid">
      {images.map((image, index) => (
        <button
          key={index}
          className="Big-button"
          style={{
            backgroundImage: `url(${getImageUrl(image.image_path)})`,
          }}
          onMouseEnter={() => handleMouseEnter(image.id)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleRecipeClick(image)}>
          {/* Delete button appears on hover */}
          {hoveredImage === image.id && !showConfirmDelete && (
            <button 
              className="delete-recipe-btn"
              onClick={(e) => handleDeleteClick(e, image.id)}
              aria-label="Delete recipe"
            >
              -
            </button>
          )}
          
          {/* Confirmation dialog */}
          {showConfirmDelete === image.id && (
            <div className="delete-confirmation-overlay" onClick={(e) => e.stopPropagation()}>
              <div className="delete-confirmation">
                <p>Delete this recipe?</p>
                <div className="delete-actions">
                  <button 
                    className="cancel-delete-btn"
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button 
                    className="confirm-delete-btn"
                    onClick={(e) => handleConfirmDelete(e, image.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Regular hover information */}
          {hoveredImage === image.id && (
            <div className="hover-all">
              <div className="hover-text">{String(image.name).charAt(0).toUpperCase() + String(image.name).slice(1)}</div>
              <div className="hover-image"></div>
              <div className="hover-date">{new Date(image.date).toLocaleString('default', { month: 'short', year: 'numeric' })}</div>
              <div className="hover-rating"><StarRating rating={image.rating}/></div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default RecipeButton;