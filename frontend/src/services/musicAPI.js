// Updated Music API Service for ProMetronome Backend
class MusicAPIService {
  constructor() {
    // Use environment variable for production, fallback to localhost for development
    this.backendURL = process.env.REACT_APP_API_URL || 'http://localhost:5136/api';
    this.fallbackToDemo = true; // Enable demo mode if backend is unavailable
  }

  // Search songs using our .NET backend
  async searchSongs(query, limit = 20, offset = 0) {
    try {
      const response = await fetch(`${this.backendURL}/music/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        songs: data.songs.map(song => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration ? Math.floor(song.duration / 1000) : null,
          preview_url: song.previewUrl,
          artwork: song.artworkUrl,
          genre: song.genre,
          bpm: song.bpm,
          explicit: song.isExplicit,
          popularity: song.popularity,
          spotify_url: song.spotifyUrl,
          audio_features: song.audioFeatures
        })),
        total: data.total,
        hasMore: data.total > (offset + limit)
      };
    } catch (error) {
      console.warn('Backend API unavailable, using demo mode:', error.message);
      
      if (this.fallbackToDemo) {
        return this.getMockSearchResults(query);
      }
      
      throw error;
    }
  }

  // Get detailed song information by ID
  async getSongById(id) {
    try {
      const response = await fetch(`${this.backendURL}/music/song/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const song = await response.json();
      
      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration ? Math.floor(song.duration / 1000) : null,
        preview_url: song.previewUrl,
        artwork: song.artworkUrl,
        genre: song.genre,
        bpm: song.bpm,
        explicit: song.isExplicit,
        popularity: song.popularity,
        spotify_url: song.spotifyUrl,
        audio_features: song.audioFeatures
      };
    } catch (error) {
      console.warn('Backend API unavailable for song details:', error.message);
      
      if (this.fallbackToDemo && id.startsWith('demo')) {
        return this.getMockSongById(id);
      }
      
      throw error;
    }
  }

  // Check backend health
  async checkHealth() {
    try {
      const response = await fetch(`${this.backendURL}/music/health`, {
        method: 'GET',
        timeout: 3000
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Mock search results for demo when backend is unavailable
  getMockSearchResults(query) {
    const queryLower = query.toLowerCase();
    
    const demoSongs = [
      {
        id: 'demo_blinding_lights',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        genre: 'Pop',
        bpm: 171,
        duration: 200,
        preview_url: null,
        artwork: 'https://via.placeholder.com/300x300/1DB954/ffffff?text=Demo',
        explicit: false,
        popularity: 95,
        source: 'demo',
        confidence: 0.9,
        audio_features: {
          tempo: 171,
          energy: 0.73,
          danceability: 0.51,
          valence: 0.33
        }
      },
      {
        id: 'demo_good_4_u',
        title: 'Good 4 U',
        artist: 'Olivia Rodrigo',
        album: 'SOUR',
        genre: 'Pop Rock',
        bpm: 166,
        duration: 178,
        preview_url: null,
        artwork: 'https://via.placeholder.com/300x300/FF6B6B/ffffff?text=Demo',
        explicit: false,
        popularity: 89,
        source: 'demo',
        confidence: 0.85,
        audio_features: {
          tempo: 166,
          energy: 0.66,
          danceability: 0.56,
          valence: 0.43
        }
      },
      {
        id: 'demo_levitating',
        title: 'Levitating',
        artist: 'Dua Lipa',
        album: 'Future Nostalgia',
        genre: 'Dance Pop',
        bpm: 103,
        duration: 203,
        preview_url: null,
        artwork: 'https://via.placeholder.com/300x300/9B59B6/ffffff?text=Demo',
        explicit: false,
        popularity: 88,
        source: 'demo',
        confidence: 0.92,
        audio_features: {
          tempo: 103,
          energy: 0.82,
          danceability: 0.88,
          valence: 0.85
        }
      },
      {
        id: 'demo_watermelon_sugar',
        title: 'Watermelon Sugar',
        artist: 'Harry Styles',
        album: 'Fine Line',
        genre: 'Pop Rock',
        bpm: 95,
        duration: 174,
        preview_url: null,
        artwork: 'https://via.placeholder.com/300x300/E74C3C/ffffff?text=Demo',
        explicit: false,
        popularity: 92,
        source: 'demo',
        confidence: 0.88,
        audio_features: {
          tempo: 95,
          energy: 0.54,
          danceability: 0.73,
          valence: 0.56
        }
      }
    ];

    const filteredSongs = demoSongs.filter(song => 
      song.title.toLowerCase().includes(queryLower) ||
      song.artist.toLowerCase().includes(queryLower) ||
      song.album.toLowerCase().includes(queryLower) ||
      song.genre.toLowerCase().includes(queryLower)
    );

    return {
      songs: filteredSongs,
      total: filteredSongs.length,
      hasMore: false,
      isDemoMode: true
    };
  }

  // Get mock song by ID for demo mode
  getMockSongById(id) {
    const demoSongs = this.getMockSearchResults('').songs;
    return demoSongs.find(song => song.id === id) || null;
  }

  // Estimate BPM based on genre for fallback
  estimateBPM(genre, duration) {
    const genreBPMRanges = {
      'pop': { min: 100, max: 130 },
      'rock': { min: 110, max: 140 },
      'hip-hop': { min: 70, max: 140 },
      'dance': { min: 120, max: 135 },
      'electronic': { min: 120, max: 150 },
      'country': { min: 120, max: 140 },
      'r&b': { min: 70, max: 100 },
      'jazz': { min: 120, max: 200 },
      'classical': { min: 60, max: 200 },
      'reggae': { min: 60, max: 90 },
      'blues': { min: 60, max: 120 },
      'funk': { min: 100, max: 125 }
    };

    const genreKey = genre ? genre.toLowerCase() : 'pop';
    const range = genreBPMRanges[genreKey] || genreBPMRanges['pop'];
    
    // Add some variance based on song duration
    const durationFactor = duration ? Math.min(duration / 180, 1.2) : 1;
    const estimatedBPM = Math.round((range.min + range.max) / 2 * durationFactor);
    
    return Math.max(range.min, Math.min(range.max, estimatedBPM));
  }

  // Format song data for practice mode
  formatForPractice(song, targetBPM = null) {
    // Import TIME_SIGNATURES to set a default
    const defaultTimeSignature = { value: '4/4', label: '4/4 (Common time)', beatsPerMeasure: 4, noteValue: 4 };
    
    return {
      ...song,
      name: song.title || song.name, // Ensure name property exists
      originalBPM: song.bpm,
      targetBPM: targetBPM || song.bpm,
      bpm: targetBPM || song.bpm, // Use targetBPM if provided
      timeSignature: song.timeSignature || defaultTimeSignature,
      practiceReady: true,
      tempoAdjustment: targetBPM ? ((targetBPM - song.bpm) / song.bpm * 100).toFixed(1) : 0
    };
  }

  // Get recommendations for practice (mock for now)
  async getRecommendations(bpm, genre = null, limit = 10) {
    const allSongs = this.getMockSearchResults('').songs;
    
    return allSongs
      .filter(song => {
        const bpmMatch = Math.abs(song.bpm - bpm) <= 20; // Within 20 BPM
        const genreMatch = !genre || song.genre.toLowerCase().includes(genre.toLowerCase());
        return bpmMatch && genreMatch;
      })
      .slice(0, limit);
  }
}

// Create and export a singleton instance
const musicAPI = new MusicAPIService();
export default musicAPI;
