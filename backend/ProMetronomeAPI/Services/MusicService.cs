using ProMetronomeAPI.Models;

namespace ProMetronomeAPI.Services
{
    public class MusicService
    {
        private readonly ILogger<MusicService> _logger;
        private readonly IConfiguration _configuration;
        private readonly SpotifyService _spotifyService;

        public MusicService(ILogger<MusicService> logger, IConfiguration configuration, SpotifyService spotifyService)
        {
            _logger = logger;
            _configuration = configuration;
            _spotifyService = spotifyService;
        }

        public async Task<Models.SearchResponse> SearchSongsAsync(string query, int limit = 20, int offset = 0)
        {
            // Check if Spotify is configured
            var clientId = _configuration["Spotify:ClientId"];
            var clientSecret = _configuration["Spotify:ClientSecret"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret) ||
                clientId == "YOUR_SPOTIFY_CLIENT_ID_HERE" || clientSecret == "YOUR_SPOTIFY_CLIENT_SECRET_HERE")
            {
                _logger.LogWarning("Spotify credentials not configured, using enhanced demo data");
                return await GetEnhancedDemoSearchResults(query, limit, offset);
            }

            // Try to use Spotify API
            try
            {
                _logger.LogInformation("Using Spotify API for song search");
                var spotifyResult = await _spotifyService.SearchSongsAsync(query, limit, offset);
                
                // Check if we got any results with BPM data
                var songsWithBpm = spotifyResult.Songs.Where(s => s.Bpm.HasValue).Count();
                
                if (songsWithBpm == 0 && spotifyResult.Songs.Any())
                {
                    _logger.LogWarning("Spotify API returned songs but no BPM data available (likely audio features access issue). Consider requesting extended quota from Spotify for Audio Features API.");
                    
                    // Enhance Spotify results with estimated BPM based on genre/characteristics
                    foreach (var song in spotifyResult.Songs)
                    {
                        song.Bpm = EstimateBpmFromSongData(song);
                    }
                }
                
                return spotifyResult;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Spotify API error: {ex.Message}, falling back to demo data");
                return await GetEnhancedDemoSearchResults(query, limit, offset);
            }
        }

        private double EstimateBpmFromSongData(SongModel song)
        {
            // Basic BPM estimation based on song characteristics
            // This is a fallback when audio features aren't available
            
            var title = song.Title?.ToLower() ?? "";
            var artist = song.Artist?.ToLower() ?? "";
            
            double estimatedBpm;
            
            // Pop/Dance music typically ranges 120-140 BPM
            if (title.Contains("dance") || title.Contains("party") || title.Contains("beat"))
                estimatedBpm = 128 + (new Random().NextDouble() * 12); // 128-140
            // Ballads typically 60-90 BPM
            else if (title.Contains("love") || title.Contains("heart") || title.Contains("slow"))
                estimatedBpm = 70 + (new Random().NextDouble() * 20); // 70-90
            // Rock/Energetic songs 140-160 BPM
            else if (title.Contains("rock") || title.Contains("fire") || title.Contains("fast") || 
                artist.Contains("rock") || song.Popularity > 85)
                estimatedBpm = 140 + (new Random().NextDouble() * 20); // 140-160
            // Default pop range
            else
                estimatedBpm = 110 + (new Random().NextDouble() * 30); // 110-140
                
            // Round to nearest integer (>= 0.5 rounds up, < 0.5 rounds down)
            return Math.Round(estimatedBpm, 0, MidpointRounding.AwayFromZero);
        }

