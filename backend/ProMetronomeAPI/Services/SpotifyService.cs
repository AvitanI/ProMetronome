using SpotifyAPI.Web;
using ProMetronomeAPI.Models;
using System.Text.Json;

namespace ProMetronomeAPI.Services
{
    public class SpotifyService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SpotifyService> _logger;
        private SpotifyClient? _spotifyClient;
        private readonly HttpClient _httpClient;

        public SpotifyService(IConfiguration configuration, ILogger<SpotifyService> logger, HttpClient httpClient)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClient;
        }

        private async Task<SpotifyClient> GetSpotifyClientAsync()
        {
            if (_spotifyClient == null)
            {
                var clientId = _configuration["Spotify:ClientId"];
                var clientSecret = _configuration["Spotify:ClientSecret"];

                if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
                {
                    throw new InvalidOperationException("Spotify credentials not configured");
                }

                var config = SpotifyClientConfig.CreateDefault()
                    .WithAuthenticator(new ClientCredentialsAuthenticator(clientId, clientSecret));

                _spotifyClient = new SpotifyClient(config);
                
                // Test the connection
                try
                {
                    await _spotifyClient.Search.Item(new SearchRequest(SearchRequest.Types.Track, "test") { Limit = 1 });
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Failed to authenticate with Spotify: {ex.Message}");
                    throw;
                }
            }

            return _spotifyClient;
        }

        public async Task<Models.SearchResponse> SearchSongsAsync(string query, int limit = 20, int offset = 0)
        {
            try
            {
                var spotify = await GetSpotifyClientAsync();
                
                var searchRequest = new SearchRequest(SearchRequest.Types.Track, query)
                {
                    Limit = Math.Min(limit, 50),
                    Offset = offset,
                    Market = "US" // Add market for better preview URL availability
                };

                var searchResult = await spotify.Search.Item(searchRequest);
                var tracks = searchResult.Tracks.Items ?? new List<FullTrack>();

                var songs = new List<SongModel>();

                // Get audio features for each track individually but efficiently
                var audioFeaturesDict = new Dictionary<string, TrackAudioFeatures>();
                try
                {
                    // Process tracks in smaller batches to avoid rate limits
                    for (int batchStart = 0; batchStart < tracks.Count; batchStart += 5)
                    {
                        var batchTracks = tracks.Skip(batchStart).Take(5);
                        var batchTasks = batchTracks.Select(async track =>
                        {
                            try
                            {
                                var audioFeatures = await spotify.Tracks.GetAudioFeatures(track.Id);
                                if (audioFeatures != null)
                                {
                                    return new { TrackId = track.Id, Features = audioFeatures };
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning($"Could not get audio features for track {track.Id}: {ex.Message}");
                            }
                            return null;
                        });

                        var batchResults = await Task.WhenAll(batchTasks);
                        foreach (var result in batchResults)
                        {
                            if (result?.Features != null)
                            {
                                audioFeaturesDict[result.TrackId] = result.Features;
                            }
                        }
                    }
                    
                    _logger.LogInformation($"Successfully retrieved audio features for {audioFeaturesDict.Count} out of {tracks.Count} tracks");
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Audio features batch processing failed: {ex.Message}");
                }

                foreach (var track in tracks)
                {
                    var song = new SongModel
                    {
                        Id = track.Id,
                        Title = track.Name,
                        Artist = string.Join(", ", track.Artists.Select(a => a.Name)),
                        Album = track.Album.Name,
                        ArtworkUrl = track.Album.Images?.FirstOrDefault()?.Url,
                        PreviewUrl = track.PreviewUrl, // Start with Spotify preview
                        Duration = track.DurationMs,
                        IsExplicit = track.Explicit,
                        Popularity = track.Popularity,
                        SpotifyUrl = track.ExternalUrls.ContainsKey("spotify") ? track.ExternalUrls["spotify"] : null
                    };

                    // If Spotify doesn't have a preview, try alternative sources
                    if (string.IsNullOrEmpty(song.PreviewUrl))
                    {
                        song.PreviewUrl = await GetPreviewFromAlternativeSource(song.Title, song.Artist);
                    }

                    // Add audio features if available
                    if (audioFeaturesDict.TryGetValue(track.Id, out var audioFeatures))
                    {
                        song.Bpm = Math.Round(audioFeatures.Tempo, 0, MidpointRounding.AwayFromZero);
                        song.AudioFeatures = new AudioFeatures
                        {
                            Tempo = audioFeatures.Tempo,
                            Energy = audioFeatures.Energy,
                            Danceability = audioFeatures.Danceability,
                            Valence = audioFeatures.Valence,
                            Acousticness = audioFeatures.Acousticness,
                            Instrumentalness = audioFeatures.Instrumentalness,
                            Liveness = audioFeatures.Liveness,
                            Speechiness = audioFeatures.Speechiness,
                            Key = audioFeatures.Key,
                            Mode = audioFeatures.Mode,
                            TimeSignature = audioFeatures.TimeSignature
                        };
                        
                        _logger.LogDebug($"Added audio features for {song.Title} - BPM: {song.Bpm}");
                    }
                    else
                    {
                        _logger.LogWarning($"No audio features available for track: {song.Title}");
                    }

                    songs.Add(song);
                }

                return new Models.SearchResponse
                {
                    Songs = songs,
                    Total = searchResult.Tracks.Total ?? 0,
                    Limit = limit,
                    Offset = offset
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error searching songs: {ex.Message}");
                throw;
            }
        }

        public async Task<SongModel?> GetSongByIdAsync(string spotifyId)
        {
            try
            {
                var spotify = await GetSpotifyClientAsync();
                var track = await spotify.Tracks.Get(spotifyId, new TrackRequest { Market = "US" });
                
                if (track == null) return null;

                var song = new SongModel
                {
                    Id = track.Id,
                    Title = track.Name,
                    Artist = string.Join(", ", track.Artists.Select(a => a.Name)),
                    Album = track.Album.Name,
                    ArtworkUrl = track.Album.Images?.FirstOrDefault()?.Url,
                    PreviewUrl = track.PreviewUrl,
                    Duration = track.DurationMs,
                    IsExplicit = track.Explicit,
                    Popularity = track.Popularity,
                    SpotifyUrl = track.ExternalUrls.ContainsKey("spotify") ? track.ExternalUrls["spotify"] : null
                };

                // Get audio features for BPM
                try
                {
                    var audioFeatures = await spotify.Tracks.GetAudioFeatures(spotifyId);
                    if (audioFeatures != null)
                    {
                        song.Bpm = Math.Round(audioFeatures.Tempo, 0, MidpointRounding.AwayFromZero);
                        song.AudioFeatures = new AudioFeatures
                        {
                            Tempo = audioFeatures.Tempo,
                            Energy = audioFeatures.Energy,
                            Danceability = audioFeatures.Danceability,
                            Valence = audioFeatures.Valence,
                            Acousticness = audioFeatures.Acousticness,
                            Instrumentalness = audioFeatures.Instrumentalness,
                            Liveness = audioFeatures.Liveness,
                            Speechiness = audioFeatures.Speechiness,
                            Key = audioFeatures.Key,
                            Mode = audioFeatures.Mode,
                            TimeSignature = audioFeatures.TimeSignature
                        };
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Could not get audio features for track {spotifyId}: {ex.Message}");
                }

                return song;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting song {spotifyId}: {ex.Message}");
                return null;
            }
        }

        private async Task<string?> GetPreviewFromAlternativeSource(string songTitle, string artist)
        {
            try
            {
                // Option 1: Try iTunes/Apple Music API (free, good coverage)
                var iTunesPreview = await GetITunesPreview(songTitle, artist);
                if (!string.IsNullOrEmpty(iTunesPreview))
                {
                    _logger.LogInformation($"Found iTunes preview for {songTitle} by {artist}");
                    return iTunesPreview;
                }

                // Option 2: Try YouTube Music API (requires setup)
                // var youTubePreview = await GetYouTubeMusicPreview(songTitle, artist);
                // if (!string.IsNullOrEmpty(youTubePreview)) return youTubePreview;

                // Option 3: Try Deezer API (free, good for European music)
                var deezerPreview = await GetDeezerPreview(songTitle, artist);
                if (!string.IsNullOrEmpty(deezerPreview))
                {
                    _logger.LogInformation($"Found Deezer preview for {songTitle} by {artist}");
                    return deezerPreview;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Failed to get alternative preview for {songTitle}: {ex.Message}");
                return null;
            }
        }

        private async Task<string?> GetITunesPreview(string songTitle, string artist)
        {
            try
            {
                var searchQuery = Uri.EscapeDataString($"{songTitle} {artist}");
                var iTunesUrl = $"https://itunes.apple.com/search?term={searchQuery}&media=music&entity=song&limit=1";
                
                var response = await _httpClient.GetStringAsync(iTunesUrl);
                var iTunesData = JsonSerializer.Deserialize<JsonElement>(response);
                
                if (iTunesData.TryGetProperty("results", out var results) && 
                    results.GetArrayLength() > 0)
                {
                    var firstResult = results[0];
                    if (firstResult.TryGetProperty("previewUrl", out var previewUrl))
                    {
                        return previewUrl.GetString();
                    }
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogDebug($"iTunes API failed for {songTitle}: {ex.Message}");
                return null;
            }
        }

        private async Task<string?> GetDeezerPreview(string songTitle, string artist)
        {
            try
            {
                var searchQuery = Uri.EscapeDataString($"{artist} {songTitle}");
                var deezerUrl = $"https://api.deezer.com/search?q={searchQuery}&limit=1";
                
                var response = await _httpClient.GetStringAsync(deezerUrl);
                var deezerData = JsonSerializer.Deserialize<JsonElement>(response);
                
                if (deezerData.TryGetProperty("data", out var data) && 
                    data.GetArrayLength() > 0)
                {
                    var firstResult = data[0];
                    if (firstResult.TryGetProperty("preview", out var preview))
                    {
                        var previewUrl = preview.GetString();
                        // Deezer previews are usually 30 seconds
                        return !string.IsNullOrEmpty(previewUrl) ? previewUrl : null;
                    }
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogDebug($"Deezer API failed for {songTitle}: {ex.Message}");
                return null;
            }
        }

        // YouTube Music API method (requires setup)
        private Task<string?> GetYouTubeMusicPreview(string songTitle, string artist)
        {
            // This would require YouTube Data API v3 key
            // Implementation would search YouTube for official audio and extract preview
            // More complex but has best coverage
            return Task.FromResult<string?>(null);
        }
    }
}
