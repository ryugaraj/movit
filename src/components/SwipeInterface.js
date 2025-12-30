import React, { useState, useEffect, useCallback } from 'react';
import SwipeCard from './SwipeCard';
import './SwipeInterface.css';

// TMDB API Configuration
const TMDB_API_KEY = '4cfb4198db483f1580100dea9f909e47';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Genre mapping from TMDB genre IDs to names
const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// Reverse mapping from genre names to IDs
const GENRE_NAME_TO_ID = Object.entries(GENRE_MAP).reduce((acc, [id, name]) => {
  acc[name] = parseInt(id);
  return acc;
}, {});

const SwipeInterface = ({ movies, onMovieAction }) => {
  const [currentMovies, setCurrentMovies] = useState([]);
  const [likedMovies, setLikedMovies] = useState(() => {
    const saved = localStorage.getItem('movit-liked-movies');
    return saved ? JSON.parse(saved) : [];
  });
  const [passedMovies, setPassedMovies] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [likedSidebarOpen, setLikedSidebarOpen] = useState(false);
  const [yearRange, setYearRange] = useState({ from: 1992, to: new Date().getFullYear() });
  const [yearLimits, setYearLimits] = useState({ min: 1992, max: new Date().getFullYear() });

  // Save liked movies to localStorage whenever likedMovies changes
  useEffect(() => {
    localStorage.setItem('movit-liked-movies', JSON.stringify(likedMovies));
  }, [likedMovies]);

  // Load movies from TMDB API based on filters
  const loadMovies = useCallback(async (selectedGenres = [], currentYearRange = yearRange) => {
    try {
      let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=1`;
      
      // Add genre filters if any are selected
      if (selectedGenres.length > 0) {
        const genreIds = selectedGenres
          .map(genreName => GENRE_NAME_TO_ID[genreName])
          .filter(Boolean)
          .join(',');
        
        if (genreIds) {
          url += `&with_genres=${genreIds}`;
        }
      }
      
      // Add year range filters (always apply if we have a range)
      if (currentYearRange.from) {
        url += `&primary_release_date.gte=${currentYearRange.from}-01-01`;
      }
      if (currentYearRange.to) {
        url += `&primary_release_date.lte=${currentYearRange.to}-12-31`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results) {
        const transformedMovies = transformTMDBData(data.results);
        
        // Filter out already liked or passed movies
        const filteredMovies = transformedMovies.filter(movie => 
          !likedMovies.some(liked => liked.id === movie.id) &&
          !passedMovies.some(passed => passed.id === movie.id)
        );
        
        setCurrentMovies(filteredMovies);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      setCurrentMovies([]);
    }
  }, [likedMovies, passedMovies, yearRange]);

  // Initialize available genres and load initial movies
  useEffect(() => {
    setAvailableTags(Object.values(GENRE_MAP).sort());
    loadMovies();
  }, [loadMovies]);

  // Transform TMDB data to our app format
  const transformTMDBData = (tmdbMovies) => {
    return tmdbMovies.map(movie => {
      const movieGenres = movie.genre_ids ? 
            movie.genre_ids.map(id => GENRE_MAP[id]).filter(Boolean) : [];
      
      return {
        id: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown',
        genre: movieGenres.length > 0 ? movieGenres[0] : 'Unknown',
        genres: movieGenres,
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
        poster: movie.poster_path ? 
                `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : 
                'https://via.placeholder.com/300x450/cccccc/ffffff?text=No+Image',
        description: movie.overview || 'No description available.',
        tags: movieGenres
      };
    }).filter(movie => movie.poster !== 'https://via.placeholder.com/300x450/cccccc/ffffff?text=No+Image');
  };

  const handleTagToggle = (tag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    loadMovies(newTags, yearRange);
  };

  const handleYearRangeChange = (field, value) => {
    const newYearRange = { ...yearRange, [field]: value };
    setYearRange(newYearRange);
    loadMovies(selectedTags, newYearRange);
  };

  const clearYearRange = () => {
    const newYearRange = { from: 1992, to: new Date().getFullYear() };
    setYearRange(newYearRange);
    loadMovies(selectedTags, newYearRange);
  };

  const handleSwipe = (movie, direction) => {
    if (direction === 'right') {
      setLikedMovies(prev => [...prev, movie]);
      onMovieAction && onMovieAction(movie, 'liked');
    } else {
      setPassedMovies(prev => [...prev, movie]);
      onMovieAction && onMovieAction(movie, 'passed');
    }

    // Remove the movie from current stack
    setCurrentMovies(prev => prev.filter(m => m.id !== movie.id));
  };

  const handleButtonAction = (action) => {
    if (currentMovies.length === 0) return;
    
    const topMovie = currentMovies[0];
    const direction = action === 'like' ? 'right' : 'left';
    handleSwipe(topMovie, direction);
  };

  const handleDismissLiked = (movieToRemove) => {
    setLikedMovies(prev => prev.filter(movie => movie.id !== movieToRemove.id));
    // Refresh the current movies to potentially show the dismissed movie again
    loadMovies(selectedTags, yearRange);
  };

  const resetStack = () => {
    setLikedMovies([]);
    setPassedMovies([]);
    loadMovies(selectedTags, yearRange);
  };

  return (
    <div className="swipe-interface">
      {/* Left Sidebar Overlay */}
      <div 
        className={`left-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Left Sidebar */}
      <div className={`sidebar left-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button 
          className="sidebar-close"
          onClick={() => setSidebarOpen(false)}
        >
          ×
        </button>
        
        <div className="sidebar-header">
          <h2 className="sidebar-title">Filters</h2>
        </div>

        <div className="filter-section">
          <h3 className="filter-section-title">Release Year</h3>
          <div className="year-slider-container">
            <div className="year-value-display">
              {yearRange.from === yearRange.to ? 
                yearRange.from : 
                `${yearRange.from} - ${yearRange.to}`
              }
            </div>
            
            <div className="dual-range-slider">
              <input
                type="range"
                min={1992}
                max={yearLimits.max}
                value={yearRange.from}
                onChange={(e) => handleYearRangeChange('from', parseInt(e.target.value))}
                className="slider-from"
              />
              <input
                type="range"
                min={1992}
                max={yearLimits.max}
                value={yearRange.to}
                onChange={(e) => handleYearRangeChange('to', parseInt(e.target.value))}
                className="slider-to"
              />
            </div>
            
            <div className="year-range-inputs">
              <div className="year-range-input">
                <input
                  type="number"
                  value={yearRange.from}
                  onChange={(e) => handleYearRangeChange('from', parseInt(e.target.value))}
                  min={1992}
                  max={yearLimits.max}
                />
              </div>
              <span className="range-separator">–</span>
              <div className="year-range-input">
                <input
                  type="number"
                  value={yearRange.to}
                  onChange={(e) => handleYearRangeChange('to', parseInt(e.target.value))}
                  min={1992}
                  max={yearLimits.max}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="filter-section">
          <h3 className="filter-section-title">Genres</h3>
          <div className="genre-filters">
            {availableTags.map(tag => (
              <button
                key={tag}
                className={`genre-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar Overlay */}
      <div 
        className={`right-sidebar-overlay ${likedSidebarOpen ? 'open' : ''}`}
        onClick={() => setLikedSidebarOpen(false)}
      ></div>

      {/* Right Sidebar */}
      <div className={`sidebar right-sidebar ${likedSidebarOpen ? 'open' : ''}`}>
        <button 
          className="sidebar-close"
          onClick={() => setLikedSidebarOpen(false)}
        >
          ×
        </button>
        
        <div className="sidebar-header">
          <h2 className="sidebar-title">Liked Movies ({likedMovies.length})</h2>
        </div>

        <div className="liked-movies-list">
          {likedMovies.length === 0 ? (
            <div className="empty-likes">
              <p>No liked movies yet!</p>
              <p>Start swiping to add some favorites.</p>
            </div>
          ) : (
            likedMovies.map(movie => (
              <div key={movie.id} className="liked-movie-item">
                <img src={movie.poster} alt={movie.title} />
                <div className="movie-details">
                  <h4>{movie.title}</h4>
                  <span>{movie.year} • {movie.genre}</span>
                </div>
                <button 
                  className="dismiss-button"
                  onClick={() => handleDismissLiked(movie)}
                  title="Remove from liked"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Header */}
      <div className="swipe-mode-header">
        <button 
          className="filter-button"
          onClick={() => setSidebarOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
          </svg>
        </button>
      </div>
      
      {/* Liked Movies Header */}
      <div className="liked-mode-header">
        <button 
          className="liked-button"
          onClick={() => setLikedSidebarOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>


      {/* Card Stack */}
      <div className="card-stack">
        {currentMovies.length === 0 ? (
          <div className="no-more-cards">
            <h2>No more movies!</h2>
            <p>You've seen all movies matching your selected tags.</p>
            <button className="reset-button" onClick={resetStack}>
              Start Over
            </button>
          </div>
        ) : (
          currentMovies.slice(0, 3).map((movie, index) => (
            <SwipeCard
              key={movie.id}
              movie={movie}
              onSwipe={handleSwipe}
              isTop={index === 0}
              zIndex={10 - index}
            />
          ))
        )}
      </div>


    </div>
  );
};

export default SwipeInterface;
