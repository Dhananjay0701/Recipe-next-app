import React, { useState } from "react";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa"; // Icons for filled and empty stars
import "./StarRating.css";

const StarRating = ({ rating, onRatingChange, interactive = false, maxStars = 5 }) => {
    const [hoverRating, setHoverRating] = useState(0);
    
    const handleMouseMove = (e, index) => {
        if (!interactive) return;
        
        // Get position of click within the star element
        const { left, width } = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - left;
        
        // If click is on the left half, set half star rating
        if (x < width / 2) {
            setHoverRating(index + 0.5);
        } else {
            setHoverRating(index + 1);
        }
    };

    const handleClick = (e, index) => {
        if (!interactive || !onRatingChange) return;
        
        // Get position of click within the star element
        const { left, width } = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - left;
        
        // If click is on the left half, select half star rating
        const newRating = x < width / 2 ? index + 0.5 : index + 1;
        onRatingChange(newRating);
    };

    const handleMouseLeave = () => {
        if (interactive) {
            setHoverRating(0);
        }
    };

    const renderStar = (index) => {
        const currentRating = hoverRating || rating || 0;
        
        if (index + 1 <= currentRating) {
            return <FaStar className="star-filled" />;
        } else if (index + 0.5 === Math.floor(currentRating) + 0.5 && 
                  currentRating % 1 !== 0) {
            return <FaStarHalfAlt className="star-half" />;
        } else {
            return <FaRegStar className="star-empty" />;
        }
    };

    return (
        <div className="star-rating" onMouseLeave={handleMouseLeave}>
            {[...Array(maxStars)].map((_, index) => (
                <div 
                    key={index}
                    className={`star ${interactive ? 'interactive' : ''}`}
                    onMouseMove={(e) => handleMouseMove(e, index)}
                    onClick={(e) => handleClick(e, index)}
                >
                    {renderStar(index)}
                </div>
            ))}
        </div>
    );
};

export default StarRating;
    
