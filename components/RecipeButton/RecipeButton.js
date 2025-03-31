'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './RecipeButton.css';
import StarRating from '../StarRating/StarRating';
import { getR2Url } from '../../app/_utils/r2';

const RecipeButton = ({ images }) => {
  const [hoveredImage, setHoveredImage] = useState(null);
  const router = useRouter();
  const handleMouseEnter = (id) => {
    setHoveredImage(id);
  };

  const handleMouseLeave = () => {
    setHoveredImage(null);
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