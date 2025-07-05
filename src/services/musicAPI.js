import axios from 'axios';

// Using multiple free music APIs for song search and BPM data
class MusicAPIService {
  constructor() {
    this.lastFMKey = 'demo_key'; // You can get a free API key from Last.fm
    this.musicBrainzBaseURL = 'https://musicbrainz.org/ws/2';
    this.coverArtArchiveURL = 'https://coverartarchive.org';
    
    // We'll use a combination of APIs:
    // 1. iTunes Search API (free, no key required)
    // 2. Last.fm API (free with registration)
    // 3. MusicBrainz (free, no key required)
    // 4. Song.link API (free, no key required)
  }

  // Search songs using iTunes API (free, no auth required)
  async searchSongsItunes(query, limit = 20) {
    try {
      const response = await axios.get('https://itunes.apple.com/search', {
        params: {
          term: query,
          media: 'music',
          entity: 'song',
          limit: limit,
          country: 'US'
        }
      });

      return response.data.results.map(song => ({
        id: song.trackId,
        title: song.trackName,
        artist: song.artistName,
        album: song.collectionName,
        duration: song.trackTimeMillis ? Math.floor(song.trackTimeMillis / 1000) : null,
        preview_url: song.previewUrl,
        artwork: song.artworkUrl100,
        release_date: song.releaseDate,
        genre: song.primaryGenreName,
        source: 'itunes'
      }));
    } catch (error) {
      console.error('iTunes search error:', error);
      return [];
    }
  }

  // Get song details from MusicBrainz (includes some tempo data)
  async getMusicBrainzData(artist, title) {
    try {
      const searchQuery = `artist:"${artist}" AND recording:"${title}"`;
      const response = await axios.get(`${this.musicBrainzBaseURL}/recording`, {
        params: {
          query: searchQuery,
          fmt: 'json',
          limit: 5
        }
      });

      if (response.data.recordings && response.data.recordings.length > 0) {
        const recording = response.data.recordings[0];
        return {
          mbid: recording.id,
          title: recording.title,
          length: recording.length ? Math.floor(recording.length / 1000) : null,
          disambiguation: recording.disambiguation
        };
      }
      return null;
    } catch (error) {
      console.error('MusicBrainz search error:', error);
      return null;
    }
  }

  // Estimate BPM based on genre and other factors (fallback method)
  estimateBPM(genre, duration) {
    const genreBPMRanges = {
      'Rock': { min: 120, max: 140, default: 130 },
      'Pop': { min: 120, max: 130, default: 125 },
      'Hip-Hop/Rap': { min: 70, max: 140, default: 100 },
      'Electronic': { min: 120, max: 180, default: 128 },
      'Dance': { min: 120, max: 140, default: 128 },
      'R&B/Soul': { min: 70, max: 120, default: 90 },
      'Country': { min: 120, max: 180, default: 140 },
      'Jazz': { min: 120, max: 200, default: 120 },
      'Classical': { min: 60, max: 180, default: 120 },
      'Blues': { min: 60, max: 120, default: 90 },
      'Reggae': { min: 60, max: 90, default: 75 },
      'Folk': { min: 100, max: 140, default: 120 },
      'Metal': { min: 140, max: 200, default: 160 },
      'Punk': { min: 150, max: 200, default: 180 },
      'Alternative': { min: 120, max: 160, default: 140 }
    };

    const range = genreBPMRanges[genre] || { min: 120, max: 140, default: 120 };
    
    // Add some variation based on song length
    let estimatedBPM = range.default;
    if (duration) {
      if (duration < 180) estimatedBPM += 10; // Shorter songs tend to be faster
      if (duration > 300) estimatedBPM -= 10; // Longer songs tend to be slower
    }

    return Math.max(range.min, Math.min(range.max, estimatedBPM));
  }

  // Get additional song data from Song.link API
  async getSongLinkData(artist, title) {
    try {
      const searchQuery = `${artist} ${title}`;
      const response = await axios.get('https://api.song.link/v1-alpha.1/links', {
        params: {
          q: searchQuery,
          userCountry: 'US'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Song.link API error:', error);
      return null;
    }
  }

  // Main search function that combines multiple APIs
  async searchSongs(query, limit = 10) {
    try {
      // Start with iTunes search as it's most reliable and fast
      const itunesResults = await this.searchSongsItunes(query, limit);
      
      // Enhance results with estimated BPM
      const enhancedResults = itunesResults.map((song) => {
        // Estimate BPM based on genre
        const estimatedBPM = this.estimateBPM(song.genre, song.duration);
        
        return {
          ...song,
          bpm: estimatedBPM,
          estimated_bpm: true, // Flag to indicate this is estimated
          confidence: this.calculateConfidence(song.genre, song.duration),
        };
      });

      return enhancedResults;
    } catch (error) {
      console.error('Song search error:', error);
      throw new Error('Failed to search songs. Please try again.');
    }
  }

  // Calculate confidence score for BPM estimation
  calculateConfidence(genre, duration) {
    let confidence = 0.6; // Base confidence for genre-based estimation
    
    // Well-known genres have higher confidence
    const reliableGenres = ['Rock', 'Pop', 'Electronic', 'Dance', 'Hip-Hop/Rap'];
    if (reliableGenres.includes(genre)) {
      confidence += 0.2;
    }
    
    // Songs with typical duration have higher confidence
    if (duration && duration >= 120 && duration <= 360) {
      confidence += 0.1;
    }
    
    return Math.min(0.9, confidence); // Cap at 90%
  }

  // Get popular songs by genre (for recommendations)
  async getPopularSongsByGenre(genre, limit = 10) {
    const genreQueries = {
      'Rock': 'rock classics',
      'Pop': 'pop hits',
      'Electronic': 'electronic music',
      'Hip-Hop': 'hip hop rap',
      'Jazz': 'jazz standards',
      'Classical': 'classical music',
      'Country': 'country music',
      'Blues': 'blues music'
    };

    const query = genreQueries[genre] || genre;
    return this.searchSongs(query, limit);
  }

  // Validate and format BPM for practice
  formatForPractice(song, targetBPM = null) {
    const baseBPM = targetBPM || song.bpm;
    
    return {
      id: Date.now(), // Generate new ID for our song list
      title: song.title,
      artist: song.artist,
      bpm: baseBPM,
      timeSignature: { value: '4/4', beats: 4, noteValue: 4 }, // Default to 4/4
      // No duration set - let users set it manually if desired
      genre: song.genre,
      original_bpm: song.bpm,
      estimated: song.estimated_bpm,
      confidence: song.confidence,
      source: song.source,
      artwork: song.artwork,
      notes: song.estimated_bpm ? `Estimated BPM based on ${song.genre} genre` : ''
    };
  }
}

const musicAPIService = new MusicAPIService();
export default musicAPIService;
