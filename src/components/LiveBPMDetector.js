import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  Chip,
  Paper,
  Switch,
  FormControlLabel,
  Alert,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Mic,
  MicOff,
  PlayArrow,
  Refresh,
  Timeline,
} from '@mui/icons-material';
import useMetronomeStore from '../stores/metronomeStore';

const LiveBPMDetector = () => {
  const theme = useTheme();
  const { setBpm } = useMetronomeStore();
  
  // Audio processing refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioDataRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Beat detection state
  const lastBeatTimeRef = useRef(0);
  const beatIntervalsRef = useRef([]);
  const energyHistoryRef = useRef([]);
  
  // State
  const [isListening, setIsListening] = useState(false);
  const [detectedBPM, setDetectedBPM] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [autoSync, setAutoSync] = useState(false);
  const [error, setError] = useState(null);
  const [recentBeats, setRecentBeats] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');
  
  // Beat detection algorithm
  const detectBeats = useCallback((audioData, currentTime) => {
    if (!audioData || audioData.length === 0) return [];
    
    const threshold = 0.001; // Much lower threshold
    const minTimeBetweenBeats = 150; // ms - allow faster detection
    
    // Calculate RMS energy for current frame
    const rmsEnergy = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
    
    // Also calculate peak amplitude
    const peakAmplitude = Math.max(...audioData.map(Math.abs));
    
    // Use the higher of RMS or peak for better detection
    const energy = Math.max(rmsEnergy, peakAmplitude * 0.7);
    
    // Add to energy history
    energyHistoryRef.current.push(energy);
    if (energyHistoryRef.current.length > 20) {
      energyHistoryRef.current.shift();
    }
    
    // Only proceed if we have enough history
    if (energyHistoryRef.current.length < 5) {
      setDebugInfo(`Building energy history: ${energyHistoryRef.current.length}/5`);
      return [];
    }
    
    // Calculate dynamic threshold based on recent energy levels
    const recentHistory = energyHistoryRef.current.slice(-10);
    const avgEnergy = recentHistory.reduce((sum, e) => sum + e, 0) / recentHistory.length;
    const maxRecentEnergy = Math.max(...recentHistory);
    
    // Dynamic threshold: must be significantly above average AND above base threshold
    const dynamicThreshold = Math.max(threshold, avgEnergy * 1.5);
    const peakThreshold = maxRecentEnergy * 0.6;
    
    setDebugInfo(`Energy: ${energy.toFixed(4)}, Avg: ${avgEnergy.toFixed(4)}, Threshold: ${dynamicThreshold.toFixed(4)}, Peak: ${peakAmplitude.toFixed(4)}`);
    
    // Beat detection: current energy significantly higher than recent average
    const beats = [];
    const isEnergySpike = energy > dynamicThreshold;
    const isPeakAboveThreshold = energy > peakThreshold;
    const isAboveBaseThreshold = energy > threshold;
    
    if ((isEnergySpike || isPeakAboveThreshold) && isAboveBaseThreshold) {
      const now = currentTime;
      
      // Avoid duplicate beats
      if (now - lastBeatTimeRef.current > minTimeBetweenBeats) {
        beats.push(now);
        lastBeatTimeRef.current = now;
        
        setDebugInfo(`🥁 BEAT DETECTED! Energy: ${energy.toFixed(4)}, Time: ${now}`);
      } else {
        setDebugInfo(`Beat too soon: ${now - lastBeatTimeRef.current}ms ago`);
      }
    }
    
    return beats;
  }, []);
  
  // Calculate BPM from beat intervals
  const calculateBPM = useCallback((beatTimes) => {
    if (beatTimes.length === 0) return null;
    
    // Add new beats to intervals
    beatTimes.forEach(beatTime => {
      beatIntervalsRef.current.push(beatTime);
    });
    
    // Keep only recent beats (last 6 for faster response)
    if (beatIntervalsRef.current.length > 6) {
      beatIntervalsRef.current = beatIntervalsRef.current.slice(-6);
    }
    
    // Need at least 2 beats to calculate BPM
    if (beatIntervalsRef.current.length < 2) {
      setDebugInfo(prev => prev + ` | Need more beats: ${beatIntervalsRef.current.length}/2`);
      return null;
    }
    
    // Calculate intervals between consecutive beats
    const intervals = [];
    for (let i = 1; i < beatIntervalsRef.current.length; i++) {
      intervals.push(beatIntervalsRef.current[i] - beatIntervalsRef.current[i - 1]);
    }
    
    // Filter out outlier intervals (too fast or too slow) - more permissive range
    const filteredIntervals = intervals.filter(interval => interval > 250 && interval < 2500);
    
    if (filteredIntervals.length === 0) {
      setDebugInfo(prev => prev + ` | No valid intervals from ${intervals.length} total`);
      return null;
    }
    
    // Calculate median interval
    const sortedIntervals = [...filteredIntervals].sort((a, b) => a - b);
    const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
    
    // Convert to BPM
    const bpm = 60000 / medianInterval;
    
    // Calculate confidence based on consistency - more lenient
    const variance = filteredIntervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - medianInterval, 2);
    }, 0) / filteredIntervals.length;
    
    const standardDeviation = Math.sqrt(variance);
    const confidence = Math.max(0, Math.min(1, 1 - (standardDeviation / (medianInterval * 2)))); // More lenient confidence
    
    setDebugInfo(prev => `BPM: ${bpm.toFixed(1)}, Confidence: ${(confidence * 100).toFixed(1)}%, Intervals: ${filteredIntervals.length}, Median: ${medianInterval.toFixed(0)}ms`);
    
    return { bpm: Math.round(bpm), confidence };
  }, []);
  
  // Audio processing loop
  const processAudio = useCallback(() => {
    if (!analyserRef.current || !audioDataRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = audioDataRef.current;
    
    // Get audio data
    analyser.getFloatTimeDomainData(dataArray);
    
    // Calculate audio level for visualization - use both RMS and peak
    const rms = Math.sqrt(dataArray.reduce((sum, sample) => sum + sample * sample, 0) / dataArray.length);
    const peak = Math.max(...dataArray.map(Math.abs));
    const audioLevelValue = Math.max(rms * 50, peak * 20); // Much more sensitive scaling
    setAudioLevel(Math.min(1, audioLevelValue));
    
    // Detect beats
    const currentTime = Date.now();
    const beats = detectBeats(dataArray, currentTime);
    
    if (beats.length > 0) {
      setRecentBeats(prev => {
        const newBeats = [...prev.slice(-10), ...beats].slice(-10);
        // Update debug with beat count
        setDebugInfo(prev => prev + ` | Total beats: ${newBeats.length}`);
        return newBeats;
      });
      
      // Calculate BPM immediately when we get beats
      const bpmResult = calculateBPM(beats);
      if (bpmResult && bpmResult.bpm >= 60 && bpmResult.bpm <= 200) {
        setDetectedBPM(bpmResult.bpm);
        setConfidence(bpmResult.confidence);
        
        // Auto-sync if enabled and confidence is reasonable
        if (autoSync && bpmResult.confidence > 0.4) { // Lower confidence threshold
          setBpm(bpmResult.bpm);
        }
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(processAudio);
  }, [detectBeats, calculateBPM, autoSync, setBpm]);
  
  // Start listening
  const startListening = async () => {
    try {
      setError(null);
      setDebugInfo('Requesting microphone access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        }
      });
      
      setDebugInfo('Microphone access granted, initializing audio...');
      mediaStreamRef.current = stream;
      
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // Resume if suspended (required for some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.1;
      analyserRef.current = analyser;
      
      // Create audio data array
      audioDataRef.current = new Float32Array(analyser.fftSize);
      
      // Connect audio source
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      setIsListening(true);
      setDebugInfo('Audio processing started. Start playing!');
      
      // Reset beat detection state
      lastBeatTimeRef.current = 0;
      beatIntervalsRef.current = [];
      energyHistoryRef.current = [];
      
      // Start processing
      processAudio();
      
    } catch (err) {
      console.error('Error starting audio:', err);
      let errorMessage = 'Could not access microphone. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Your browser does not support audio input.';
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      setDebugInfo(`Error: ${err.message}`);
    }
  };
  
  // Stop listening
  const stopListening = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    audioDataRef.current = null;
    
    // Reset state
    setIsListening(false);
    setAudioLevel(0);
    setDetectedBPM(null);
    setConfidence(0);
    setRecentBeats([]);
    setDebugInfo('Stopped listening');
    
    // Reset detection state
    lastBeatTimeRef.current = 0;
    beatIntervalsRef.current = [];
    energyHistoryRef.current = [];
  };
  
  // Reset detection
  const resetDetection = () => {
    setDetectedBPM(null);
    setConfidence(0);
    setRecentBeats([]);
    setDebugInfo('Detection reset');
    
    // Reset detection state
    lastBeatTimeRef.current = 0;
    beatIntervalsRef.current = [];
    energyHistoryRef.current = [];
  };
  
  // Sync BPM to metronome
  const syncBPM = () => {
    if (detectedBPM) {
      setBpm(detectedBPM);
      setDebugInfo(`Synced BPM ${detectedBPM} to metronome`);
    }
  };
  
  // Test beat detection by simulating a beat
  const testBeat = () => {
    const now = Date.now();
    const beats = [now];
    setRecentBeats(prev => [...prev.slice(-10), ...beats].slice(-10));
    
    const bpmResult = calculateBPM(beats);
    if (bpmResult) {
      setDetectedBPM(bpmResult.bpm);
      setConfidence(bpmResult.confidence);
    }
    setDebugInfo(`Test beat added at ${now}`);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);
  
  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timeline />
          Live BPM Detector
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Main BPM Display */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            {detectedBPM || '--'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            BPM
          </Typography>
          
          {confidence > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Confidence: {Math.round(confidence * 100)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={confidence * 100} 
                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
              />
            </Box>
          )}
        </Box>
        
        {/* Audio Level Indicator */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Audio Level
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={audioLevel * 100} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: theme.palette.grey[300],
              '& .MuiLinearProgress-bar': {
                backgroundColor: audioLevel > 0.8 ? theme.palette.error.main : 
                               audioLevel > 0.5 ? theme.palette.warning.main : 
                               theme.palette.success.main
              }
            }}
          />
        </Box>
        
        {/* Controls */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }} flexWrap="wrap">
          <Button
            variant={isListening ? "outlined" : "contained"}
            color={isListening ? "error" : "primary"}
            startIcon={isListening ? <MicOff /> : <Mic />}
            onClick={isListening ? stopListening : startListening}
            size="large"
          >
            {isListening ? 'Stop' : 'Start'} Listening
          </Button>
          
          <Tooltip title="Reset Detection">
            <IconButton onClick={resetDetection} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          
          {isListening && (
            <Button
              variant="outlined"
              onClick={testBeat}
              size="small"
              color="secondary"
            >
              Test Beat
            </Button>
          )}
          
          {detectedBPM && (
            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              onClick={syncBPM}
              disabled={!detectedBPM}
            >
              Sync to Metronome
            </Button>
          )}
        </Stack>
        
        {/* Settings */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-sync to metronome"
          />
        </Box>
        
        {/* Debug Info */}
        {debugInfo && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption">
              Debug: {debugInfo}
            </Typography>
          </Alert>
        )}
        
        {/* Beat Visualization */}
        {recentBeats.length > 0 && (
          <Paper elevation={1} sx={{ p: 2, backgroundColor: theme.palette.background.default }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              🥁 Beats Detected: {recentBeats.length}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {recentBeats.slice(-10).map((beat, index) => (
                <Chip
                  key={beat}
                  label={`${index + 1}`}
                  size="small"
                  color={index === recentBeats.length - 1 ? "primary" : "default"}
                  sx={{ 
                    animation: index === recentBeats.length - 1 ? 'pulse 0.8s ease-in-out' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)', backgroundColor: theme.palette.primary.main },
                      '50%': { transform: 'scale(1.3)', backgroundColor: theme.palette.secondary.main },
                      '100%': { transform: 'scale(1)', backgroundColor: theme.palette.primary.main }
                    }
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Latest beat: {recentBeats.length > 0 ? new Date(recentBeats[recentBeats.length - 1]).toLocaleTimeString() : 'None'}
            </Typography>
          </Paper>
        )}
        
        {/* Instructions */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>How to use:</strong>
          </Typography>
          <Typography variant="caption" component="div" sx={{ mt: 1 }}>
            1. Click "Start Listening" and allow microphone access<br/>
            2. Start playing drums or percussion with steady beats<br/>
            3. Watch the audio level meter turn green/yellow<br/>
            4. BPM will appear after 3-4 consistent beats<br/>
            5. Use "Sync to Metronome" when satisfied with detection
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Troubleshooting:</strong>
          </Typography>
          <Typography variant="caption" component="div">
            • If audio level is low, play louder or move mic closer<br/>
            • If no BPM detected, try playing more consistent beats<br/>
            • Works best with snare drum, hi-hat, or claps<br/>
            • Reset detection if BPM seems stuck
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default LiveBPMDetector;
