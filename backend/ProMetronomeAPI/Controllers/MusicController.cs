using Microsoft.AspNetCore.Mvc;
using ProMetronomeAPI.Models;
using ProMetronomeAPI.Services;

namespace ProMetronomeAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MusicController : ControllerBase
    {
        private readonly MusicService _musicService;
        private readonly ILogger<MusicController> _logger;

        public MusicController(MusicService musicService, ILogger<MusicController> logger)
        {
            _musicService = musicService;
            _logger = logger;
        }

        /// <summary>
        /// Search for songs with BPM and metadata
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<SearchResponse>> SearchSongs(
            [FromQuery] string query,
            [FromQuery] int limit = 20,
            [FromQuery] int offset = 0)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                    return BadRequest("Query is required");

                if (limit <= 0 || limit > 50)
                    return BadRequest("Limit must be between 1 and 50");

                if (offset < 0)
                    return BadRequest("Offset must be non-negative");

                var results = await _musicService.SearchSongsAsync(query, limit, offset);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error searching songs: {ex.Message}");
                return StatusCode(500, "An error occurred while searching for songs");
            }
        }

        /// <summary>
        /// Get detailed song information by ID
        /// </summary>
        [HttpGet("song/{id}")]
        public async Task<ActionResult<SongModel>> GetSong(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                    return BadRequest("Song ID is required");

                var song = await _musicService.GetSongByIdAsync(id);
                if (song == null)
                    return NotFound("Song not found");

                return Ok(song);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting song {id}: {ex.Message}");
                return StatusCode(500, "An error occurred while getting song details");
            }
        }

        /// <summary>
        /// Health check endpoint
        /// </summary>
        [HttpGet("health")]
        public ActionResult<object> HealthCheck()
        {
            return Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                version = "1.0.0",
                service = "ProMetronome Music API"
            });
        }
    }
}