        private async Task<Models.SearchResponse> GetEnhancedDemoSearchResults(string query, int limit, int offset)
        {
            await Task.Delay(100); // Simulate API call

            var allDemoSongs = new List<SongModel>
            {
                new SongModel
                {
                    Id = "demo_blinding_lights",
                    Title = "Blinding Lights",
                    Artist = "The Weeknd",
                    Album = "After Hours",
                    Genre = "Pop",
                    Bpm = 171,
                    ArtworkUrl = "https://via.placeholder.com/300x300/1DB954/ffffff?text=Blinding+Lights",
                    PreviewUrl = null,
                    Duration = 200040,
                    IsExplicit = false,
                    Popularity = 95,
                    AudioFeatures = new AudioFeatures
                    {
                        Tempo = 171,
                        Energy = 0.73,
                        Danceability = 0.51,
                        Valence = 0.33
                    }
                },
                new SongModel
                {
                    Id = "demo_good_4_u",
                    Title = "Good 4 U",
                    Artist = "Olivia Rodrigo",
                    Album = "SOUR",
                    Genre = "Pop Rock",
                    Bpm = 166,
                    ArtworkUrl = "https://via.placeholder.com/300x300/FF6B6B/ffffff?text=Good+4+U",
                    PreviewUrl = null,
                    Duration = 178013,
                    IsExplicit = false,
                    Popularity = 89,
                    AudioFeatures = new AudioFeatures
                    {
                        Tempo = 166,
                        Energy = 0.66,
                        Danceability = 0.56,
                        Valence = 0.43
                    }
                },
                new SongModel
                {
                    Id = "demo_levitating",
                    Title = "Levitating",
                    Artist = "Dua Lipa",
                    Album = "Future Nostalgia",
                    Genre = "Dance Pop",
                    Bpm = 103,
                    ArtworkUrl = "https://via.placeholder.com/300x300/9B59B6/ffffff?text=Levitating",
                    PreviewUrl = null,
                    Duration = 203000,
                    IsExplicit = false,
                    Popularity = 88,
                    AudioFeatures = new AudioFeatures
                    {
                        Tempo = 103,
                        Energy = 0.82,
                        Danceability = 0.88,
                        Valence = 0.85
                    }
                },
                new SongModel
                {
                    Id = "demo_watermelon_sugar",
                    Title = "Watermelon Sugar",
                    Artist = "Harry Styles",
                    Album = "Fine Line",
                    Genre = "Pop Rock",
                    Bpm = 95,
                    ArtworkUrl = "https://via.placeholder.com/300x300/E74C3C/ffffff?text=Watermelon+Sugar",
                    PreviewUrl = null,
                    Duration = 174000,
                    IsExplicit = false,
                    Popularity = 92,
                    AudioFeatures = new AudioFeatures
                    {
                        Tempo = 95,
                        Energy = 0.54,
                        Danceability = 0.73,
                        Valence = 0.56
                    }
                },
                new SongModel
                {
                    Id = "demo_shape_of_you",
                    Title = "Shape of You",
                    Artist = "Ed Sheeran",
                    Album = "÷ (Divide)",
                    Genre = "Pop",
                    Bpm = 96,
                    ArtworkUrl = "https://via.placeholder.com/300x300/3498DB/ffffff?text=Shape+of+You",
                    PreviewUrl = null,
                    Duration = 233000,
                    IsExplicit = false,
                    Popularity = 90,
                    AudioFeatures = new AudioFeatures
                    {
                        Tempo = 96,
                        Energy = 0.65,
                        Danceability = 0.83,
                        Valence = 0.93
                    }
                },
                new SongModel
                {
                    Id = "demo_happier",
                    Title = "Happier",
                    Artist = "Marshmello, Bastille",
                    Album = "Happier",
                    Genre = "Electronic",
                    Bpm = 100,
                    ArtworkUrl = "https://via.placeholder.com/300x300/2ECC71/ffffff?text=Happier",
                    PreviewUrl = null,
                    Duration = 214000,
                    IsExplicit = false,
                    Popularity = 85,
                    AudioFeatures = new AudioFeatures
                    {
                        Tempo = 100,
                        Energy = 0.69,
                        Danceability = 0.59,
                        Valence = 0.67
                    }
                }
            };

            // Filter songs based on query
            var filteredSongs = allDemoSongs.Where(song =>
                song.Title.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                song.Artist.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                song.Album.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                (song.Genre?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false)
            ).Skip(offset).Take(limit).ToList();

            return new Models.SearchResponse
            {
                Songs = filteredSongs,
                Total = filteredSongs.Count,
                Limit = limit,
                Offset = offset
            };
        }

        public async Task<SongModel?> GetSongByIdAsync(string id)
        {
            // Check if Spotify is configured
            var clientId = _configuration["Spotify:ClientId"];
            var clientSecret = _configuration["Spotify:ClientSecret"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret) ||
                clientId == "YOUR_SPOTIFY_CLIENT_ID_HERE" || clientSecret == "YOUR_SPOTIFY_CLIENT_SECRET_HERE")
            {
                _logger.LogWarning("Spotify credentials not configured, using demo data");
                return await GetDemoSongById(id);
            }

            // Try to use Spotify API
            try
            {
                _logger.LogInformation($"Using Spotify API to get song {id}");
                var spotifySong = await _spotifyService.GetSongByIdAsync(id);
                if (spotifySong != null)
                {
                    return spotifySong;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Spotify API error getting song {id}: {ex.Message}, falling back to demo data");
            }

            // Fallback to demo data
            return await GetDemoSongById(id);
        }

        private async Task<SongModel?> GetDemoSongById(string id)
        {
            await Task.Delay(50);

            // Get all demo songs and find by ID
            var demoResponse = await GetEnhancedDemoSearchResults("", 100, 0);
            return demoResponse.Songs.FirstOrDefault(s => s.Id == id);
        }
    }
}
