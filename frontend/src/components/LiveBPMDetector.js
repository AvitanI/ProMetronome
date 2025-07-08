import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Stack,
  Chip,
  Paper,
  Switch,
  FormControlLabel,
  Alert,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Mic,
  MicOff,
  PlayArrow,
  Refresh,
  Timeline,
  BarChart,
} from '@mui/icons-material';
import useMetronomeStore from '../stores/metronomeStore';

const LiveBPMDetector = React.memo(() => {
  const theme = useTheme();
  const { setBpm } = useMetronomeStore();
  
  // Audio processing refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioDataRef = useRef(null);
  const animationFrameRef = useRef(null);
  const processingIntervalRef = useRef(null); // Add interval ref for better control
  
  // Beat detection state
  const lastBeatTimeRef = useRef(0);
  const beatIntervalsRef = useRef([]);
  const energyHistoryRef = useRef([]);
  const spectralFluxHistoryRef = useRef([]);
  const previousMagnitudesRef = useRef(null);
  const bpmHistoryRef = useRef([]);
  const adaptiveThresholdRef = useRef(0.01);
  
  // State
  const [isListening, setIsListening] = useState(false);
  const [detectedBPM, setDetectedBPM] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [autoSync, setAutoSync] = useState(false);
  const [error, setError] = useState(null);
  const [recentBeats, setRecentBeats] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');
  const [bpmHistory, setBpmHistory] = useState([]);
  const [showGraph, setShowGraph] = useState(true);

  // Throttle audio processing to reduce CPU usage
  const PROCESSING_INTERVAL = 50; // Faster processing for better accuracy
  const BPM_HISTORY_UPDATE_INTERVAL = 1000; // Update graph every second
  const MAX_GRAPH_POINTS = 60; // Show last 60 seconds
  
  // Update BPM history for graph every second
  useEffect(() => {
    if (!isListening) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (detectedBPM && confidence > 0.3) {
        setBpmHistory(prev => {
          const newEntry = {
            timestamp: now,
            bpm: detectedBPM,
            confidence: confidence
          };
          const updated = [...prev, newEntry];
          
          // Keep only last 60 seconds
          const cutoffTime = now - (MAX_GRAPH_POINTS * 1000);
          return updated.filter(entry => entry.timestamp > cutoffTime);
        });
      }
    }, BPM_HISTORY_UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [isListening, detectedBPM, confidence]);
  
  // Enhanced beat detection with spectral flux and frequency analysis
  const detectBeats = useCallback((audioData, frequencyData, currentTime) => {
    if (!audioData || audioData.length === 0 || !frequencyData) return [];
    
    const minTimeBetweenBeats = 150; // ms - minimum time between beats
    
    // 1. Calculate RMS energy for current frame
    const rmsEnergy = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
    
    // 2. Calculate peak amplitude
    const peakAmplitude = Math.max(...audioData.map(Math.abs));
    
    // 3. Focus on percussive frequency bands (typically 60Hz - 5kHz for drums)
    const percussiveStart = Math.floor(60 * frequencyData.length / 22050); // 60Hz
    const percussiveEnd = Math.floor(5000 * frequencyData.length / 22050); // 5kHz
    const percussiveBands = frequencyData.slice(percussiveStart, percussiveEnd);
    
    // 4. Calculate spectral energy in percussive range
    const spectralEnergy = percussiveBands.reduce((sum, magnitude) => sum + magnitude, 0) / percussiveBands.length;
    
    // 5. Calculate spectral flux (measure of spectral change)
    let spectralFlux = 0;
    if (previousMagnitudesRef.current) {
      const prevPercussive = previousMagnitudesRef.current.slice(percussiveStart, percussiveEnd);
      spectralFlux = percussiveBands.reduce((sum, current, i) => {
        const diff = current - (prevPercussive[i] || 0);
        return sum + Math.max(0, diff); // Only positive changes
      }, 0) / percussiveBands.length;
    }
    previousMagnitudesRef.current = [...frequencyData];
    
    // 6. Combine different energy measures with weights
    const timeEnergy = (rmsEnergy * 0.3) + (peakAmplitude * 0.2);
    const freqEnergy = spectralEnergy * 0.3;
    const fluxEnergy = spectralFlux * 0.2;
    const combinedEnergy = timeEnergy + freqEnergy + fluxEnergy;
    
    // Add to energy and flux history
    energyHistoryRef.current.push(combinedEnergy);
    spectralFluxHistoryRef.current.push(spectralFlux);
    
    if (energyHistoryRef.current.length > 50) {
      energyHistoryRef.current.shift();
      spectralFluxHistoryRef.current.shift();
    }
    
    // Only proceed if we have enough history
    if (energyHistoryRef.current.length < 15) {
      setDebugInfo(`Building analysis history: ${energyHistoryRef.current.length}/15`);
      return [];
    }
    
    // 7. Adaptive threshold calculation
    const recentEnergy = energyHistoryRef.current.slice(-20);
    const avgEnergy = recentEnergy.reduce((sum, e) => sum + e, 0) / recentEnergy.length;
    const energyVariance = recentEnergy.reduce((sum, e) => sum + Math.pow(e - avgEnergy, 2), 0) / recentEnergy.length;
    const energyStdDev = Math.sqrt(energyVariance);
    
    // Update adaptive threshold based on signal characteristics
    const baseThreshold = avgEnergy + (energyStdDev * 1.5);
    adaptiveThresholdRef.current = adaptiveThresholdRef.current * 0.9 + baseThreshold * 0.1; // Smooth adaptation
    
    // 8. Multi-criteria beat detection
    const energyThreshold = combinedEnergy > adaptiveThresholdRef.current;
    const fluxThreshold = spectralFlux > (spectralFluxHistoryRef.current.slice(-10).reduce((sum, f) => sum + f, 0) / 10) * 1.8;
    const peakCondition = peakAmplitude > avgEnergy * 2;
    
    setDebugInfo(`Energy: ${combinedEnergy.toFixed(4)}, Flux: ${spectralFlux.toFixed(4)}, Threshold: ${adaptiveThresholdRef.current.toFixed(4)}, Peak: ${peakAmplitude.toFixed(4)}`);
    
    // Beat detection: multiple criteria must be met
    const beats = [];
    const isBeat = energyThreshold && (fluxThreshold || peakCondition);
    
    if (isBeat) {
      const now = currentTime;
      
      // Avoid duplicate beats with improved timing
      if (now - lastBeatTimeRef.current > minTimeBetweenBeats) {
        beats.push(now);
        lastBeatTimeRef.current = now;
        
        setDebugInfo(`🥁 BEAT! Energy: ${combinedEnergy.toFixed(4)}, Flux: ${spectralFlux.toFixed(4)}, Peak: ${peakAmplitude.toFixed(4)}`);
      } else {
        setDebugInfo(`Beat filtered: ${now - lastBeatTimeRef.current}ms since last`);
      }
    }
    
    return beats;
  }, []);
  
  // Enhanced BPM calculation with tempo smoothing
  const calculateBPM = useCallback((beatTimes) => {
    if (beatTimes.length === 0) return null;
    
    // Add new beats to intervals
    beatTimes.forEach(beatTime => {
      beatIntervalsRef.current.push(beatTime);
    });
    
    // Keep only recent beats (last 12 for better accuracy)
    if (beatIntervalsRef.current.length > 12) {
      beatIntervalsRef.current = beatIntervalsRef.current.slice(-12);
    }
    
    // Need at least 4 beats for reliable BPM calculation
    if (beatIntervalsRef.current.length < 4) {
      setDebugInfo(prev => prev + ` | Need more beats: ${beatIntervalsRef.current.length}/4`);
      return null;
    }
    
    // Calculate intervals between consecutive beats
    const intervals = [];
    for (let i = 1; i < beatIntervalsRef.current.length; i++) {
      intervals.push(beatIntervalsRef.current[i] - beatIntervalsRef.current[i - 1]);
    }
    
    // Enhanced outlier filtering
    const medianInterval = [...intervals].sort((a, b) => a - b)[Math.floor(intervals.length / 2)];
    const allowedDeviation = medianInterval * 0.3; // 30% deviation allowed
    
    const filteredIntervals = intervals.filter(interval => {
      const deviationFromMedian = Math.abs(interval - medianInterval);
      return interval > 300 && interval < 1000 && deviationFromMedian < allowedDeviation;
    });
    
    if (filteredIntervals.length < 3) {
      setDebugInfo(prev => prev + ` | Not enough consistent intervals: ${filteredIntervals.length}/3`);
      return null;
    }
    
    // Calculate weighted average (recent intervals have more weight)
    let weightedSum = 0;
    let totalWeight = 0;
    filteredIntervals.forEach((interval, index) => {
      const weight = Math.pow(1.2, index); // Exponential weighting favoring recent beats
      weightedSum += interval * weight;
      totalWeight += weight;
    });
    const weightedAvgInterval = weightedSum / totalWeight;
    
    // Convert to BPM
    const currentBpm = 60000 / weightedAvgInterval;
    
    // Tempo smoothing - add to BPM history
    bpmHistoryRef.current.push(currentBpm);
    if (bpmHistoryRef.current.length > 8) {
      bpmHistoryRef.current.shift();
    }
    
    // Calculate smoothed BPM
    const recentBpms = bpmHistoryRef.current.slice(-5);
    const smoothedBpm = recentBpms.reduce((sum, bpm) => sum + bpm, 0) / recentBpms.length;
    
    // Calculate confidence based on consistency of both intervals and BPMs
    const intervalVariance = filteredIntervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - weightedAvgInterval, 2);
    }, 0) / filteredIntervals.length;
    
    const bpmVariance = recentBpms.reduce((sum, bpm) => {
      return sum + Math.pow(bpm - smoothedBpm, 2);
    }, 0) / recentBpms.length;
    
    const intervalStdDev = Math.sqrt(intervalVariance);
    const bpmStdDev = Math.sqrt(bpmVariance);
    
    // Combined confidence score
    const intervalConfidence = Math.max(0, 1 - (intervalStdDev / (weightedAvgInterval * 0.8)));
    const bpmConfidence = Math.max(0, 1 - (bpmStdDev / (smoothedBpm * 0.15)));
    const confidence = (intervalConfidence * 0.6) + (bpmConfidence * 0.4);
    
    setDebugInfo(`BPM: ${smoothedBpm.toFixed(1)} (raw: ${currentBpm.toFixed(1)}), Confidence: ${(confidence * 100).toFixed(1)}%, Intervals: ${filteredIntervals.length}, StdDev: ${intervalStdDev.toFixed(0)}ms`);
    
    return { bpm: Math.round(smoothedBpm), confidence };
  }, []);
  
  // Audio processing loop
  const processAudio = useCallback(() => {
    if (!analyserRef.current || !audioDataRef.current || !isListening) return;
    
    const analyser = analyserRef.current;
    const timeDataArray = audioDataRef.current;
    
    // Get time domain data for energy analysis
    analyser.getFloatTimeDomainData(timeDataArray);
    
    // Get frequency domain data for spectral analysis
    const freqDataArray = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(freqDataArray);
    
    // Convert dB to linear scale for frequency data
    const linearFreqData = freqDataArray.map(db => Math.pow(10, db / 20));
    
    // Calculate audio level for visualization
    const rms = Math.sqrt(timeDataArray.reduce((sum, sample) => sum + sample * sample, 0) / timeDataArray.length);
    const peak = Math.max(...timeDataArray.map(Math.abs));
    const audioLevelValue = Math.max(rms * 80, peak * 40); // More sensitive scaling
    setAudioLevel(Math.min(1, audioLevelValue));
    
    // Detect beats using both time and frequency domain analysis
    const currentTime = Date.now();
    const beats = detectBeats(timeDataArray, linearFreqData, currentTime);
    
    if (beats.length > 0) {
      setRecentBeats(prev => {
        const newBeats = [...prev.slice(-10), ...beats].slice(-10);
        return newBeats;
      });
      
      // Calculate BPM immediately when we get beats
      const bpmResult = calculateBPM(beats);
      if (bpmResult && bpmResult.bpm >= 60 && bpmResult.bpm <= 200) {
        setDetectedBPM(bpmResult.bpm);
        setConfidence(bpmResult.confidence);
        
        // Auto-sync if enabled and confidence is high enough
        if (autoSync && bpmResult.confidence > 0.6) { // Higher confidence threshold for auto-sync
          setBpm(bpmResult.bpm);
        }
      }
    }
  }, [detectBeats, calculateBPM, autoSync, setBpm, isListening]);
  
  // Start audio processing interval
  useEffect(() => {
    if (isListening && !processingIntervalRef.current) {
      processingIntervalRef.current = setInterval(processAudio, PROCESSING_INTERVAL);
    } else if (!isListening && processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
    };
  }, [isListening, processAudio]);
  
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
          sampleRate: 44100,
          channelCount: 1 // Mono audio for simpler processing
        }
      });
      
      setDebugInfo('Microphone access granted, initializing audio...');
      mediaStreamRef.current = stream;
      
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 44100
      });
      audioContextRef.current = audioContext;
      
      // Resume if suspended (required for some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        setDebugInfo('Audio context resumed');
      }
      
      // Create analyser with optimized settings for beat detection
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048; // Larger FFT for better frequency resolution
      analyser.smoothingTimeConstant = 0.1; // Minimal smoothing for responsive detection
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyserRef.current = analyser;
      
      // Create audio data arrays for both time and frequency domain
      audioDataRef.current = new Float32Array(analyser.fftSize);
      
      // Connect audio source
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      setDebugInfo(`Audio initialized. Sample rate: ${audioContext.sampleRate}Hz, FFT size: ${analyser.fftSize}`);
      
      setIsListening(true);
      setDebugInfo('Audio processing started. Start playing!');
      
      // Reset beat detection state
      lastBeatTimeRef.current = 0;
      beatIntervalsRef.current = [];
      energyHistoryRef.current = [];
      spectralFluxHistoryRef.current = [];
      previousMagnitudesRef.current = null;
      bpmHistoryRef.current = [];
      adaptiveThresholdRef.current = 0.01;
      
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
    // Clean up interval
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
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
    setBpmHistory([]);
    setDebugInfo('Stopped listening');
    
    // Reset detection state
    lastBeatTimeRef.current = 0;
    beatIntervalsRef.current = [];
    energyHistoryRef.current = [];
    spectralFluxHistoryRef.current = [];
    previousMagnitudesRef.current = null;
    bpmHistoryRef.current = [];
    adaptiveThresholdRef.current = 0.01;
  };
  
  // Reset detection
  const resetDetection = () => {
    setDetectedBPM(null);
    setConfidence(0);
    setRecentBeats([]);
    setBpmHistory([]);
    setDebugInfo('Detection reset');
    
    // Reset detection state
    lastBeatTimeRef.current = 0;
    beatIntervalsRef.current = [];
    energyHistoryRef.current = [];
    spectralFluxHistoryRef.current = [];
    previousMagnitudesRef.current = null;
    bpmHistoryRef.current = [];
    adaptiveThresholdRef.current = 0.01;
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
    
    // Add test beat to recent beats
    setRecentBeats(prev => [...prev.slice(-10), ...beats].slice(-10));
    
    // Add to beat intervals for BPM calculation
    beatIntervalsRef.current.push(now);
    if (beatIntervalsRef.current.length > 8) {
      beatIntervalsRef.current = beatIntervalsRef.current.slice(-8);
    }
    
    const bpmResult = calculateBPM(beats);
    if (bpmResult) {
      setDetectedBPM(bpmResult.bpm);
      setConfidence(bpmResult.confidence);
    }
    
    setDebugInfo(`🧪 Test beat added at ${now} (Total beats: ${beatIntervalsRef.current.length})`);
  };
  
  // BPM Stream Graph Component
  const BPMStreamGraph = React.memo(() => {
    if (bpmHistory.length < 2) {
      return (
        <Paper elevation={1} sx={{ p: 3, backgroundColor: theme.palette.background.default, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChart />
              BPM Stream Monitor
            </Typography>
          </Box>
          <Box sx={{ 
            height: 300, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: `2px dashed ${theme.palette.divider}`,
            borderRadius: 2,
            backgroundColor: theme.palette.action.hover
          }}>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {isListening ? 
                "🎵 Start playing beats to see the BPM stream graph..." : 
                "📊 Click 'Start Listening' to begin BPM monitoring"
              }
            </Typography>
          </Box>
        </Paper>
      );
    }
    
    const graphWidth = 900; // Much bigger width
    const graphHeight = 300; // Taller height  
    const padding = 50; // More padding for better labels
    const innerWidth = graphWidth - padding * 2;
    const innerHeight = graphHeight - padding * 2;
    
    // Find BPM range for scaling
    const bpmValues = bpmHistory.map(entry => entry.bpm);
    const minBpm = Math.max(60, Math.min(...bpmValues) - 15);
    const maxBpm = Math.min(200, Math.max(...bpmValues) + 15);
    const bpmRange = maxBpm - minBpm;
    
    // Create time range (last 60 seconds)
    const now = Date.now();
    const timeRange = 60 * 1000; // 60 seconds
    const earliestTime = now - timeRange;
    
    // Scale functions
    const scaleX = (timestamp) => ((timestamp - earliestTime) / timeRange) * innerWidth;
    const scaleY = (bpm) => innerHeight - ((bpm - minBpm) / bpmRange) * innerHeight;
    
    // Generate path for BPM line
    const pathData = bpmHistory
      .filter(entry => entry.timestamp >= earliestTime)
      .map((entry, index) => {
        const x = scaleX(entry.timestamp);
        const y = scaleY(entry.bpm);
        return `${index === 0 ? 'M' : 'L'} ${x + padding} ${y + padding}`;
      })
      .join(' ');
    
    // Generate confidence area (optional background)
    const confidencePathData = bpmHistory
      .filter(entry => entry.timestamp >= earliestTime)
      .map((entry, index) => {
        const x = scaleX(entry.timestamp);
        const baseY = scaleY(minBpm);
        const confY = scaleY(minBpm + (entry.confidence * bpmRange * 0.3)); // Scale confidence to 30% of range
        if (index === 0) {
          return `M ${x + padding} ${baseY + padding} L ${x + padding} ${confY + padding}`;
        }
        return `L ${x + padding} ${confY + padding}`;
      })
      .join(' ');
    
    // Close the confidence area
    const lastEntry = bpmHistory[bpmHistory.length - 1];
    const lastX = scaleX(lastEntry.timestamp);
    const closedConfidenceArea = confidencePathData + 
      ` L ${lastX + padding} ${scaleY(minBpm) + padding} Z`;
    
    return (
      <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.default, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart />
            Live BPM Stream Monitor
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {bpmHistory.length} data points
            </Typography>
            <Chip 
              label={`${detectedBPM || '--'} BPM`} 
              color="primary" 
              variant="filled"
              size="medium"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <svg 
            width={graphWidth} 
            height={graphHeight}
            style={{ 
              border: `2px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[1]
            }}
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
                <path 
                  d="M 50 0 L 0 0 0 25" 
                  fill="none" 
                  stroke={theme.palette.divider} 
                  strokeWidth="0.5"
                  opacity="0.4"
                />
              </pattern>
            </defs>
            <rect width={innerWidth} height={innerHeight} x={padding} y={padding} fill="url(#grid)" />
            
            {/* Confidence area background */}
            {confidencePathData && (
              <path
                d={closedConfidenceArea}
                fill={theme.palette.primary.main}
                fillOpacity="0.15"
                stroke="none"
              />
            )}
            
            {/* BPM line */}
            <path
              d={pathData}
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {bpmHistory
              .filter(entry => entry.timestamp >= earliestTime)
              .map((entry, index) => (
                <circle
                  key={entry.timestamp}
                  cx={scaleX(entry.timestamp) + padding}
                  cy={scaleY(entry.bpm) + padding}
                  r="3"
                  fill={entry.confidence > 0.8 ? theme.palette.success.main : 
                        entry.confidence > 0.6 ? theme.palette.warning.main : 
                        theme.palette.error.main}
                  stroke={theme.palette.background.paper}
                  strokeWidth="2"
                />
              ))}
            
            {/* Y-axis labels */}
            <text 
              x={padding - 15} 
              y={padding + 5} 
              textAnchor="end" 
              fontSize="14" 
              fill={theme.palette.text.secondary}
              fontWeight="bold"
            >
              {maxBpm}
            </text>
            <text 
              x={padding - 15} 
              y={innerHeight + padding - 5} 
              textAnchor="end" 
              fontSize="14" 
              fill={theme.palette.text.secondary}
              fontWeight="bold"
            >
              {minBpm}
            </text>
            
            {/* Middle Y-axis label */}
            <text 
              x={padding - 15} 
              y={innerHeight / 2 + padding + 5} 
              textAnchor="end" 
              fontSize="13" 
              fill={theme.palette.text.secondary}
            >
              {Math.round((minBpm + maxBpm) / 2)}
            </text>
            
            {/* Current BPM indicator line */}
            {detectedBPM && (
              <>
                <line
                  x1={padding}
                  y1={scaleY(detectedBPM) + padding}
                  x2={innerWidth + padding}
                  y2={scaleY(detectedBPM) + padding}
                  stroke={theme.palette.secondary.main}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.8"
                />
                <text 
                  x={innerWidth + padding + 10} 
                  y={scaleY(detectedBPM) + padding + 4} 
                  fontSize="12" 
                  fill={theme.palette.secondary.main}
                  fontWeight="bold"
                >
                  {detectedBPM} BPM
                </text>
              </>
            )}
            
            {/* X-axis time labels */}
            <text 
              x={padding} 
              y={graphHeight - 15} 
              fontSize="13" 
              fill={theme.palette.text.secondary}
              fontWeight="bold"
            >
              -60s
            </text>
            <text 
              x={innerWidth / 2 + padding} 
              y={graphHeight - 15} 
              textAnchor="middle"
              fontSize="12" 
              fill={theme.palette.text.secondary}
            >
              -30s
            </text>
            <text 
              x={innerWidth + padding} 
              y={graphHeight - 15} 
              textAnchor="end" 
              fontSize="13" 
              fill={theme.palette.text.secondary}
              fontWeight="bold"
            >
              now
            </text>
            
            {/* Y-axis label */}
            <text 
              x={20} 
              y={innerHeight / 2 + padding} 
              textAnchor="middle"
              fontSize="14" 
              fill={theme.palette.text.secondary}
              fontWeight="bold"
              transform={`rotate(-90, 20, ${innerHeight / 2 + padding})`}
            >
              BPM
            </text>
          </svg>
        </Box>
        
        {/* Graph legend and stats combined */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          {/* Legend */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 3, backgroundColor: theme.palette.primary.main, borderRadius: 1 }} />
              <Typography variant="caption">BPM Line</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: theme.palette.success.main }} />
              <Typography variant="caption">High Confidence</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: theme.palette.warning.main }} />
              <Typography variant="caption">Medium</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: theme.palette.error.main }} />
              <Typography variant="caption">Low</Typography>
            </Box>
          </Box>
          
          {/* Quick stats */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Avg:</strong> {bpmHistory.length > 0 ? 
                Math.round(bpmHistory.reduce((sum, entry) => sum + entry.bpm, 0) / bpmHistory.length) : '--'} BPM
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>Range:</strong> {bpmHistory.length > 0 ? 
                `${Math.min(...bpmValues)}-${Math.max(...bpmValues)}` : '--'}
            </Typography>
          </Box>
        </Box>
        
        {/* Detailed stats bar */}
        <Box sx={{ p: 1.5, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            <strong>Current BPM:</strong> {detectedBPM || '--'} | 
            <strong> Confidence:</strong> {Math.round(confidence * 100)}% |
            <strong> 60s Average:</strong> {bpmHistory.length > 0 ? 
              Math.round(bpmHistory.reduce((sum, entry) => sum + entry.bpm, 0) / bpmHistory.length) : '--'} BPM |
            <strong> Stability:</strong> {bpmHistoryRef.current.length}/5 beats |
            <strong> Data Points:</strong> {bpmHistory.length}/60
          </Typography>
        </Box>
      </Paper>
    );
  });
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* BPM Stream Graph - MAIN VIEW AT TOP */}
      {showGraph && <BPMStreamGraph />}
      
      <Card elevation={3} sx={{ mt: 2 }}>
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
          
          {/* Compact BPM Display */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
              {detectedBPM || '--'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Current BPM
            </Typography>
            
            {confidence > 0 && (
              <Box sx={{ mt: 1, maxWidth: 400, mx: 'auto' }}>
                <Typography variant="body2" color="text.secondary">
                  Confidence: {Math.round(confidence * 100)}%
                  {bpmHistoryRef.current.length > 0 && ` | Stability: ${bpmHistoryRef.current.length}/5`}
                </Typography>
                {/* LinearProgress removed per user request */}
              </Box>
            )}
          </Box>
        
        {/* Audio Level and Spectral Activity Indicators */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Audio Input Level
          </Typography>
          {/* LinearProgress removed per user request */}
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
            {audioLevel > 0.1 ? '🎵 Audio detected' : '🔇 No audio - try playing louder'}
          </Typography>
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
          <Stack direction="row" spacing={2} alignItems="center">
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
            <FormControlLabel
              control={
                <Switch
                  checked={showGraph}
                  onChange={(e) => setShowGraph(e.target.checked)}
                  color="primary"
                />
              }
              label="Show BPM graph"
            />
          </Stack>
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
          <Paper elevation={1} sx={{ p: 2, backgroundColor: theme.palette.background.default, mb: 2 }}>
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
            <strong>Enhanced Live BPM Detection with Prominent Real-Time Graph:</strong>
          </Typography>
          <Typography variant="caption" component="div" sx={{ mt: 1 }}>
            1. Click "Start Listening" and allow microphone access<br/>
            2. Start playing with consistent beats (drums, claps, or metronome)<br/>
            3. Watch audio level respond - green is optimal<br/>
            4. BPM appears after 4+ consistent beats with confidence bar<br/>
            5. <strong>Large real-time graph at the top</strong> shows BPM changes over the last 60 seconds<br/>
            6. Color-coded dots show detection confidence (green/yellow/red)
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Graph Features (Main View):</strong>
          </Typography>
          <Typography variant="caption" component="div">
            • <strong>Prominent Display:</strong> Large 900x300px graph as the primary interface<br/>
            • <strong>Live Updates:</strong> Updates every second with new BPM data<br/>
            • <strong>Confidence Visualization:</strong> Dot colors indicate detection quality<br/>
            • <strong>Current BPM Line:</strong> Dashed line shows current detected BPM<br/>
            • <strong>Comprehensive Stats:</strong> Shows average, range, stability, and data points<br/>
            • <strong>Confidence Area:</strong> Light blue area shows overall confidence level<br/>
            • <strong>Toggle Control:</strong> Use "Show BPM graph" switch to hide/show the main graph
          </Typography>
        </Alert>
        </CardContent>
      </Card>
    </Box>
  );
});

export default LiveBPMDetector;
