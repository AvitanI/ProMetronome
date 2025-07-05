// Build-time environment configuration
const pkg = require('../package.json');

// These constants will be replaced at build time
const BUILD_CONFIG = {
  VERSION: pkg.version,
  BUILD_DATE: new Date().toISOString(),
  NODE_ENV: process.env.NODE_ENV || 'development',
  ENABLE_DEVTOOLS: process.env.NODE_ENV !== 'production',
  ENABLE_CONSOLE_LOGS: process.env.NODE_ENV !== 'production',
  APP_NAME: pkg.name,
  DESCRIPTION: pkg.description,
  
  // Performance settings
  LAZY_LOAD_DELAY: 100,
  DEBOUNCE_DELAY: 100,
  ANIMATION_DISABLED: false,
  
  // Feature flags (can be toggled at build time)
  FEATURES: {
    LIVE_BPM_DETECTOR: true,
    COACH_MODE: true,
    SONG_MANAGER: true,
    ANALYTICS: process.env.NODE_ENV === 'production',
    PWA: true,
  },
  
  // Audio settings
  AUDIO: {
    DEFAULT_VOLUME: 0.7,
    MAX_BPM: 300,
    MIN_BPM: 30,
    DEFAULT_BPM: 120,
  },
};

export default BUILD_CONFIG;
