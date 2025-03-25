'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './RecipeButton.css';
import StarRating from '../StarRating/StarRating';

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

  return (
    <div className="recipe-grid">
      {images.map((image, index) => (
        <button
          key={index}
          className="Big-button"
          style={{
            backgroundImage: `url(/static/${image.Image_path})`,
          }}
          onMouseEnter={() => handleMouseEnter(image.id)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleRecipeClick(image)}>
          {hoveredImage === image.id && (
            <div className="hover-all">
              <div className="hover-text">{String(image.Name).charAt(0).toUpperCase() + String(image.Name).slice(1)}</div>
              <div className="hover-image"></div>
              <div className="hover-date">{String(image.date.substr(0, 3) + "  " + image.date.substr(3)).split(" ").slice(1).join(" ")}</div>
              <div className="hover-rating"><StarRating rating={image.Rating}/></div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default RecipeButton;