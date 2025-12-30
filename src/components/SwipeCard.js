import React, { useState, useRef, useEffect } from 'react';
import './SwipeCard.css';

const SwipeCard = ({ movie, onSwipe, isTop, zIndex }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const cardRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleStart = (clientX, clientY) => {
    if (!isTop) return;
    setIsDragging(true);
    startPosRef.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging || !isTop) return;

    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;
    
    setPosition({ x: deltaX, y: deltaY });
    setRotation(deltaX * 0.1);
  };

  const handleEnd = () => {
    if (!isDragging || !isTop) return;
    
    setIsDragging(false);
    const threshold = 100;
    
    if (Math.abs(position.x) > threshold) {
      const direction = position.x > 0 ? 'right' : 'left';
      onSwipe(movie, direction);
    } else {
      // Reset position if threshold not met
      setPosition({ x: 0, y: 0 });
      setRotation(0);
    }
  };

  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Add global event listeners for mouse
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  const getSwipeDirection = () => {
    if (position.x > 50) return 'like';
    if (position.x < -50) return 'pass';
    return '';
  };

  const cardStyle = {
    transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
    zIndex: zIndex,
    opacity: isTop ? 1 : 0.8,
    scale: isTop ? 1 : 0.95,
  };

  return (
    <div
      ref={cardRef}
      className={`swipe-card ${getSwipeDirection()}`}
      style={cardStyle}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="card-image">
        <img 
          src={movie.poster} 
          alt={movie.title}
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/300x450/666666/ffffff?text=${encodeURIComponent(movie.title)}`;
          }}
        />
        
        {/* Swipe indicators */}
        <div className="swipe-indicator like-indicator">
          LIKE
        </div>
        <div className="swipe-indicator pass-indicator">
          NOPE
        </div>
      </div>
      
      <div className="card-info">
        <div className="card-header">
          <h2>{movie.title}</h2>
          <span className="card-year">{movie.year}</span>
        </div>
        
        <div className="card-details">
          <div className="card-genres">
            {movie.genres && movie.genres.length > 0 ? (
              movie.genres.map((genre, index) => (
                <span key={index} className="card-genre">{genre}</span>
              ))
            ) : (
              <span className="card-genre">{movie.genre}</span>
            )}
          </div>
          <div className="card-rating">
            <span className="rating-stars">⭐</span>
            <span>{movie.rating}/10</span>
          </div>
        </div>
        
        <p 
          className="card-description"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {movie.description}
        </p>
      </div>
    </div>
  );
};

export default SwipeCard;
