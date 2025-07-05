import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Fab,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  VolumeUp,
  Timer,
  MusicNote,
} from '@mui/icons-material';
import useMetronomeStore, { TIME_SIGNATURES, CLICK_SOUNDS, SUBDIVISIONS } from '../stores/metronomeStore';
import globalAudioService from '../services/globalAudioService';
import CircularBPMDial from './CircularBPMDial';

const MetronomeControls = forwardRef((props, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const timerRef = useRef(null);

  const {
    bpm,
    isPlaying,
    timeSignature,
    accentFirstBeat,
    clickSound,
    subdivision,
    subdivisionVolume,
    volume,
    timerEnabled,
    timerDuration,
    timeRemaining,
    setBpm,
    setIsPlaying,
    setTimeSignature,
    setCurrentBeat,
    setCurrentSubdivision,
    setAccentFirstBeat,
    setClickSound,
    setSubdivision,
    setSubdivisionVolume,
    setVolume,
    setTimerEnabled,
    setTimerDuration,
    setTimeRemaining,
    decrementTimeRemaining,
  } = useMetronomeStore();

  const [beatIndicators, setBeatIndicators] = useState([]);
  const [subdivisionIndicators, setSubdivisionIndicators] = useState([]);

  // Initialize beat indicators
  useEffect(() => {
    setBeatIndicators(Array(timeSignature.beats).fill(false));
    setSubdivisionIndicators(Array(subdivision.value).fill(false));
    setCurrentBeat(0);
    setCurrentSubdivision(0);
  }, [timeSignature, subdivision, setCurrentBeat, setCurrentSubdivision]);

  // Handle play/pause
  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      // Stop
      globalAudioService.stop();
      setIsPlaying(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      // Start
      if (timerEnabled) {
        setTimeRemaining(timerDuration);
      }

      const success = await globalAudioService.start(
        bpm,
        timeSignature.beats,
        accentFirstBeat,
        clickSound.id,
        volume,
        subdivision.value,
        subdivisionVolume,
        (beatNumber) => {
          // Update beat indicators
          setCurrentBeat(beatNumber);
          setBeatIndicators(prev => 
            prev.map((_, index) => index === beatNumber)
          );
        },
        (beatNumber, subdivisionNumber) => {
          // Update subdivision indicators
          setCurrentSubdivision(subdivisionNumber);
          setSubdivisionIndicators(prev => 
            prev.map((_, index) => index === subdivisionNumber)
          );
        }
      );

      if (success) {
        setIsPlaying(true);

        // Start timer if enabled
        if (timerEnabled && timerDuration > 0) {
          timerRef.current = setInterval(() => {
            decrementTimeRemaining();
          }, 1000);
        }
      } else {
        // Show error message or retry
        console.error('Failed to start metronome - audio context not available');
      }
    }
  }, [
    isPlaying,
    timerEnabled,
    timerDuration,
    bpm,
    timeSignature.beats,
    accentFirstBeat,
    clickSound.id,
    volume,
    subdivision.value,
    subdivisionVolume,
    setIsPlaying,
    setTimeRemaining,
    setCurrentBeat,
    setCurrentSubdivision,
    decrementTimeRemaining
  ]);

  // Handle stop
  const handleStop = useCallback(() => {
    globalAudioService.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // End session tracking if currently playing
    if (isPlaying) {
      setIsPlaying(false);
    }
    
    // Reset other states
    setCurrentBeat(0);
    setCurrentSubdivision(0);
    setTimeRemaining(timerDuration);
    setBeatIndicators(Array(timeSignature.beats).fill(false));
    setSubdivisionIndicators(Array(subdivision.value).fill(false));
  }, [isPlaying, timerDuration, timeSignature.beats, subdivision.value, setIsPlaying, setCurrentBeat, setCurrentSubdivision, setTimeRemaining]);

  // Expose start function to parent component
  useImperativeHandle(ref, () => ({
    startMetronome: () => {
      if (!isPlaying) {
        handlePlayPause();
      }
    }
  }), [isPlaying, handlePlayPause]);

  // Update audio engine when settings change
  useEffect(() => {
    if (isPlaying) {
      globalAudioService.updateTempo(bpm);
    }
  }, [bpm, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      globalAudioService.updateSettings({
        beatsPerMeasure: timeSignature.beats,
        accentFirstBeat,
        clickSound: clickSound.id,
        volume,
        subdivisionValue: subdivision.value,
        subdivisionVolume,
      });
    }
  }, [timeSignature, accentFirstBeat, clickSound, volume, subdivision, subdivisionVolume, isPlaying]);

  // Timer countdown effect
  useEffect(() => {
    if (timerEnabled && timeRemaining <= 0 && isPlaying) {
      handleStop();
    }
  }, [timeRemaining, timerEnabled, isPlaying, handleStop]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle BPM increment/decrement
  const handleBpmChange = (delta) => {
    const newBpm = Math.max(30, Math.min(300, bpm + delta));
    setBpm(newBpm);
  };

  return (
    <Card 
      elevation={8}
      sx={{ 
        width: '100%',
        maxWidth: 600,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* BPM Dial */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularBPMDial size={isMobile ? 240 : 280} />
        </Box>

        {/* BPM Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
          <IconButton 
            onClick={() => handleBpmChange(-10)}
            size="small"
            sx={{ mx: 1 }}
          >
            <Typography variant="h6">-10</Typography>
          </IconButton>
          <IconButton 
            onClick={() => handleBpmChange(-1)}
            size="small"
            sx={{ mx: 0.5 }}
          >
            <Typography variant="h6">-1</Typography>
          </IconButton>
          <Box sx={{ mx: 2, minWidth: 80, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {bpm}
            </Typography>
          </Box>
          <IconButton 
            onClick={() => handleBpmChange(1)}
            size="small"
            sx={{ mx: 0.5 }}
          >
            <Typography variant="h6">+1</Typography>
          </IconButton>
          <IconButton 
            onClick={() => handleBpmChange(10)}
            size="small"
            sx={{ mx: 1 }}
          >
            <Typography variant="h6">+10</Typography>
          </IconButton>
        </Box>

        {/* Beat Indicators */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Stack direction="row" spacing={1}>
            {beatIndicators.map((isActive, index) => (
              <Box
                key={index}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isActive 
                    ? (index === 0 && accentFirstBeat ? theme.palette.secondary.main : theme.palette.primary.main)
                    : theme.palette.action.disabled,
                  color: isActive ? theme.palette.primary.contrastText : theme.palette.text.disabled,
                  fontWeight: 'bold',
                  transition: 'all 0.1s ease',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: isActive ? `0 0 20px ${theme.palette.primary.main}44` : 'none',
                }}
              >
                {index + 1}
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Subdivision Indicators */}
        {subdivision.value > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Stack direction="row" spacing={0.5}>
              {subdivisionIndicators.map((isActive, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: isActive 
                      ? theme.palette.info.main
                      : theme.palette.action.disabled,
                    transition: 'all 0.1s ease',
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                    opacity: isActive ? 1 : 0.5,
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Main Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
          <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
            <Fab
              color="primary"
              onClick={handlePlayPause}
              size={isMobile ? 'medium' : 'large'}
              sx={{
                boxShadow: `0 8px 25px ${theme.palette.primary.main}33`,
                '&:hover': {
                  boxShadow: `0 12px 35px ${theme.palette.primary.main}44`,
                },
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </Fab>
          </Tooltip>
          
          {isPlaying ? (
            <Tooltip title="Stop">
              <Fab
                color="secondary"
                onClick={handleStop}
                size={isMobile ? 'small' : 'medium'}
              >
                <Stop />
              </Fab>
            </Tooltip>
          ) : (
            <Tooltip title="Stop (disabled)">
              <span>
                <Fab
                  color="secondary"
                  onClick={handleStop}
                  size={isMobile ? 'small' : 'medium'}
                  disabled={!isPlaying}
                >
                  <Stop />
                </Fab>
              </span>
            </Tooltip>
          )}
        </Box>

        {/* Settings Grid */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 2,
          mb: 2 
        }}>
          {/* Time Signature */}
          <FormControl fullWidth size="small">
            <InputLabel>Time Signature</InputLabel>
            <Select
              value={timeSignature.value}
              label="Time Signature"
              onChange={(e) => {
                const sig = TIME_SIGNATURES.find(s => s.value === e.target.value);
                setTimeSignature(sig);
              }}
            >
              {TIME_SIGNATURES.map((sig) => (
                <MenuItem key={sig.value} value={sig.value}>
                  {sig.value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Subdivision */}
          <FormControl fullWidth size="small">
            <InputLabel>Subdivision</InputLabel>
            <Select
              value={subdivision.id}
              label="Subdivision"
              onChange={(e) => {
                const sub = SUBDIVISIONS.find(s => s.id === e.target.value);
                setSubdivision(sub);
              }}
            >
              {SUBDIVISIONS.map((sub) => (
                <MenuItem key={sub.id} value={sub.id}>
                  {sub.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Click Sound */}
          <FormControl fullWidth size="small">
            <InputLabel>Click Sound</InputLabel>
            <Select
              value={clickSound.id}
              label="Click Sound"
              onChange={(e) => {
                const sound = CLICK_SOUNDS.find(s => s.id === e.target.value);
                setClickSound(sound);
              }}
            >
              {CLICK_SOUNDS.map((sound) => (
                <MenuItem key={sound.id} value={sound.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MusicNote sx={{ mr: 1, fontSize: 18 }} />
                    {sound.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Volume Controls */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <VolumeUp sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              Main Volume
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(volume * 100)}%
            </Typography>
          </Box>
          <Slider
            value={volume}
            onChange={(e, value) => setVolume(value)}
            min={0}
            max={1}
            step={0.1}
            size="small"
          />
        </Box>

        {subdivision.value > 1 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <VolumeUp sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                Subdivision Volume
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(subdivisionVolume * 100)}%
              </Typography>
            </Box>
            <Slider
              value={subdivisionVolume}
              onChange={(e, value) => setSubdivisionVolume(value)}
              min={0}
              max={1}
              step={0.1}
              size="small"
            />
          </Box>
        )}

        {/* Options */}
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={accentFirstBeat}
                onChange={(e) => setAccentFirstBeat(e.target.checked)}
                size="small"
              />
            }
            label="Accent First Beat"
          />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={timerEnabled}
                  onChange={(e) => setTimerEnabled(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Timer sx={{ mr: 1, fontSize: 18 }} />
                  Timer
                </Box>
              }
            />
            
            {timerEnabled && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Slider
                  value={timerDuration}
                  onChange={(e, value) => {
                    setTimerDuration(value);
                    if (!isPlaying) setTimeRemaining(value);
                  }}
                  min={10}
                  max={600}
                  step={10}
                  size="small"
                  sx={{ width: 100 }}
                />
                <Chip
                  label={formatTime(isPlaying ? timeRemaining : timerDuration)}
                  size="small"
                  color={timeRemaining <= 10 && timerEnabled ? 'error' : 'default'}
                />
              </Box>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
});

export default MetronomeControls;
