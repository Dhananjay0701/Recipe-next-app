import React, { useState } from 'react';
import './AddRecipeModal.css';
import StarRating from '../StarRating/StarRating';
import API_URL from '../../api/config';

const AddRecipeModal = ({ onClose, onAddRecipe }) => {
  const [recipeName, setRecipeName] = useState('');
  const [recipeRating, setRecipeRating] = useState(0);
  const [recipeImage, setRecipeImage] = useState(null);
  const [recipeDate, setRecipeDate] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRecipeImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRatingChange = (rating) => {
    setRecipeRating(rating);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!recipeName.trim()) {
      setError('Recipe name is required');
      return;
    }
    
    if (recipeRating === 0) {
      setError('Please rate your recipe');
      return;
    }
    
    if (!recipeImage) {
      setError('Please upload an image');
      return;
    }
    
    if (!recipeDate) {
      setError('Please select a date');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      console.log('Uploading file:', recipeImage.name, recipeImage.type, recipeImage.size);
      
      const formData = new FormData();
      formData.append('name', recipeName);
      formData.append('rating', recipeRating);
      formData.append('date', recipeDate);
      formData.append('image', recipeImage);
      
      // Debug FormData contents
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      
      const response = await fetch(`${API_URL}/recipes`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', errorData);
        throw new Error(`Server error: ${response.status} ${errorData.message || ''}`);
      }
      
      // Success - call onAddRecipe to refresh the recipes
      onAddRecipe();
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Add New Recipe</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Recipe Name</label>
            <input 
              type="text" 
              value={recipeName} 
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="Enter recipe name"
            />
          </div>
          
          <div className="form-group">
            <label>Rating</label>
            <div className="rating-selector">
              <StarRating 
                rating={recipeRating} 
                onRatingChange={handleRatingChange} 
                interactive={true}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Recipe Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
            />
            {previewUrl && (
              <div className="image-preview">
                <img src={previewUrl} alt="Recipe preview" />
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>Recipe Date</label>
            <input
              type="date"
              value={recipeDate}
              onChange={(e) => setRecipeDate(e.target.value)}
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecipeModal; 