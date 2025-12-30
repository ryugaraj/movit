import React, { useEffect } from 'react';
import './MovieModal.css';

const MovieModal = ({ movie, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <div className="modal-body">
          <div className="modal-poster">
            <img 
              src={movie.poster} 
              alt={movie.title}
              onError={(e) => {
                e.target.src = `https://via.placeholder.com/300x450/666666/ffffff?text=${encodeURIComponent(movie.title)}`;
              }}
            />
          </div>
          <div className="modal-info">
            <h2 className="modal-title">{movie.title}</h2>
            <div className="modal-meta">
              <span className="modal-year">{movie.year}</span>
              <span className="modal-genre">{movie.genre}</span>
              <div className="modal-rating">
                <span className="rating-stars">⭐</span>
                <span className="rating-value">{movie.rating}/10</span>
              </div>
            </div>
            <div className="modal-description">
              <h3>Synopsis</h3>
              <p>{movie.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
