'use client';

import React, { useState } from 'react';
import './TopBar.css';
import AddRecipeModal from '../AddRecipeModal/AddRecipeModal';

const TopBar = () => {
  const [showModal, setShowModal] = useState(false);
  
  const handleAddRecipeClick = () => {
    // Directly set the state to show the modal
    setShowModal(true);
    
    // Still dispatch the event for other components that might need it
    const addRecipeEvent = new CustomEvent('add-recipe-clicked');
    window.dispatchEvent(addRecipeEvent);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
  };
  
  return (
    <div className="Top-bar">
      <div className="Logo-section">
        <button className="Logo-tag"></button>
        <button className="Logo-name">BroIsCooked</button>
      </div>
      
      <div className="search">
        <input 
          className="Search-input" 
          type="text" 
          placeholder="Search recipe" 
        />
      </div>
      
      <div className="nav-links">
        <button className="All-recipes">ALL-RECIPES</button>
        <button className="Dairy">DAIRY</button>
        <button className="Add-recipe" onClick={handleAddRecipeClick}>
          <span className="Add-p">+</span>Add Recipe
        </button>
      </div>
      
      <div className="User-section">
        <button className="User-acc"></button>
        <button className="User-text">DT</button>
      </div>
      
      {showModal && <AddRecipeModal onClose={handleCloseModal} onAddRecipe={() => window.dispatchEvent(new Event('recipe-updated'))} />}
    </div>
  );
};

export default TopBar;