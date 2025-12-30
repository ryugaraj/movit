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
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Liked movies filtering (local only)
  const [likedSelectedTags, setLikedSelectedTags] = useState([]);
  const [likedYearRange, setLikedYearRange] = useState({ from: 1990, to: new Date().getFullYear() });
  const [filteredLikedMovies, setFilteredLikedMovies] = useState([]);

  // Save liked movies to localStorage whenever likedMovies changes
  useEffect(() => {
    localStorage.setItem('movit-liked-movies', JSON.stringify(likedMovies));
  }, [likedMovies]);

  // Load movies from TMDB API based on filters
  const loadMovies = async (selectedGenres = [], currentYearRange = yearRange, page = 1, appendToExisting = false) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      console.log(`Loading movies - page: ${page}, append: ${appendToExisting}`);
      
      let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=${page}`;
      
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
      
      console.log('API URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`API Response - page: ${page}, results: ${data.results?.length || 0}`);
      
      if (data.results && data.results.length > 0) {
        const transformedMovies = transformTMDBData(data.results);
        
        // Filter out already liked or passed movies
        const filteredMovies = transformedMovies.filter(movie => 
          !likedMovies.some(liked => liked.id === movie.id) &&
          !passedMovies.some(passed => passed.id === movie.id)
        );
        
        console.log(`Filtered movies: ${filteredMovies.length}`);
        
        setCurrentMovies(prev => {
          if (appendToExisting) {
            // Remove duplicates by id
            const existingIds = prev.map(movie => movie.id);
            const newMovies = filteredMovies.filter(movie => !existingIds.includes(movie.id));
            console.log(`Adding ${newMovies.length} new movies to existing ${prev.length}`);
            return [...prev, ...newMovies];
          } else {
            console.log(`Setting ${filteredMovies.length} movies (replacing existing)`);
            return filteredMovies;
          }
        });
        
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      if (!appendToExisting) {
        setCurrentMovies([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load more movies when running low
  const loadMoreMovies = async () => {
    console.log(`loadMoreMovies called - isLoading: ${isLoading}, currentPage: ${currentPage}`);
    if (!isLoading) {
      console.log(`Loading page ${currentPage + 1} with tags:`, selectedTags);
      await loadMovies(selectedTags, yearRange, currentPage + 1, true);
    } else {
      console.log('Skipping load - already loading');
    }
  };

  // Initialize available genres and load initial movies
  useEffect(() => {
    setAvailableTags(Object.values(GENRE_MAP).sort());
    loadMovies([], yearRange, 1, false);
  }, []); // Only run once on mount

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
    setCurrentPage(1); // Reset page when filters change
    loadMovies(newTags, yearRange, 1, false);
  };

  const handleYearRangeChange = (field, value) => {
    const newYearRange = { ...yearRange, [field]: value };
    setYearRange(newYearRange);
    setCurrentPage(1); // Reset page when filters change
    loadMovies(selectedTags, newYearRange, 1, false);
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
    setCurrentMovies(prev => {
      const newStack = prev.filter(m => m.id !== movie.id);
      
      console.log(`Movies left: ${newStack.length}, Current page: ${currentPage}, Loading: ${isLoading}`);
      
      // Load more movies when we have 10 or fewer left (more aggressive)
      if (newStack.length <= 10 && !isLoading) {
        console.log('Triggering loadMoreMovies...');
        loadMoreMovies();
      }
      
      return newStack;
    });
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

  // Local filtering for liked movies (no API calls)
  const handleLikedTagToggle = (tag) => {
    const newTags = likedSelectedTags.includes(tag)
      ? likedSelectedTags.filter(t => t !== tag)
      : [...likedSelectedTags, tag];
    
    setLikedSelectedTags(newTags);
  };

  const handleLikedYearRangeChange = (field, value) => {
    const newYearRange = { ...likedYearRange, [field]: value };
    setLikedYearRange(newYearRange);
  };

  // Filter liked movies locally whenever filters or likedMovies change
  useEffect(() => {
    let filtered = [...likedMovies];

    // Filter by genres
    if (likedSelectedTags.length > 0) {
      filtered = filtered.filter(movie => 
        movie.genres && movie.genres.some(genre => likedSelectedTags.includes(genre))
      );
    }

    // Filter by year range
    filtered = filtered.filter(movie => {
      const movieYear = parseInt(movie.year);
      return movieYear >= likedYearRange.from && movieYear <= likedYearRange.to;
    });

    setFilteredLikedMovies(filtered);
  }, [likedMovies, likedSelectedTags, likedYearRange]);

  // Get available genres from liked movies
  const getLikedAvailableGenres = () => {
    const genres = new Set();
    likedMovies.forEach(movie => {
      if (movie.genres) {
        movie.genres.forEach(genre => genres.add(genre));
      }
    });
    return Array.from(genres).sort();
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

        {likedMovies.length > 0 && (
          <>
            <div className="filter-section">
              <h3 className="filter-section-title">Filter by Year</h3>
              <div className="year-slider-container">
                <div className="year-value-display">
                  {likedYearRange.from === likedYearRange.to ? 
                    likedYearRange.from : 
                    `${likedYearRange.from} - ${likedYearRange.to}`
                  }
                </div>
                
                <div className="dual-range-slider">
                  <input
                    type="range"
                    min={1990}
                    max={new Date().getFullYear()}
                    value={likedYearRange.from}
                    onChange={(e) => handleLikedYearRangeChange('from', parseInt(e.target.value))}
                    className="slider-from"
                  />
                  <input
                    type="range"
                    min={1990}
                    max={new Date().getFullYear()}
                    value={likedYearRange.to}
                    onChange={(e) => handleLikedYearRangeChange('to', parseInt(e.target.value))}
                    className="slider-to"
                  />
                </div>
              </div>
            </div>

            <div className="filter-section">
              <h3 className="filter-section-title">Filter by Genre</h3>
              <div className="genre-filters">
                {getLikedAvailableGenres().map(tag => (
                  <button
                    key={tag}
                    className={`genre-tag ${likedSelectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => handleLikedTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="liked-movies-list">
          {likedMovies.length === 0 ? (
            <div className="empty-likes">
              <p>No liked movies yet!</p>
              <p>Start swiping to add some favorites.</p>
            </div>
          ) : filteredLikedMovies.length === 0 ? (
            <div className="empty-likes">
              <p>No movies match your filters!</p>
              <p>Try adjusting the year range or genre filters.</p>
            </div>
          ) : (
            filteredLikedMovies.map(movie => (
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
