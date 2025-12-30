import React, { useState, useEffect } from 'react';
import './App.css';
import SwipeInterface from './components/SwipeInterface';

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

// Function to fetch movies from TMDB
const fetchMoviesFromTMDB = async () => {
  try {
    // Fetch multiple pages of popular movies for variety
    const pages = [1, 2, 3];
    const allMovies = [];

    for (const page of pages) {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      
      if (data.results) {
        allMovies.push(...data.results);
      }
    }

    return allMovies;
  } catch (error) {
    console.error('Error fetching movies from TMDB:', error);
    return [];
  }
};

// Function to transform TMDB data to our app format
const transformTMDBData = (tmdbMovies) => {
  return tmdbMovies.map(movie => {
    const movieGenres = movie.genre_ids ? 
          movie.genre_ids.map(id => GENRE_MAP[id]).filter(Boolean) : [];
    
    return {
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown',
      genre: movieGenres.length > 0 ? movieGenres[0] : 'Unknown', // Primary genre for display
      genres: movieGenres, // All genres for filtering
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
      poster: movie.poster_path ? 
              `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : 
              'https://via.placeholder.com/300x450/cccccc/ffffff?text=No+Image',
      description: movie.overview || 'No description available.',
      tags: movieGenres // Keep for backward compatibility
    };
  }).filter(movie => movie.poster !== 'https://via.placeholder.com/300x450/cccccc/ffffff?text=No+Image'); // Filter out movies without posters
};

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load movies from TMDB API
    const loadMovies = async () => {
      try {
        setLoading(true);
        const tmdbMovies = await fetchMoviesFromTMDB();
        
        if (tmdbMovies.length > 0) {
          const transformedMovies = transformTMDBData(tmdbMovies);
          setMovies(transformedMovies);
        } else {
          setError('No movies found. Please check your API key.');
        }
      } catch (err) {
        console.error('Error loading movies:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  const handleMovieAction = (movie, action) => {
    console.log(`Movie "${movie.title}" was ${action}`);
    // You can add logic here to save liked/passed movies to localStorage or send to API
  };

  if (loading) {
    return (
      <div className="App" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading movies...
      </div>
    );
  }

  if (error) {
    return (
      <div className="App" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666',
        textAlign: 'center',
        padding: '20px'
      }}>
        <p>{error}</p>
        <p style={{ fontSize: '14px', marginTop: '10px' }}>
          Make sure to replace 'your-tmdb-api-key-here' with your actual TMDB API key.
        </p>
      </div>
    );
  }

  return (
    <div className="App">
      <SwipeInterface 
        movies={movies}
        onMovieAction={handleMovieAction}
      />
    </div>
  );
}

export default App;
