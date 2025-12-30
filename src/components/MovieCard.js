import React from 'react';
import './MovieCard.css';

const MovieCard = ({ movie, onClick }) => {
  return (
    <div className="movie-card" onClick={onClick}>
      <div className="movie-poster">
        <img 
          src={movie.poster} 
          alt={movie.title}
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/300x450/666666/ffffff?text=${encodeURIComponent(movie.title)}`;
          }}
        />
        <div className="movie-overlay">
          <span className="view-details">View Details</span>
        </div>
      </div>
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <div className="movie-meta">
          <span className="movie-year">{movie.year}</span>
          <span className="movie-genre">{movie.genre}</span>
        </div>
        <div className="movie-rating">
          <span className="rating-stars">⭐</span>
          <span className="rating-value">{movie.rating}/10</span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
