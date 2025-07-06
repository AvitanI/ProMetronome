// Pre-compiled constants and utilities for AOT optimization
// These will be processed at build-time rather than runtime

// Pre-computed audio frequencies for better performance
export const AUDIO_FREQUENCIES = {
  classic: 800,
  wood: 1000,
  electronic: 1200,
  sine: 600,
};

// Pre-computed time signature calculations
export const TIME_SIGNATURE_CALCULATIONS = {
  '4/4': { beats: 4, noteValue: 4, beatsPerMinute: (bpm) => bpm },
  '3/4': { beats: 3, noteValue: 4, beatsPerMinute: (bpm) => bpm },
  '2/4': { beats: 2, noteValue: 4, beatsPerMinute: (bpm) => bpm },
  '6/8': { beats: 6, noteValue: 8, beatsPerMinute: (bpm) => bpm * 2 },
  '9/8': { beats: 9, noteValue: 8, beatsPerMinute: (bpm) => bpm * 2 },
  '12/8': { beats: 12, noteValue: 8, beatsPerMinute: (bpm) => bpm * 2 },
};

// Pre-computed BPM ranges for validation
export const BPM_CONSTRAINTS = {
  MIN: 30,
  MAX: 300,
  DEFAULT: 120,
  STEP: 1,
  LARGE_STEP: 10,
};

// Pre-computed audio context settings
export const AUDIO_SETTINGS = {
  SAMPLE_RATE: 44100,
  BUFFER_SIZE: 4096,
  LOOKAHEAD_TIME: 25.0,
  SCHEDULE_AHEAD_TIME: 0.1,
  MOBILE_LOOKAHEAD: 10.0,
  MOBILE_SCHEDULE_AHEAD: 0.25,
};

// Pre-computed theme color combinations
export const THEME_COLORS = {
  light: {
    primary: '#1976d2',
    secondary: '#dc004e',
    background: '#ffffff',
    paper: '#f5f5f5',
  },
  dark: {
    primary: '#90caf9',
    secondary: '#f48fb1', 
    background: '#121212',
    paper: '#1e1e1e',
  },
};

// Pre-computed animation durations (in ms)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  PULSE: (bpm) => (60 / bpm) * 1000,
};

// Pre-computed regex patterns for performance
export const PATTERNS = {
  MOBILE_DEVICE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i,
  AUDIO_FORMAT: /\.(mp3|wav|ogg|m4a)$/i,
  BPM_NUMBER: /^\d{1,3}$/,
};

// Memoized formatters (will be optimized at build time)
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatDuration = (duration) => {
  const minutes = Math.floor(duration / (1000 * 60));
  const seconds = Math.floor((duration % (1000 * 60)) / 1000);
  return `${minutes}m ${seconds}s`;
};

// Pre-computed validation functions
export const isValidBPM = (bpm) => 
  bpm >= BPM_CONSTRAINTS.MIN && bpm <= BPM_CONSTRAINTS.MAX;

export const clampBPM = (bpm) => 
  Math.max(BPM_CONSTRAINTS.MIN, Math.min(BPM_CONSTRAINTS.MAX, bpm));
