'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StarRating from '../StarRating/StarRating';
import './RecipeDetail.css';
import API_URL from '../../lib/api/config';

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
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = React.createRef();

    // New state for modal image gallery
    const [modalOpen, setModalOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    useEffect(() => {
        if (initialRecipe) {
            setRecipe(initialRecipe);
            setRecipeText(initialRecipe.recipeText || '');
            setIngredients(initialRecipe.ingredients || []);
            setLinks(initialRecipe.links || []);
            setPhotos(initialRecipe.photos || []);
            setLoading(false);
            return;
        }

        // If no initialRecipe, fetch the recipe data
        if (recipeId) {
            fetch(`${API_URL}/recipes/${recipeId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Recipe not found');
                    }
                    return response.json();
                })
                .then(data => {
                    setRecipe(data);
                    setRecipeText(data.recipeText || '');
                    setIngredients(data.ingredients || []);
                    setLinks(data.links || []);
                    setPhotos(data.photos || []);
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching recipe:', error);
                    setLoading(false);
                });
        }
    }, [initialRecipe, recipeId]);

    const handleRatingChange = (newRating) => {
        if (!recipe) return;
        
        const numericRating = parseFloat(newRating);
        fetch(`${API_URL}/recipes/${recipe.id}/rating`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
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
                setRecipe({ ...recipe, Rating: numericRating });
                window.dispatchEvent(new CustomEvent('recipe-updated'));
                console.log('Rating updated successfully');
            })
            .catch(error => {
                console.error('Error updating rating:', error);
            });
    };

    const handleRecipeTextChange = (e) => {
        setRecipeText(e.target.value);
    };

    const saveRecipeText = () => {
        if (!recipe) return;
        
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
            });
    };

    const handleIngredientCheck = (index) => {
        const updatedIngredients = [...ingredients];
        updatedIngredients[index].checked = !updatedIngredients[index].checked;
        setIngredients(updatedIngredients);
        if (!recipe) return;
        
        fetch(`${API_URL}/recipes/${recipe.id}/ingredients`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ingredients: updatedIngredients }),
        })
            .then(response => response.json())
            .then(() => {
                window.dispatchEvent(new CustomEvent('recipe-updated'));
            })
            .catch(error => {
                console.error('Error updating ingredients:', error);
            });
    };

    const addIngredient = () => {
        if (!newIngredient.trim() || !recipe) return;
        
        const newIngredientObj = { name: newIngredient, checked: false };
        const updatedIngredients = [...ingredients, newIngredientObj];
        
        //console.log('Sending ingredients update for recipe ID:', recipe.id);
        //console.log('Updated ingredients:', updatedIngredients);
        
        fetch(`${API_URL}/recipes/${recipe.id}/ingredients`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ingredients: updatedIngredients }),
        })
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error('Failed to update ingredients');
                }
                return response.json();
            })
            .then(() => {
                setIngredients(updatedIngredients);
                setNewIngredient('');
                window.dispatchEvent(new CustomEvent('recipe-updated'));
            })
            .catch(error => {
                console.error('Error adding ingredient:', error);
            });
    };

    const deleteIngredient = (index) => {
        if (!recipe) return;
        
        const updatedIngredients = [...ingredients];
        updatedIngredients.splice(index, 1);
        
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
                setIngredients(updatedIngredients);
                window.dispatchEvent(new CustomEvent('recipe-updated'));
            })
            .catch(error => {
                console.error('Error deleting ingredient:', error);
            });
    };

    const addLink = () => {
        if (!newLink.trim() || !recipe) return;
        
        const updatedLinks = [...links, newLink];
        
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
                setLinks(updatedLinks);
                setNewLink('');
                window.dispatchEvent(new CustomEvent('recipe-updated'));
            })
            .catch(error => {
                console.error('Error adding link:', error);
            });
    };

    const deleteLink = (index) => {
        if (!recipe) return;
        
        const updatedLinks = [...links];
        updatedLinks.splice(index, 1);
        
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
                setLinks(updatedLinks);
                window.dispatchEvent(new CustomEvent('recipe-updated'));
            })
            .catch(error => {
                console.error('Error deleting link:', error);
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

        const formData = new FormData();
        formData.append('photo', file);

        setUploadingPhoto(true);

        fetch(`${API_URL}/recipes/${recipe.id}/photos`, {
            method: 'POST',
            body: formData,
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
                setPhotos([...photos, data.photoPath]);
                setUploadingPhoto(false);
                window.dispatchEvent(new CustomEvent('recipe-updated'));
            })
            .catch(error => {
                console.error('Error uploading photo:', error);
                alert(`Error uploading photo: ${error.message}`);
                setUploadingPhoto(false);
            });
    };

    const deletePhoto = (index) => {
        if (!recipe) return;
        
        const photoToDelete = photos[index];
        const updatedPhotos = [...photos];
        updatedPhotos.splice(index, 1);
        
        fetch(`${API_URL}/recipes/${recipe.id}/photos/${encodeURIComponent(photoToDelete)}`, {
            method: 'DELETE',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete photo');
                }
                return response.json();
            })
            .then(() => {
                setPhotos(updatedPhotos);
                window.dispatchEvent(new CustomEvent('recipe-updated'));
            })
            .catch(error => {
                console.error('Error deleting photo:', error);
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
                        const updatedIngredients = [...ingredients, ...newIngredients];
                        
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
                                setIngredients(updatedIngredients);
                                window.dispatchEvent(new CustomEvent('recipe-updated'));
                            })
                            .catch(error => {
                                console.error('Error updating ingredients:', error);
                            });
                    }
                }
            })
            .catch(error => {
                console.error('Error extracting ingredients:', error);
            });
    };

    // Helper function to get the correct image URL
    const getImageUrl = (path) => {
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
                {String(recipe.Name).charAt(0).toUpperCase() + String(recipe.Name).slice(1)}
            </h1>
            
            <div className="recipe-content">
                <div className="recipe-image">
                    <img src={`/static/${recipe.Image_path}`} alt={recipe.Name} />
                    
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
                            rating={recipe.Rating} 
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
                        {uploadingPhoto && <div className="uploading-overlay">Uploading...</div>}
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