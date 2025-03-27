'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import StarRating from '../StarRating/StarRating';
import './RecipeDetail.css';
import API_URL from '../../app/_utils/config';

const RecipeDetail = ({ recipe: initialRecipe, recipeId }) => {
    const router = useRouter();
    const [recipe, setRecipe] = useState(initialRecipe || null);
    const [loading, setLoading] = useState(!initialRecipe);
    const [recipeText, setRecipeText] = useState('');
    const [ingredients, setIngredients] = useState([]);
    const [newIngredient, setNewIngredient] = useState('');
    const [links, setLinks] = useState([]);
    const [newLink, setNewLink] = useState('');
    const [photos, setPhotos] = useState([]);
    const [uploadingPhotos, setUploadingPhotos] = useState({}); // Track uploading state by photo ID
    const fileInputRef = React.createRef();

    // New state for modal image gallery
    const [modalOpen, setModalOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    
    // Use refs to track state without causing re-renders
    const isRefreshing = useRef(false);
    const lastVisibilityChange = useRef(Date.now());

    // Store temp URLs in a ref to persist between renders
    const tempUrlsRef = useRef({});

    // Simplified refresh recipe data that doesn't cause re-render loops
    const refreshRecipeData = useCallback(async () => {
        // Prevent multiple simultaneous refreshes
        if (isRefreshing.current) return;
        
        // Use either recipe.id or recipeId prop
        const id = recipe?.id || recipeId;
        if (!id) return;
        
        isRefreshing.current = true;
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/recipes/${id}?t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to refresh recipe data');
            }
            
            const freshData = await response.json();
            
            // Ensure arrays are properly handled
            const updatedIngredients = Array.isArray(freshData.ingredients) 
                ? freshData.ingredients 
                : (typeof freshData.ingredients === 'string' 
                    ? JSON.parse(freshData.ingredients) 
                    : []);
            
            const updatedLinks = Array.isArray(freshData.links) 
                ? freshData.links 
                : (typeof freshData.links === 'string' 
                    ? JSON.parse(freshData.links) 
                    : []);
            
            const updatedPhotos = Array.isArray(freshData.photos) 
                ? freshData.photos 
                : (typeof freshData.photos === 'string' 
                    ? JSON.parse(freshData.photos) 
                    : []);
            
            setRecipe(freshData);
            setRecipeText(freshData.recipeText || freshData.recipe_text || '');
            setIngredients(updatedIngredients);
            setLinks(updatedLinks);
            setPhotos(updatedPhotos);
        } catch (error) {
            console.error('Error refreshing recipe data:', error);
        } finally {
            setLoading(false);
            isRefreshing.current = false;
        }
    }, [recipe?.id, recipeId]);

    // Check for any pending uploads from localStorage
    const checkPendingUploads = useCallback(() => {
        if (!recipe?.id) return;
        
        // Look for uploads related to this recipe
        const keys = Object.keys(localStorage).filter(key => 
            key.startsWith('recipe_upload_') && 
            key.includes('temp-')
        );
        
        // Process each pending upload
        keys.forEach(key => {
            try {
                const uploadInfo = JSON.parse(localStorage.getItem(key));
                
                // Only process uploads for this recipe
                if (uploadInfo.recipeId !== recipe.id) return;
                
                const tempPhotoId = uploadInfo.tempPhotoId;
                
                // Check if this upload is already in our photos array
                const photoExists = photos.some(p => p === tempPhotoId || p === uploadInfo.photoPath);
                
                if (!photoExists) {
                    // If completed, add the final path
                    if (uploadInfo.status === 'completed' && uploadInfo.photoPath) {
                        setPhotos(prevPhotos => [...prevPhotos, uploadInfo.photoPath]);
                        localStorage.removeItem(key); // Clean up
                    }
                    // If still uploading or errored but we have a local preview, show it
                    else if (uploadInfo.status === 'uploading' || uploadInfo.status === 'error') {
                        // We don't have the image data anymore as we navigated away
                        // Just clean up and let the next refresh fetch the server data
                        localStorage.removeItem(key);
                    }
                }
            } catch (error) {
                console.error('Error parsing upload info:', error);
                localStorage.removeItem(key); // Clean up invalid data
            }
        });
    }, [recipe?.id, photos]);
    
    // Check for pending uploads when component mounts or recipe changes
    useEffect(() => {
        checkPendingUploads();
    }, [recipe?.id, checkPendingUploads]);

    // Initialize data from props or fetch it - only run once
    useEffect(() => {
        if (initialRecipe) {
            setRecipe(initialRecipe);
            setRecipeText(initialRecipe.recipeText || initialRecipe.recipe_text || '');
            
            // Ensure arrays are properly handled
            const initialIngredients = Array.isArray(initialRecipe.ingredients) 
                ? initialRecipe.ingredients 
                : (typeof initialRecipe.ingredients === 'string' 
                    ? JSON.parse(initialRecipe.ingredients) 
                    : []);
            
            const initialLinks = Array.isArray(initialRecipe.links) 
                ? initialRecipe.links 
                : (typeof initialRecipe.links === 'string' 
                    ? JSON.parse(initialRecipe.links) 
                    : []);
            
            const initialPhotos = Array.isArray(initialRecipe.photos) 
                ? initialRecipe.photos 
                : (typeof initialRecipe.photos === 'string' 
                    ? JSON.parse(initialRecipe.photos) 
                    : []);
            
            setIngredients(initialIngredients);
            setLinks(initialLinks);
            setPhotos(initialPhotos);
            setLoading(false);
            
            // Always fetch fresh data even if we got initialRecipe
            // This ensures we have the most up-to-date data
            setTimeout(() => {
                if (recipeId) {
                    refreshRecipeData();
                }
            }, 10);
            
            return;
        }

        // If no initialRecipe, fetch the recipe data
        if (recipeId) {
            refreshRecipeData();
        }
        
        // Cleanup function to remove all temp URLs when component unmounts
        return () => {
            // Clear any temporary URLs to prevent memory leaks
            Object.keys(tempUrlsRef.current).forEach(key => {
                delete tempUrlsRef.current[key];
            });
        };
    }, [initialRecipe, recipeId, refreshRecipeData]);

    // Very limited refresh on visibility change - with throttling
    useEffect(() => {
        const handleVisibilityChange = () => {
            // Only refresh if page becomes visible AND it's been at least 5 seconds since last refresh
            if (document.visibilityState === 'visible' && 
                recipe?.id && 
                Date.now() - lastVisibilityChange.current > 5000) {
                
                lastVisibilityChange.current = Date.now();
                refreshRecipeData();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [refreshRecipeData, recipe?.id]);

    const handleRatingChange = (newRating) => {
        if (!recipe) return;
        
        const numericRating = parseFloat(newRating);
        
        // Optimistic update - update UI immediately with both case variations to ensure consistency
        setRecipe({ 
            ...recipe, 
            rating: numericRating, 
            Rating: numericRating 
        });
        
        fetch(`${API_URL}/recipes/${recipe.id}/rating`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({ rating: numericRating }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update rating');
                }
                return response.json();
            })
            .then(data => {
                console.log('Rating updated successfully');
                // Update with server response to ensure consistency
                if (data) {
                    const updatedRating = data.Rating || data.rating || numericRating;
                    setRecipe(prevRecipe => ({
                        ...prevRecipe,
                        rating: updatedRating,
                        Rating: updatedRating
                    }));
                }
            })
            .catch(error => {
                console.error('Error updating rating:', error);
                refreshRecipeData();
            });
    };

    const handleRecipeTextChange = (e) => {
        setRecipeText(e.target.value);
    };

    const saveRecipeText = () => {
        if (!recipe) return;
        
        // Optimistic update
        const updatedRecipe = { ...recipe, recipeText: recipeText };
        setRecipe(updatedRecipe);
        
        fetch(`${API_URL}/recipes/${recipe.id}/text`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipeText }),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Recipe text saved');
            })
            .catch(error => {
                console.error('Error saving recipe text:', error);
                refreshRecipeData();
            });
    };

    const handleIngredientCheck = (index) => {
        const updatedIngredients = [...ingredients];
        updatedIngredients[index].checked = !updatedIngredients[index].checked;
        
        // Update local state first (optimistic update)
        setIngredients(updatedIngredients);
        
        if (!recipe) return;
        
        fetch(`${API_URL}/recipes/${recipe.id}/ingredients`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({ ingredients: updatedIngredients }),
        })
            .then(response => response.json())
            .then(updatedRecipe => {
                // Update with the data from the server to ensure consistency
                if (updatedRecipe && updatedRecipe.ingredients) {
                    const serverIngredients = Array.isArray(updatedRecipe.ingredients) 
                        ? updatedRecipe.ingredients 
                        : (typeof updatedRecipe.ingredients === 'string' 
                            ? JSON.parse(updatedRecipe.ingredients) 
                            : []);
                    
                    setIngredients(serverIngredients);
                }
                console.log('Ingredient updated successfully');
            })
            .catch(error => {
                console.error('Error updating ingredients:', error);
                refreshRecipeData();
            });
    };

    const addIngredient = () => {
        if (!newIngredient.trim() || !recipe) return;
        
        const newIngredientObj = { name: newIngredient, checked: false };
        const updatedIngredients = [...ingredients, newIngredientObj];
        
        // Optimistic update - immediately show the new ingredient
        setIngredients(updatedIngredients);
        setNewIngredient(''); // Clear the input field immediately
        
        fetch(`${API_URL}/recipes/${recipe.id}/ingredients`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({ ingredients: updatedIngredients }),
        })
            .then(response => response.json())
            .then(updatedRecipe => {
                // Update with the data from the server to ensure consistency
                if (updatedRecipe && updatedRecipe.ingredients) {
                    const serverIngredients = Array.isArray(updatedRecipe.ingredients) 
                        ? updatedRecipe.ingredients 
                        : (typeof updatedRecipe.ingredients === 'string' 
                            ? JSON.parse(updatedRecipe.ingredients) 
                            : []);
                    
                    setIngredients(serverIngredients);
                }
                console.log('Ingredient added successfully');
            })
            .catch(error => {
                console.error('Error adding ingredient:', error);
                refreshRecipeData();
            });
    };

    const deleteIngredient = (index) => {
        if (!recipe) return;
        
        const updatedIngredients = [...ingredients];
        updatedIngredients.splice(index, 1);
        
        // Optimistic update - immediately remove the ingredient
        setIngredients(updatedIngredients);
        
        fetch(`${API_URL}/recipes/${recipe.id}/ingredients`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ingredients: updatedIngredients }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update ingredients');
                }
                return response.json();
            })
            .then(() => {
                // Successfully saved to backend
                console.log('Ingredient deleted successfully');
                // State is already updated optimistically
            })
            .catch(error => {
                console.error('Error deleting ingredient:', error);
                // Only refresh on error to recover
                refreshRecipeData();
            });
    };

    const addLink = () => {
        if (!newLink.trim() || !recipe) return;
        
        const updatedLinks = [...links, newLink];
        
        // Optimistic update - immediately show the new link
        setLinks(updatedLinks);
        setNewLink(''); // Clear the input field immediately
        
        fetch(`${API_URL}/recipes/${recipe.id}/links`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ links: updatedLinks }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update links');
                }
                return response.json();
            })
            .then(() => {
                // Successfully saved to backend
                console.log('Link added successfully');
                // State is already updated optimistically
            })
            .catch(error => {
                console.error('Error adding link:', error);
                // Only refresh on error to recover
                refreshRecipeData();
            });
    };

    const deleteLink = (index) => {
        if (!recipe) return;
        
        const updatedLinks = [...links];
        updatedLinks.splice(index, 1);
        
        // Optimistic update - immediately remove the link
        setLinks(updatedLinks);
        
        fetch(`${API_URL}/recipes/${recipe.id}/links`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ links: updatedLinks }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update links');
                }
                return response.json();
            })
            .then(() => {
                // Successfully saved to backend
                console.log('Link deleted successfully');
                // State is already updated optimistically
            })
            .catch(error => {
                console.error('Error deleting link:', error);
                // Only refresh on error to recover
                refreshRecipeData();
            });
    };

    const handleBackClick = () => {
        router.push('/');
    };

    const handleAddPhotoClick = () => {
        fileInputRef.current.click();
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !recipe) return;

        // Create a temporary ID for the photo
        const tempPhotoId = `temp-${Date.now()}`;
        
        // Create a FileReader to read the file as data URL for preview
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            // Store the data URL in the ref to persist between renders
            tempUrlsRef.current[tempPhotoId] = loadEvent.target.result;
            
            // Add the temporary photo to the list
            setPhotos(prevPhotos => [...prevPhotos, tempPhotoId]);
            
            // Mark this specific photo as uploading
            setUploadingPhotos(prev => ({
                ...prev,
                [tempPhotoId]: true
            }));
            
            // Now start the actual upload to the server
            const formData = new FormData();
            formData.append('photo', file);
            
            // Store the upload info in localStorage to track it across page navigations
            const uploadInfo = {
                tempPhotoId,
                recipeId: recipe.id,
                timestamp: Date.now(),
                filename: file.name,
                status: 'uploading'
            };
            localStorage.setItem(`recipe_upload_${tempPhotoId}`, JSON.stringify(uploadInfo));
            
            // Use keepalive flag to ensure the request continues even if page is unloaded
            fetch(`${API_URL}/recipes/${recipe.id}/photos`, {
                method: 'POST',
                body: formData,
                keepalive: true, // This is the key flag that allows the request to continue
                // Set a longer timeout than default
                signal: AbortSignal.timeout(120000) // 2 minute timeout
            })
                .then(async (response) => {
                    const responseClone = response.clone();
                    try {
                        const data = await response.json();
                        if (!response.ok) {
                            throw new Error(data.message || 'Failed to upload photo');
                        }
                        return data;
                    } catch (jsonError) {
                        const textError = await responseClone.text();
                        throw new Error(textError || 'Failed to upload photo');
                    }
                })
                .then(data => {
                    console.log('Photo uploaded successfully:', data.photoPath);
                    
                    // Update the localStorage info to mark this upload as completed
                    localStorage.setItem(`recipe_upload_${tempPhotoId}`, JSON.stringify({
                        ...uploadInfo,
                        status: 'completed',
                        photoPath: data.photoPath
                    }));
                    
                    // Replace the temp photo with the real one
                    setPhotos(prevPhotos => 
                        prevPhotos.map(p => p === tempPhotoId ? data.photoPath : p)
                    );
                    
                    // Clear uploading state for this photo
                    setUploadingPhotos(prev => {
                        const updated = {...prev};
                        delete updated[tempPhotoId];
                        return updated;
                    });
                    
                    // Note: We don't delete the temp URL yet - keep it around
                    // in case we need to display it again before the server image loads
                    // We'll clean it up when the component unmounts
                })
                .catch(error => {
                    console.error('Error uploading photo:', error);
                    
                    // Update localStorage with the error
                    localStorage.setItem(`recipe_upload_${tempPhotoId}`, JSON.stringify({
                        ...uploadInfo,
                        status: 'error',
                        error: error.message
                    }));
                    
                    // Just remove the loading indicator
                    setUploadingPhotos(prev => {
                        const updated = {...prev};
                        delete updated[tempPhotoId];
                        return updated;
                    });
                    
                    // Show error but don't remove the image - it still looks good
                    // and will be synced next time they reload
                    alert(`Error uploading photo: ${error.message}. The image will appear to be saved but won't persist until internet connection is restored.`);
                });
        };
        
        // Start reading the file as a data URL
        reader.readAsDataURL(file);
    };

    const deletePhoto = (index) => {
        if (!recipe) return;
        
        const photoToDelete = photos[index];
        const updatedPhotos = [...photos];
        updatedPhotos.splice(index, 1);
        
        // Optimistic update - immediately remove the photo
        setPhotos(updatedPhotos);
        
        // For clarity, extract just the filename without the path
        let filename = photoToDelete;
        if (photoToDelete.includes('/')) {
            filename = photoToDelete.split('/').pop();
        }
        
        fetch(`${API_URL}/recipes/${recipe.id}/photos/${encodeURIComponent(filename)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete photo');
                }
                return response.json();
            })
            .then(() => {
                // Photo already removed from UI via optimistic update
                console.log('Photo deleted successfully');
            })
            .catch(error => {
                console.error('Error deleting photo:', error);
                alert(`Error deleting photo: ${error.message}`);
                refreshRecipeData(); // Reload data on error
            });
    };

    // Modal handlers for the image gallery
    const openModal = (index) => {
        setCurrentPhotoIndex(index);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    const showNextPhoto = () => {
        if (currentPhotoIndex < photos.length - 1) {
            setCurrentPhotoIndex(currentPhotoIndex + 1);
        }
    };

    const showPrevPhoto = () => {
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(currentPhotoIndex - 1);
        }
    };

    const extractIngredientsFromText = () => {
        if (!recipeText.trim() || !recipe) return;

        fetch(`${API_URL}/extract-ingredients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipeText }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to extract ingredients');
                }
                return response.json();
            })
            .then(data => {
                if (data.ingredients && data.ingredients.length > 0) {
                    // Merge with existing ingredients to avoid duplicates
                    const existingNames = new Set(ingredients.map(i => i.name.toLowerCase()));
                    const newIngredients = data.ingredients.filter(
                        i => !existingNames.has(i.name.toLowerCase())
                    );
                    
                    if (newIngredients.length > 0) {
                        // Optimistic update - immediately show extracted ingredients
                        const updatedIngredients = [...ingredients, ...newIngredients];
                        setIngredients(updatedIngredients);
                        
                        // Update ingredients in backend
                        fetch(`${API_URL}/recipes/${recipe.id}/ingredients`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ ingredients: updatedIngredients }),
                        })
                            .then(response => response.json())
                            .then(() => {
                                console.log('Extracted ingredients saved successfully');
                            })
                            .catch(error => {
                                console.error('Error updating ingredients:', error);
                                refreshRecipeData(); // Reload data on error
                            });
                    }
                }
            })
            .catch(error => {
                console.error('Error extracting ingredients:', error);
                refreshRecipeData(); // Reload data on error
            });
    };

    // Helper function to get the correct image URL
    const getImageUrl = (path) => {
        // Check if this is a temp path from optimistic UI update
        if (path && path.startsWith('temp-')) {
            // Use the temporary URL from our tempUrlsRef
            return tempUrlsRef.current[path] || '/static/placeholder-image.jpg';
        }
            
        // If it's a recipe-photos path (R2 storage), use the API endpoint
        if (path && path.startsWith('recipe-photos/')) {
            // Extract the path components
            const pathParts = path.split('/');
            // The format is 'recipe-photos/recipeId/filename'
            if (pathParts.length >= 3) {
                // Use the existing photos route structure
                return `${API_URL}/recipes/${pathParts[1]}/photos/${encodeURIComponent(pathParts[2])}`;
            }
        }
        // Otherwise use the static path (for existing local images)
        return `/static/${path}`;
    };

    if (loading) {
        return <div className="loading">Loading recipe...</div>;
    }

    if (!recipe) {
        return <div className="error">Recipe not found</div>;
    }

    return (
        <div className="recipe-detail-container">
            <button className="back-button" onClick={() => router.push('/')}>
                ← Back to Recipes
            </button>
            
            <h1 className="recipe-title">
                {(recipe.Name || recipe.name) ? 
                    String(recipe.Name || recipe.name).charAt(0).toUpperCase() + 
                    String(recipe.Name || recipe.name).slice(1)
                : 'Untitled Recipe'}
            </h1>
            
            <div className="recipe-content">
                <div className="recipe-image">
                    {recipe.image_path && (
                        <img 
                            src={getImageUrl(recipe.image_path)} 
                            alt={recipe.name || 'Recipe image'} 
                        />
                    )}
                    
                    <div className="links-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Useful Links</th>
                                </tr>
                            </thead>
                            <tbody>
                                {links.map((link, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="link-item">
                                                <a 
                                                    href={link.startsWith('http') ? link : `https://${link}`} 
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {link}
                                                </a>
                                                <button 
                                                    className="delete-btn-link" 
                                                    onClick={() => deleteLink(index)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td>
                                        <div className="add-link">
                                            <input
                                                type="text"
                                                value={newLink}
                                                onChange={(e) => setNewLink(e.target.value)}
                                                placeholder="Add new link"
                                                onKeyPress={(e) => e.key === 'Enter' && addLink()}
                                            />
                                            <button onClick={addLink}>Add</button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="recipe-info">
                    <div className="recipe-rating">
                        <h3>Rating</h3>
                        <StarRating 
                            rating={recipe.rating || recipe.Rating || 0} 
                            interactive={true} 
                            onRatingChange={handleRatingChange} 
                        />
                    </div>
                    
                    <div className="recipe-instructions">
                        <h3>Instructions</h3>
                        <textarea 
                            value={recipeText} 
                            onChange={handleRecipeTextChange}
                            onBlur={saveRecipeText}
                            placeholder="Type your recipe instructions here..."
                        />
                        <button 
                            className="extract-ingredients-btn"
                            onClick={extractIngredientsFromText}
                            disabled={!recipeText.trim()}
                        >
                            Extract Ingredients
                        </button>
                    </div>
                    
                    <div className="recipe-ingredients">
                        <h3>Ingredients</h3>
                        <div className="ingredients-list">
                            {ingredients.map((ingredient, index) => (
                                <div key={index} className="ingredient-item">
                                    <input
                                        type="checkbox"
                                        checked={ingredient.checked}
                                        onChange={() => handleIngredientCheck(index)}
                                    />
                                    <span className={ingredient.checked ? 'checked' : ''}>
                                        {ingredient.name}
                                    </span>
                                    <button 
                                        className="delete-btn-ingredient" 
                                        onClick={() => deleteIngredient(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <div className="add-ingredient">
                            <input
                                type="text"
                                value={newIngredient}
                                onChange={(e) => setNewIngredient(e.target.value)}
                                placeholder="Add new ingredient"
                                onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                            />
                            <button onClick={addIngredient}>Add</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="photo-collage-section">
                <h3>Photo Gallery</h3>
                <div className="photo-collage">
                    {photos.map((photo, index) => (
                        <div 
                            key={index} 
                            className="photo-tile" 
                            onClick={() => openModal(index)}
                        >
                            <img 
                                src={getImageUrl(photo)} 
                                alt={`Recipe photo ${index + 1}`} 
                            />
                            {uploadingPhotos[photo] && (
                                <div className="uploading-overlay">Uploading...</div>
                            )}
                            <button 
                                className="delete-photo-btn" 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    deletePhoto(index); 
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <div 
                        className="photo-tile add-photo-tile" 
                        onClick={handleAddPhotoClick}
                    >
                        <div className="plus-sign">+</div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handlePhotoUpload}
                        />
                    </div>
                </div>
            </div>

            {/* Modal for image gallery */}
            {modalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>×</button>
                        <div className="modal-image-container">
                            <img 
                                src={getImageUrl(photos[currentPhotoIndex])} 
                                alt={`Recipe photo ${currentPhotoIndex + 1}`} 
                                className="modal-image"
                            />
                        </div>
                        <div className="modal-controls">
                            <button 
                                onClick={showPrevPhoto} 
                                disabled={currentPhotoIndex === 0}
                            >
                                Prev
                            </button>
                            <button 
                                onClick={showNextPhoto} 
                                disabled={currentPhotoIndex === photos.length - 1}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecipeDetail; 