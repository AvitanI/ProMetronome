namespace ProMetronomeAPI.Models
{
    public class SongModel
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string Album { get; set; } = string.Empty;
        public string? Genre { get; set; }
        public double? Bpm { get; set; }
        public string? ArtworkUrl { get; set; }
        public string? PreviewUrl { get; set; }
        public int? Duration { get; set; }
        public bool IsExplicit { get; set; }
        public int? Popularity { get; set; }
        public string? SpotifyUrl { get; set; }
        public AudioFeatures? AudioFeatures { get; set; }
    }

    public class AudioFeatures
    {
        public double Tempo { get; set; }
        public double Energy { get; set; }
        public double Danceability { get; set; }
        public double Valence { get; set; }
        public double Acousticness { get; set; }
        public double Instrumentalness { get; set; }
        public double Liveness { get; set; }
        public double Speechiness { get; set; }
        public int Key { get; set; }
        public int Mode { get; set; }
        public int TimeSignature { get; set; }
    }

    public class SearchResponse
    {
        public List<SongModel> Songs { get; set; } = new();
        public int Total { get; set; }
        public int Limit { get; set; }
        public int Offset { get; set; }
    }
}
