'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUser, useClerk, SignedIn } from '@clerk/nextjs';
import './TopBar.css';
import AddRecipeModal from '../AddRecipeModal/AddRecipeModal';

const TopBar = ({ onAddRecipe }) => {
  const [showModal, setShowModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const menuRef = useRef(null);
  
  // Get user initials from first and last name
  const getUserInitials = () => {
    if (!user) return '';
    
    // Try to get initials from full name
    if (user.fullName) {
      const nameParts = user.fullName.split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else if (nameParts.length === 1) {
        return nameParts[0][0].toUpperCase();
      }
    }
    
    // Fallback to first letter of email
    if (user.primaryEmailAddress) {
      return user.primaryEmailAddress.emailAddress[0].toUpperCase();
    }
    
    return '';
  };
  
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
  
  const handleRecipeAdded = () => {
    // Call the parent onAddRecipe callback if provided
    if (onAddRecipe) {
      onAddRecipe();
    }
    
    // Also dispatch the event for backward compatibility
    window.dispatchEvent(new Event('recipe-updated'));
  };
  
  // Open user menu on mouse enter
  const handleMouseEnter = () => {
    setShowUserMenu(true);
  };
  
  // Close user menu on mouse leave
  const handleMouseLeave = () => {
    setShowUserMenu(false);
  };
  
  const handleSignOut = async () => {
    await signOut();
    // Redirect will happen automatically due to Clerk middleware
  };
  
  const handleManageAccount = () => {
    openUserProfile();
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
      
      <SignedIn>
        <div 
          className="User-section" 
          ref={menuRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button className="User-acc"></button>
          <button className="User-text">
            {getUserInitials()}
          </button>
          
          {showUserMenu && (
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="user-menu-name">{user?.fullName || 'User'}</div>
                <div className="user-menu-email">{user?.primaryEmailAddress?.emailAddress || ''}</div>
              </div>
              <div className="user-menu-divider"></div>
              <div className="user-menu-item" onClick={handleManageAccount}>
                Manage Account
              </div>
              <div className="user-menu-item" onClick={handleSignOut}>
                Sign Out
              </div>
            </div>
          )}
        </div>
      </SignedIn>
      
      {showModal && (
        <AddRecipeModal 
          onClose={handleCloseModal} 
          onAddRecipe={handleRecipeAdded} 
        />
      )}
    </div>
  );
};

export default TopBar;