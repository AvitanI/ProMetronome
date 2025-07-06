# ProMetronome - Full Stack Setup Guide

## 🎯 Project Overview

**ProMetronome** is a modern, full-stack web application that helps musicians find songs with specific BPM (beats per minute) for practice. The app uses the Spotify Web API to provide accurate tempo data and rich music metadata.

## 🏗 Architecture

```
ProMetronome/
├── frontend/          # React app with modern UI
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API integration
│   │   └── stores/        # State management
│   ├── public/
│   └── package.json
├── backend/           # .NET 9 Web API
│   └── ProMetronomeAPI/
│       ├── Controllers/   # API endpoints
│       ├── Models/        # Data models
│       ├── Services/      # Business logic + Spotify integration
│       └── Program.cs
└── SETUP.md
```

## ✨ Key Features

### 🎵 Spotify Integration
- ✅ **Real-time song search** via Spotify Web API
- ✅ **Professional BPM data** from Spotify Audio Features
- ✅ **Rich metadata**: artist, album, artwork, popularity, duration
- ✅ **Audio analysis**: energy, danceability, valence, acousticness
- ✅ **30-second preview URLs** for listening
- ✅ **Graceful fallback** to demo data when API unavailable

### � Robust Architecture
- ✅ **Demo mode**: Works without Spotify credentials for testing
- ✅ **Error handling**: Graceful degradation and user-friendly messages
- ✅ **CORS configured**: No browser restrictions for API calls
- ✅ **Type safety**: Strong typing in both frontend and backend
- ✅ **Modern tech stack**: React + .NET 9 + Spotify Web API

## �🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (for React frontend)
- **.NET 9 SDK** (for backend API)
- **Spotify Developer Account** (optional, has demo mode)

### 1. Backend Setup (.NET 9 API)

```bash
# Navigate to backend
cd backend/ProMetronomeAPI

# Install dependencies
dotnet restore

# Run with demo data (works immediately)
dotnet run

# Or configure real Spotify credentials:
# Edit appsettings.json or appsettings.Development.json:
{
  "Spotify": {
    "ClientId": "your_spotify_client_id_here",
    "ClientSecret": "your_spotify_client_secret_here"
  }
}
```

**Backend URL:** `http://localhost:5136`

**Test the API:**
```bash
# Health check
curl http://localhost:5136/api/music/health

# Search demo data
curl "http://localhost:5136/api/music/search?query=blinding"
```

### 2. Frontend Setup (React)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

**Frontend URL:** `http://localhost:3000`

**Note:** The frontend automatically detects if the backend is available and falls back to demo mode if needed.

## 🎵 Spotify Integration Status

### ✅ **COMPLETED**: Full Spotify Web API Integration

The backend now includes a complete `SpotifyService` that:

- **🔍 Search Songs**: Real-time search using Spotify's catalog
- **📊 BPM Data**: Professional tempo data from Spotify Audio Features  
- **🎨 Rich Metadata**: Artist, album, artwork, popularity, explicit flag
- **🎧 Audio Features**: Energy, danceability, valence, acousticness, etc.
- **🔗 Preview URLs**: 30-second song previews
- **🛡 Error Handling**: Graceful fallback to demo data

### Demo Mode vs. Live Mode

**Demo Mode** (default - no setup required):
- Uses curated demo data with realistic BPM values
- 6 popular songs with full metadata
- Perfect for testing and development
- No API limits or authentication needed

**Live Mode** (with Spotify credentials):
- Searches Spotify's entire catalog (80+ million songs)
- Real-time BPM data from audio analysis
- Professional accuracy for tempo detection
- 2,000 requests/hour rate limit (very generous)

### Getting Spotify Credentials:

