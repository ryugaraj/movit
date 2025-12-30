import React from 'react';
import MovieCard from './MovieCard';
import './MovieList.css';

const MovieList = ({ movies, onMovieClick }) => {
  if (movies.length === 0) {
    return (
      <div className="no-movies">
        <p>No movies found. Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="movie-list">
      <div className="movies-grid">
        {movies.map(movie => (
          <MovieCard 
            key={movie.id} 
            movie={movie} 
            onClick={() => onMovieClick(movie)}
          />
        ))}
      </div>
    </div>
  );
};

export default MovieList;
