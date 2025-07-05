import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Pause as PauseIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import useMetronomeStore from '../stores/metronomeStore';
import globalAudioService from '../services/globalAudioService';

// Predefined coach exercises
const COACH_EXERCISES = {
  progressiveBPM: {
    id: 'progressive-bpm',
    name: 'Progressive BPM Trainer',
    description: 'Gradually increase tempo to build speed and maintain accuracy',
    icon: <TrendingUpIcon />,
    difficulty: 'beginner',
    estimatedTime: '5-15 min',
    type: 'tempo'
  },
  steadyState: {
    id: 'steady-state',
    name: 'Steady State Practice',
    description: 'Maintain consistent tempo for extended periods',
    icon: <SpeedIcon />,
    difficulty: 'intermediate',
    estimatedTime: '10-30 min',
    type: 'endurance'
  },
  tempoMemory: {
    id: 'tempo-memory',
    name: 'Tempo Memory Test',
    description: 'Remember and replicate specific BPM without visual cues',
    icon: <TimerIcon />,
    difficulty: 'advanced',
    estimatedTime: '5-10 min',
    type: 'accuracy'
  }
};

const CoachDashboard = () => {
  const {
    coachMode,
    startCoachExercise,
    stopCoachExercise,
    updateCoachProgress,
    bpm,
    setBpm,
    isPlaying,
    setIsPlaying
  } = useMetronomeStore();

  console.log('CoachDashboard render - coachMode:', coachMode, 'isPlaying:', isPlaying, 'bpm:', bpm);

  const [selectedExercise, setSelectedExercise] = useState(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [exerciseConfig, setExerciseConfig] = useState({
    startBPM: 100,
    endBPM: 140,
    stepSize: 5,
    stepDuration: 60, // seconds
    autoProgression: true
  });

  // Progressive BPM Exercise Logic
  useEffect(() => {
    if (coachMode.isActive && coachMode.currentExercise?.id === 'progressive-bpm' && isPlaying) {
      const config = coachMode.currentExercise.config;
      const progress = coachMode.sessionProgress;
      
      if (!progress || !config.endBPM) return;  // Added check for config

      const interval = setInterval(() => {
        const elapsedTime = (Date.now() - progress.startTime) / 1000;
        const currentStepTime = elapsedTime % config.stepDuration;
        const currentStepIndex = Math.floor(elapsedTime / config.stepDuration);
        const targetBPM = Math.min(
          config.startBPM + (currentStepIndex * config.stepSize),
          config.endBPM
        );

        // Update BPM if we're in a new step
        if (bpm !== targetBPM && targetBPM <= config.endBPM) {
          setBpm(targetBPM);
          updateCoachProgress({
            currentStep: currentStepIndex,
            completedSteps: currentStepIndex,
            currentBPM: targetBPM,
            accuracy: calculateAccuracy(), // Placeholder
            timestamp: Date.now()
          });
        }

        // Check if exercise is complete
        if (targetBPM >= config.endBPM && currentStepTime >= config.stepDuration) {
          stopCoachExercise();
          setIsPlaying(false);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [coachMode.isActive, coachMode.currentExercise, coachMode.sessionProgress, isPlaying, bpm, setBpm, updateCoachProgress, stopCoachExercise, setIsPlaying]);

  // Steady State Exercise Logic
  useEffect(() => {
    if (coachMode.isActive && coachMode.currentExercise?.id === 'steady-state' && isPlaying) {
      const config = coachMode.currentExercise.config;
      const progress = coachMode.sessionProgress;
      
      if (!progress || !config.duration) return;

      const interval = setInterval(() => {
        const elapsedTime = (Date.now() - progress.startTime) / 1000;
        const progressPercent = Math.min((elapsedTime / config.duration) * 100, 100);

        updateCoachProgress({
          currentStep: 0,
          completedSteps: progressPercent === 100 ? 1 : 0,
          currentBPM: bpm,
          accuracy: calculateAccuracy(),
          timestamp: Date.now()
        });

        // Check if exercise is complete
        if (elapsedTime >= config.duration) {
          stopCoachExercise();
          setIsPlaying(false);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [coachMode.isActive, coachMode.currentExercise, coachMode.sessionProgress, isPlaying, bpm, updateCoachProgress, stopCoachExercise, setIsPlaying]);

  // Tempo Memory Exercise Logic
  useEffect(() => {
    if (coachMode.isActive && coachMode.currentExercise?.id === 'tempo-memory' && isPlaying) {
      const config = coachMode.currentExercise.config;
      const progress = coachMode.sessionProgress;
      
      if (!progress || !config.testDuration) return;

      const interval = setInterval(() => {
        const elapsedTime = (Date.now() - progress.startTime) / 1000;
        const progressPercent = Math.min((elapsedTime / config.testDuration) * 100, 100);

        updateCoachProgress({
          currentStep: 0,
          completedSteps: progressPercent === 100 ? 1 : 0,
          currentBPM: bpm,
          accuracy: calculateAccuracy(),
          timestamp: Date.now()
        });

        // Check if exercise is complete
        if (elapsedTime >= config.testDuration) {
          stopCoachExercise();
          setIsPlaying(false);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [coachMode.isActive, coachMode.currentExercise, coachMode.sessionProgress, isPlaying, bpm, updateCoachProgress, stopCoachExercise, setIsPlaying]);

  const calculateAccuracy = () => {
    // Placeholder for timing accuracy calculation
    // In a real implementation, this would analyze microphone input
    return 85 + Math.random() * 10; // Mock accuracy between 85-95%
  };

  const handleStartExercise = (exerciseKey) => {
    console.log('handleStartExercise called with key:', exerciseKey);
    const exercise = COACH_EXERCISES[exerciseKey];
    console.log('Exercise found:', exercise);
    setSelectedExercise({ ...exercise, key: exerciseKey });
    
    if (exerciseKey === 'progressiveBPM') {  // Note: this should match the key from COACH_EXERCISES
      console.log('Opening config dialog for progressive BPM');
      setConfigDialogOpen(true);
    } else if (exerciseKey === 'steadyState') {
      console.log('Starting steady state exercise');
      // Start steady state with current BPM for 10 minutes
      startExercise({ ...exercise, key: exerciseKey }, {
        targetBPM: bpm,
        duration: 600 // 10 minutes
      });
    } else if (exerciseKey === 'tempoMemory') {
      console.log('Starting tempo memory exercise');
      // Start tempo memory test with current BPM
      startExercise({ ...exercise, key: exerciseKey }, {
        targetBPM: bpm,
        testDuration: 300 // 5 minutes
      });
    } else {
      console.log('Starting default exercise');
      // Start other exercises with default config
      startExercise({ ...exercise, key: exerciseKey }, {});
    }
  };

  const startExercise = async (exercise, config) => {
    console.log('Starting exercise:', exercise.name, 'with config:', config);
    
    const totalSteps = exercise.key === 'progressiveBPM'  // Updated to match object key
      ? Math.ceil((config.endBPM - config.startBPM) / config.stepSize) + 1
      : 1;

    console.log('Total steps calculated:', totalSteps);

    startCoachExercise({
      ...exercise,
      config,
      totalSteps,
      startTime: Date.now()
    });

    console.log('Coach exercise started, setting BPM and starting metronome...');

    // Set initial BPM for progressive exercises
    if (exercise.key === 'progressiveBPM') {
      setBpm(config.startBPM);
    }

    // Initialize and start the global audio service
    await globalAudioService.initialize();
    await startAudioService();

    setConfigDialogOpen(false);
  };

  const handleStopExercise = () => {
    globalAudioService.stop();
    stopCoachExercise();
    setIsPlaying(false);
  };

  const handlePauseExercise = () => {
    if (isPlaying) {
      globalAudioService.stop();
      setIsPlaying(false);
    } else {
      // Resume - restart the audio service
      startAudioService();
    }
  };

  const startAudioService = async () => {
    try {
      const state = useMetronomeStore.getState();
      const success = await globalAudioService.start(
        state.bpm,
        state.timeSignature.beats,
        state.accentFirstBeat,
        state.clickSound.id,
        state.volume,
        state.subdivision.value,
        state.subdivisionVolume
      );
      
      if (success) {
        setIsPlaying(true);
      } else {
        console.error('Failed to resume global audio service');
      }
    } catch (error) {
      console.error('Error resuming audio service:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentProgress = () => {
    if (!coachMode.isActive || !coachMode.sessionProgress) return 0;
    
    const exercise = coachMode.currentExercise;
    const progress = coachMode.sessionProgress;
    
    if (exercise?.id === 'progressive-bpm') {
      const { totalSteps } = exercise;
      return totalSteps ? (progress.completedSteps / totalSteps) * 100 : 0;
    } else if (exercise?.id === 'steady-state') {
      const elapsedTime = (Date.now() - progress.startTime) / 1000;
      const duration = exercise.config?.duration || 600;
      return Math.min((elapsedTime / duration) * 100, 100);
    } else if (exercise?.id === 'tempo-memory') {
      const elapsedTime = (Date.now() - progress.startTime) / 1000;
      const duration = exercise.config?.testDuration || 300;
      return Math.min((elapsedTime / duration) * 100, 100);
    }
    
    return 0;
  };

  const getSessionDuration = () => {
    if (!coachMode.sessionProgress) return 0;
    return Math.floor((Date.now() - coachMode.sessionProgress.startTime) / 1000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        🎯 Coach Mode
      </Typography>

      {/* Active Exercise Display */}
      {coachMode.isActive && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Active Exercise: {coachMode.currentExercise?.name}
          </Typography>
          
          {/* Exercise-specific info */}
          {coachMode.currentExercise?.id === 'progressive-bpm' && (
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Target: {coachMode.currentExercise.config.startBPM} → {coachMode.currentExercise.config.endBPM} BPM 
              (Step: +{coachMode.currentExercise.config.stepSize} every {coachMode.currentExercise.config.stepDuration}s)
            </Typography>
          )}
          {coachMode.currentExercise?.id === 'steady-state' && (
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Maintain {bpm} BPM for {Math.floor(coachMode.currentExercise.config.duration / 60)} minutes
            </Typography>
          )}
          {coachMode.currentExercise?.id === 'tempo-memory' && (
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Remember and maintain {bpm} BPM for {Math.floor(coachMode.currentExercise.config.testDuration / 60)} minutes
            </Typography>
          )}
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <SpeedIcon />
                <Typography variant="h4">{bpm} BPM</Typography>
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={getCurrentProgress()} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#4caf50'
                  }
                }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Progress: {Math.round(getCurrentProgress())}% • Time: {formatTime(getSessionDuration())}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="contained"
                  startIcon={isPlaying ? <PauseIcon /> : <PlayIcon />}
                  onClick={handlePauseExercise}
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  {isPlaying ? 'Pause' : 'Resume'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<StopIcon />}
                  onClick={handleStopExercise}
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Stop
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Exercise Cards */}
      {!coachMode.isActive && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Choose Your Training Exercise
          </Typography>
          
          <Grid container spacing={3}>
            {Object.entries(COACH_EXERCISES).map(([key, exercise]) => (
              <Grid item xs={12} md={4} key={key}>
                <Card 
                  elevation={2}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {exercise.icon}
                      <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
                        {exercise.name}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {exercise.description}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip 
                        label={exercise.difficulty} 
                        size="small" 
                        color={getDifficultyColor(exercise.difficulty)}
                      />
                      <Chip label={exercise.estimatedTime} size="small" variant="outlined" />
                    </Stack>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      variant="contained"
                      startIcon={<PlayIcon />}
                      onClick={() => handleStartExercise(key)}
                      fullWidth
                    >
                      Start Exercise
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Recent Sessions */}
      {coachMode.history && coachMode.history.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Recent Coach Sessions
          </Typography>
          
          <Paper elevation={1} sx={{ maxHeight: 300, overflow: 'auto' }}>
            <List>
              {coachMode.history.slice(-5).reverse().map((session, index) => (
                <React.Fragment key={session.id}>
                  <ListItem>
                    <ListItemIcon>
                      {session.success ? <TrophyIcon color="success" /> : <TimerIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={session.exercise?.name || 'Unknown Exercise'}
                      secondary={`${formatTime(Math.floor(session.duration / 1000))} • ${session.completedSteps} steps completed • ${new Date(session.endTime).toLocaleDateString()}`}
                    />
                  </ListItem>
                  {index < coachMode.history.slice(-5).length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      {/* Configuration Dialog for Progressive BPM */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Progressive BPM Exercise</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start BPM"
                  type="number"
                  value={exerciseConfig.startBPM}
                  onChange={(e) => setExerciseConfig(prev => ({ ...prev, startBPM: parseInt(e.target.value) }))}
                  fullWidth
                  inputProps={{ min: 40, max: 200 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End BPM"
                  type="number"
                  value={exerciseConfig.endBPM}
                  onChange={(e) => setExerciseConfig(prev => ({ ...prev, endBPM: parseInt(e.target.value) }))}
                  fullWidth
                  inputProps={{ min: 40, max: 220 }}
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Step Size (BPM)"
                  type="number"
                  value={exerciseConfig.stepSize}
                  onChange={(e) => setExerciseConfig(prev => ({ ...prev, stepSize: parseInt(e.target.value) }))}
                  fullWidth
                  inputProps={{ min: 1, max: 20 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Step Duration (seconds)"
                  type="number"
                  value={exerciseConfig.stepDuration}
                  onChange={(e) => setExerciseConfig(prev => ({ ...prev, stepDuration: parseInt(e.target.value) }))}
                  fullWidth
                  inputProps={{ min: 10, max: 300 }}
                />
              </Grid>
            </Grid>

            <Alert severity="info">
              This exercise will start at {exerciseConfig.startBPM} BPM and increase by {exerciseConfig.stepSize} BPM every {exerciseConfig.stepDuration} seconds until reaching {exerciseConfig.endBPM} BPM.
              <br />
              Estimated duration: {formatTime(Math.ceil((exerciseConfig.endBPM - exerciseConfig.startBPM) / exerciseConfig.stepSize) * exerciseConfig.stepDuration)}
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => startExercise(selectedExercise, exerciseConfig)}
            disabled={exerciseConfig.startBPM >= exerciseConfig.endBPM}
          >
            Start Exercise
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoachDashboard;