1. **Go to**: [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. **Create App**: Click "Create app" 
3. **App Settings**: Use any name, description, redirect URI
4. **Get Credentials**: Copy Client ID and Client Secret
5. **Add to Config**: Update `appsettings.json` or `appsettings.Development.json`

```json
{
  "Spotify": {
    "ClientId": "your_real_client_id_here",
    "ClientSecret": "your_real_client_secret_here"
  }
}
```

6. **Restart Backend**: The API will automatically use Spotify for searches

## 🛠 API Endpoints

### Music Search
```http
GET /api/music/search?query=blinding+lights&limit=20&offset=0
```

**Response:**
```json
{
  "songs": [
    {
      "id": "4iV5W9uYEdYUVa79Axb7Rh",
      "title": "Blinding Lights", 
      "artist": "The Weeknd",
      "album": "After Hours",
      "bpm": 171.0,
      "artworkUrl": "https://i.scdn.co/image/...",
      "previewUrl": "https://p.scdn.co/mp3-preview/...",
      "duration": 200040,
      "popularity": 95,
      "audioFeatures": {
        "tempo": 171.0,
        "energy": 0.73,
        "danceability": 0.51,
        "valence": 0.33
      }
    }
  ],
  "total": 2847,
  "limit": 20,
  "offset": 0
}
```

### Song Details
```http
GET /api/music/song/{spotify_id}
```

### Health Check
```http
GET /api/music/health
```

## 🔧 Development

### Backend Development
```bash
cd backend/ProMetronomeAPI

# Hot reload for development
dotnet watch run

# View logs in real-time
# The backend logs show:
# - "Using Spotify API for song search" (when credentials configured)
# - "Spotify credentials not configured, using demo data" (demo mode)
# - "Spotify API error: [error], falling back to demo data" (fallback)
```

### Frontend Development
```bash
cd frontend

# Hot reload enabled
npm start

# The frontend automatically:
# - Tries to connect to backend at http://localhost:5136
# - Falls back to built-in demo mode if backend unavailable
# - Shows connection status in UI
```

## 🧪 Testing the Integration

### Test Demo Mode
```bash
# Start backend with placeholder credentials (default)
cd backend/ProMetronomeAPI && dotnet run

# Test search
curl "http://localhost:5136/api/music/search?query=blinding"
# Should return demo song "Blinding Lights"
```

### Test Spotify Mode
```bash
# Add real Spotify credentials to appsettings.Development.json
# Restart backend
cd backend/ProMetronomeAPI && dotnet run

# Test search
curl "http://localhost:5136/api/music/search?query=taylor+swift"
# Should return real Spotify results with BPM data
```

### Test Fallback Behavior
```bash
# Add fake credentials to appsettings.Development.json
# Backend will try Spotify, fail, then use demo data
# Check logs for "Spotify API error: invalid_client, falling back to demo data"
```

## 📦 Production Deployment

### Backend (ASP.NET Core)
```bash
cd backend/ProMetronomeAPI
dotnet publish -c Release -o ./publish
```

### Frontend (React)
```bash
cd frontend
npm run build
```

## 🆘 Troubleshooting

### Backend Issues
- **Port 7105 in use**: Change port in `Properties/launchSettings.json`
- **Spotify API errors**: Verify credentials in `appsettings.json`
- **CORS errors**: Ensure frontend URL is in CORS policy

### Frontend Issues
- **API connection failed**: Check backend is running on http://localhost:5136
- **Demo mode active**: Backend unavailable, using fallback data

## ✨ Features

## ✨ What's Completed

### 🎯 **Migration to .NET Backend - DONE**
- ✅ Project restructured into `frontend/` and `backend/` 
- ✅ .NET 9 Web API with proper CORS configuration
- ✅ React frontend updated to use backend endpoints
- ✅ All existing functionality preserved

### 🎵 **Spotify Integration - DONE**  
- ✅ Complete SpotifyService with SpotifyAPI.Web package
- ✅ Real BPM data from Spotify Audio Features API
- ✅ Rich metadata: artist, album, artwork, popularity
- ✅ Audio analysis: energy, danceability, valence, etc.
- ✅ Search Spotify's full catalog (80+ million songs)
- ✅ 30-second preview URLs for listening

### 🛡 **Robust Demo Mode - DONE**
- ✅ Enhanced demo data with 6 realistic songs
- ✅ Professional BPM values and metadata  
- ✅ Graceful fallback when Spotify unavailable
- ✅ No setup required - works immediately
- ✅ Perfect for development and testing

### 🔧 **Error Handling - DONE**
- ✅ Automatic fallback from Spotify to demo data
- ✅ Comprehensive logging for debugging
- ✅ User-friendly error messages
- ✅ No crashes when API credentials invalid

### 📱 **Frontend Integration - DONE**
- ✅ Frontend detects backend availability
- ✅ Seamless switching between live and demo mode
- ✅ Real-time BPM display from backend data
- ✅ All existing UI functionality preserved

## 🚀 Next Steps (Optional)

### 🔲 **Production Enhancements**
- Add request caching for better performance
- Implement user authentication for playlists
- Add recommendation system based on BPM/audio features
- Deploy to cloud (Azure App Service + Static Web Apps)

### � **Advanced Features**  
- Playlist creation and management
- BPM-based song recommendations
- Audio feature filtering (energy, danceability)
- Integration with other music services

## 📊 **Current Status: PRODUCTION READY**

The ProMetronome app is now fully functional with:
- ✅ Modern full-stack architecture
- ✅ Professional Spotify integration
- ✅ Robust demo mode for immediate use
- ✅ Comprehensive error handling
- ✅ Mobile-responsive UI
- ✅ Ready for deployment

**To use right now:**
1. `cd backend/ProMetronomeAPI && dotnet run`
2. `cd frontend && npm start` 
3. Open http://localhost:3000
4. Search for songs and get real BPM data!
