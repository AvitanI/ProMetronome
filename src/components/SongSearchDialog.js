import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  MusicNote as MusicNoteIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
  Album as AlbumIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import useMetronomeStore from '../stores/metronomeStore';
import musicAPI from '../services/musicAPI';

const SongSearchDialog = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playingPreview, setPlayingPreview] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const searchTimeoutRef = useRef(null);
  
  const { addSong, songs } = useMetronomeStore();

  // Debounced search function
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) return;

      setLoading(true);
      setError(null);
      
      try {
        const results = await musicAPI.searchSongs(searchQuery, 15);
        setSearchResults(results);
      } catch (err) {
        setError(err.message || 'Failed to search songs');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery.trim().length > 2) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for search
      searchTimeoutRef.current = setTimeout(() => {
        performSearch();
      }, 500);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleAddSong = (song) => {
    // Check if song already exists before adding
    if (isSongAlreadyAdded(song)) {
      setError('This song is already in your song list!');
      return;
    }

    const formattedSong = musicAPI.formatForPractice(song);
    addSong(formattedSong);
    
    // Show success feedback
    setError(null);
    
    // Optional: Close dialog after adding
    // onClose();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return 'High confidence';
    if (confidence >= 0.6) return 'Medium confidence';
    return 'Low confidence';
  };

  const isSongAlreadyAdded = (song) => {
    return songs.some(existingSong => 
      existingSong.title?.toLowerCase() === song.title?.toLowerCase() &&
      existingSong.artist?.toLowerCase() === song.artist?.toLowerCase()
    );
  };

  const handlePreviewPlay = (song) => {
    if (!song.preview_url) {
      setError('No preview available for this song');
      return;
    }

    // If currently playing, stop it
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    // If clicking on the same song that's playing, just stop
    if (playingPreview === song.id) {
      setPlayingPreview(null);
      setAudioElement(null);
      return;
    }

    // Create new audio element and play
    const audio = new Audio(song.preview_url);
    audio.volume = 0.7;
    
    audio.addEventListener('ended', () => {
      setPlayingPreview(null);
      setAudioElement(null);
    });

    audio.addEventListener('error', () => {
      setError('Failed to load preview');
      setPlayingPreview(null);
      setAudioElement(null);
    });

    audio.play().then(() => {
      setPlayingPreview(song.id);
      setAudioElement(audio);
    }).catch(() => {
      setError('Failed to play preview');
      setPlayingPreview(null);
      setAudioElement(null);
    });
  };

  // Cleanup audio when dialog closes
  useEffect(() => {
    if (!open && audioElement) {
      audioElement.pause();
      setPlayingPreview(null);
      setAudioElement(null);
    }
  }, [open, audioElement]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon color="primary" />
          Search Songs & BPM
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Search Input */}
        <TextField
          fullWidth
          placeholder="Search for songs, artists, or albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            BPM values are estimated based on genre and song characteristics. 
            You can adjust the BPM after adding to your song list.
          </Typography>
        </Alert>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Search Results */}
        {!loading && searchResults.length > 0 && (
          <List sx={{ maxHeight: '50vh', overflow: 'auto' }}>
            {searchResults.map((song, index) => (
              <ListItem
                key={`${song.id}-${index}`}
                sx={{
                  border: '1px solid',
                  borderColor: playingPreview === song.id ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  mb: 2,
                  p: 2,
                  backgroundColor: playingPreview === song.id ? 'action.selected' : 'background.paper',
                  boxShadow: playingPreview === song.id 
                    ? '0 4px 12px rgba(25, 118, 210, 0.15)' 
                    : '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: playingPreview === song.id ? 'action.selected' : 'action.hover',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <ListItemAvatar>
                  <Box 
                    sx={{ 
                      position: 'relative',
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      '&:hover .play-overlay': {
                        opacity: song.preview_url ? 1 : 0,
                      }
                    }}
                  >
                    <Avatar
                      src={song.artwork}
                      variant="rounded"
                      sx={{ 
                        width: '100%', 
                        height: '100%',
                        borderRadius: 2,
                        fontSize: '1.5rem'
                      }}
                    >
                      <AlbumIcon sx={{ fontSize: '2rem', color: 'text.secondary' }} />
                    </Avatar>
                    
                    {/* Preview Play Button Overlay */}
                    {song.preview_url && (
                      <Box
                        className="play-overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          opacity: playingPreview === song.id ? 1 : 0,
                          transition: 'opacity 0.2s ease-in-out',
                          cursor: 'pointer',
                        }}
                        onClick={() => handlePreviewPlay(song)}
                      >
                        <IconButton
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            color: 'primary.main',
                            width: 36,
                            height: 36,
                            '&:hover': {
                              backgroundColor: 'white',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                          size="small"
                        >
                          {playingPreview === song.id ? (
                            <PauseIcon fontSize="small" />
                          ) : (
                            <PlayArrowIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    )}
                    
                    {/* Playing Indicator */}
                    {playingPreview === song.id && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 4,
                          right: 4,
                          backgroundColor: 'primary.main',
                          borderRadius: '50%',
                          width: 12,
                          height: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            '@keyframes pulse': {
                              '0%': {
                                transform: 'scale(0.8)',
                                opacity: 1,
                              },
                              '50%': {
                                transform: 'scale(1.2)',
                                opacity: 0.7,
                              },
                              '100%': {
                                transform: 'scale(0.8)',
                                opacity: 1,
                              },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </ListItemAvatar>
                
                <ListItemText
                  sx={{ ml: 2 }}
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {song.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        by {song.artist}
                      </Typography>
                      {song.album && (
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          from {song.album}
                        </Typography>
                      )}
                      
                      {/* Song Details Chips */}
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<SpeedIcon />}
                          label={`${song.bpm} BPM`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        
                        {song.duration && (
                          <Chip
                            icon={<ScheduleIcon />}
                            label={formatDuration(song.duration)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        
                        {song.genre && (
                          <Chip
                            label={song.genre}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        
                        {song.estimated_bpm && (
                          <Tooltip title={getConfidenceText(song.confidence)}>
                            <Chip
                              icon={<InfoIcon />}
                              label="Estimated"
                              size="small"
                              color={getConfidenceColor(song.confidence)}
                              variant="outlined"
                            />
                          </Tooltip>
                        )}
                        
                        {playingPreview === song.id && (
                          <Chip
                            icon={<PlayArrowIcon />}
                            label="Playing Preview"
                            size="small"
                            color="primary"
                            variant="filled"
                          />
                        )}
                        
                        {song.preview_url && playingPreview !== song.id && (
                          <Chip
                            icon={<PlayArrowIcon />}
                            label="Preview Available"
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        )}
                      </Box>
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
                
                <ListItemSecondaryAction>
                  {isSongAlreadyAdded(song) ? (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        px: 2,
                        py: 1,
                        backgroundColor: 'success.light',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'success.main',
                      }}
                    >
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography 
                        variant="body2" 
                        color="success.dark" 
                        fontWeight="medium"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        ADDED
                      </Typography>
                    </Box>
                  ) : (
                    <Tooltip title="Add to Song List">
                      <IconButton
                        edge="end"
                        color="primary"
                        onClick={() => handleAddSong(song)}
                        sx={{
                          backgroundColor: 'primary.light',
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'white',
                            transform: 'scale(1.05)',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <List>
            {[...Array(5)].map((_, index) => (
              <ListItem key={index} sx={{ mb: 1 }}>
                <ListItemAvatar>
                  <Skeleton variant="rectangular" width={56} height={56} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton variant="text" width="60%" />}
                  secondary={
                    <Box>
                      <Skeleton variant="text" width="40%" />
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Skeleton variant="rectangular" width={80} height={24} />
                        <Skeleton variant="rectangular" width={60} height={24} />
                        <Skeleton variant="rectangular" width={50} height={24} />
                      </Box>
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            ))}
          </List>
        )}

        {/* No Results */}
        {!loading && searchQuery.trim().length > 2 && searchResults.length === 0 && !error && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <MusicNoteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No songs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try searching with different keywords
            </Typography>
          </Box>
        )}

        {/* Initial State */}
        {!loading && searchQuery.trim().length <= 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Search for Songs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter at least 3 characters to start searching
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SongSearchDialog;
