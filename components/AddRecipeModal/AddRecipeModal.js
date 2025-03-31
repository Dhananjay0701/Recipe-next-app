"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./AddRecipeModal.css";
import StarRating from "../StarRating/StarRating";

const AddRecipeModal = ({ onClose, onAddRecipe }) => {
  // Use mounted flag to ensure we render the portal only on the client
  const [mounted, setMounted] = useState(false);
  
  const [recipeName, setRecipeName] = useState("");
  const [recipeRating, setRecipeRating] = useState(0);
  const [recipeImage, setRecipeImage] = useState(null);
  const [recipeDate, setRecipeDate] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

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

    // Input validation
    if (!recipeName.trim()) {
      setError("Recipe name is required");
      return;
    }

    if (recipeRating === 0) {
      setError("Please rate your recipe");
      return;
    }

    if (!recipeImage) {
      setError("Please upload an image");
      return;
    }

    if (!recipeDate) {
      setError("Please select a date");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setUploadProgress(10); // Show initial progress

    try {
      console.log("Uploading file:", recipeImage.name, recipeImage.type, recipeImage.size);

      const formData = new FormData();
      formData.append("name", recipeName);
      formData.append("rating", recipeRating);
      formData.append("date", recipeDate);
      formData.append("image", recipeImage);

      // Debug FormData contents
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      setUploadProgress(30); // Show progress during request preparation

      // Use fetch with custom logic to track upload progress if available
      const response = await fetch("/api/recipes", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90); // Almost done

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server error:", errorData);
        throw new Error(`Server error: ${response.status} ${errorData.message || ""}`);
      }

      setUploadProgress(100); // Complete

      // On success, refresh recipes and close the modal
      onAddRecipe();
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message);
      setUploadProgress(0); // Reset progress on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <h2>Add New Recipe</h2>

        {error && <div className="error-message">{error}</div>}

        {uploadProgress > 0 && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="progress-text">{uploadProgress}%</div>
          </div>
        )}

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
            <input type="file" accept="image/*" onChange={handleImageChange} />
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
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Only render the portal if the component is mounted
  if (!mounted) return null;

  return ReactDOM.createPortal(modalContent, document.body);
};

export default AddRecipeModal; 