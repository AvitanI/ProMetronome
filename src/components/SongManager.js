import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Stack,
  Fab,
  useMediaQuery,
  Divider,
  Alert,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  Search,
  MusicNote,
  Timer,
  Clear,
  CloudDownload,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useMetronomeStore, { TIME_SIGNATURES } from '../stores/metronomeStore';
import SongSearchDialog from './SongSearchDialog';

const SongManager = ({ onPlaySong }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    songs,
    currentSong,
    addSong,
    updateSong,
    deleteSong,
    loadSong,
    bpm,
    timeSignature,
  } = useMetronomeStore();

  const [open, setOpen] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bpm: 120,
    timeSignature: TIME_SIGNATURES[0],
    duration: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  // Filter songs based on search query
  const filteredSongs = songs.filter(song =>
    (song.name || song.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.artist || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.genre || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle dialog open
  const handleOpen = (song = null) => {
    if (song) {
      setEditingSong(song);
      setFormData({
        name: song.name || song.title || '', // Handle both name and title properties
        bpm: song.bpm,
        timeSignature: song.timeSignature,
        duration: song.duration || '',
        notes: song.notes || '',
      });
    } else {
      setEditingSong(null);
      setFormData({
        name: '',
        bpm: bpm,
        timeSignature: timeSignature,
        duration: '',
        notes: '',
      });
    }
    setErrors({});
    setOpen(true);
  };

  // Handle dialog close
  const handleClose = () => {
    setOpen(false);
    setEditingSong(null);
    setFormData({
      name: '',
      bpm: 120,
      timeSignature: TIME_SIGNATURES[0],
      duration: '',
      notes: '',
    });
    setErrors({});
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Song name is required';
    }
    
    if (formData.bpm < 30 || formData.bpm > 300) {
      newErrors.bpm = 'BPM must be between 30 and 300';
    }
    
    if (formData.duration && (formData.duration < 10 || formData.duration > 3600)) {
      newErrors.duration = 'Duration must be between 10 and 3600 seconds';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) return;

    const songData = {
      name: (formData.name || '').trim(),
      bpm: parseInt(formData.bpm),
      timeSignature: formData.timeSignature,
      duration: formData.duration ? parseInt(formData.duration) : null,
      notes: (formData.notes || '').trim() || null,
      createdAt: editingSong?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingSong) {
      updateSong(editingSong.id, songData);
    } else {
      addSong(songData);
    }

    handleClose();
  };

  // Handle delete
  const handleDelete = (songId) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      deleteSong(songId);
    }
  };

  // Handle play song
  const handlePlaySong = (song) => {
    loadSong(song);
    
    // Scroll to metronome and start playing
    if (onPlaySong) {
      onPlaySong();
    }
  };

  // Format duration for display
  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card elevation={6}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" component="h2" fontWeight="bold">
            <MusicNote sx={{ mr: 1, verticalAlign: 'middle' }} />
            Songs
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Search Online Songs">
              <Fab
                size="medium"
                color="secondary"
                onClick={() => setSearchDialogOpen(true)}
                sx={{ 
                  boxShadow: `0 4px 12px ${theme.palette.secondary.main}33`,
                }}
              >
                <CloudDownload />
              </Fab>
            </Tooltip>
            
            <Tooltip title="Add New Song">
              <Fab
                size="medium"
                color="primary"
                onClick={() => handleOpen()}
                sx={{ 
                  boxShadow: `0 4px 12px ${theme.palette.primary.main}33`,
                }}
              >
                <Add />
              </Fab>
            </Tooltip>
          </Box>
        </Box>

        {/* Search */}
        {songs.length > 0 && (
          <TextField
            fullWidth
            size="small"
            placeholder="Search songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}

        {/* Songs List */}
        {filteredSongs.length === 0 ? (
          <Alert 
            severity="info" 
            sx={{ 
              textAlign: 'center',
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            {songs.length === 0 
              ? 'No songs saved yet. Create your first song!' 
              : 'No songs match your search.'
            }
          </Alert>
        ) : (
          <List disablePadding>
            {filteredSongs.map((song, index) => (
              <React.Fragment key={song.id}>
                <ListItem
                  sx={{
                    bgcolor: currentSong?.id === song.id ? theme.palette.action.selected : 'transparent',
                    borderRadius: 1,
                    mb: 1,
                    border: currentSong?.id === song.id ? `2px solid ${theme.palette.primary.main}` : 'none',
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {song.title || song.name}
                        </Typography>
                        {song.artist && (
                          <Typography variant="body2" color="text.secondary">
                            by {song.artist}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={0.5}>
                          <Chip 
                            label={`${song.bpm} BPM`} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                          <Chip 
                            label={song.timeSignature.value} 
                            size="small" 
                            variant="outlined"
                          />
                          {song.duration && (
                            <Chip 
                              label={formatDuration(song.duration)}
                              size="small" 
                              color="secondary"
                              variant="outlined"
                              icon={<Timer />}
                            />
                          )}
                        </Stack>
                      </Box>
                    }
                    secondary={song.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {song.notes}
                      </Typography>
                    )}
                    primaryTypographyProps={{ component: 'div' }}
                  />
                  
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Load Song">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handlePlaySong(song)}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Edit Song">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpen(song)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete Song">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDelete(song.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                
                {index < filteredSongs.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Add/Edit Song Dialog */}
        <Dialog 
          open={open} 
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            {editingSong ? 'Edit Song' : 'Add New Song'}
          </DialogTitle>
          
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Song Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!errors.name}
                helperText={errors.name}
                fullWidth
                required
              />
              
              <TextField
                label="BPM"
                type="number"
                value={formData.bpm}
                onChange={(e) => setFormData({ ...formData, bpm: parseInt(e.target.value) || 0 })}
                error={!!errors.bpm}
                helperText={errors.bpm || 'Between 30 and 300'}
                fullWidth
                required
                inputProps={{ min: 30, max: 300 }}
              />
              
              <FormControl fullWidth>
                <InputLabel>Time Signature</InputLabel>
                <Select
                  value={formData.timeSignature.value}
                  label="Time Signature"
                  onChange={(e) => {
                    const sig = TIME_SIGNATURES.find(s => s.value === e.target.value);
                    setFormData({ ...formData, timeSignature: sig });
                  }}
                >
                  {TIME_SIGNATURES.map((sig) => (
                    <MenuItem key={sig.value} value={sig.value}>
                      {sig.value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Duration (seconds)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                error={!!errors.duration}
                helperText={errors.duration || 'Optional practice duration (10-3600 seconds)'}
                fullWidth
                inputProps={{ min: 10, max: 3600 }}
              />
              
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Optional notes about this song..."
              />
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained"
              disabled={!formData.name || !formData.name.trim()}
            >
              {editingSong ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Song Search Dialog */}
        <SongSearchDialog
          open={searchDialogOpen}
          onClose={() => setSearchDialogOpen(false)}
        />
      </CardContent>
    </Card>
  );
};

export default SongManager;
