import React, { useRef, useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import {
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Stack,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import {
  Brightness4,
  Brightness7,
  MusicNote,
  GitHub,
  Speed as SpeedIcon,
  LibraryMusic as LibraryMusicIcon,
  History as HistoryIcon,
  EmojiEvents as CoachIcon,
  Mic as MicIcon,
} from '@mui/icons-material';
import useMetronomeStore from './stores/metronomeStore';
import createCustomTheme from './theme/optimizedTheme';
import MetronomeControls from './components/MetronomeControls';
import globalAudioService from './services/globalAudioService';

// Lazy load heavy components
const SongManager = lazy(() => import('./components/SongManager'));
const History = lazy(() => import('./components/History'));
const CoachDashboard = lazy(() => import('./components/CoachDashboard'));
const LiveBPMDetector = lazy(() => import('./components/LiveBPMDetector'));

// Import version from package.json
const packageInfo = require('../package.json');

function App() {
  const { isDarkMode, toggleTheme } = useMetronomeStore();
  const theme = useMemo(() => createCustomTheme(isDarkMode), [isDarkMode]);
  const metronomeRef = useRef(null);
  const startMetronomeRef = useRef(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Initialize global audio service on app start
  useEffect(() => {
    globalAudioService.initialize();
    // Expose to window for debugging
    window.audioService = globalAudioService;
    console.log('Global audio service exposed as window.audioService');
  }, []);

  // Handle song play: scroll to metronome and start it
  const handlePlaySong = useCallback(() => {
    // Switch to metronome tab first
    setCurrentTab(0);
    
    // Scroll to metronome
    if (metronomeRef.current) {
      metronomeRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
    
    // Start metronome after a short delay to allow scroll
    setTimeout(() => {
      if (startMetronomeRef.current) {
        startMetronomeRef.current.startMetronome();
      }
    }, 500);
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  // Loading component for lazy-loaded components
  const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <MusicNote sx={{ mr: 1, fontSize: 28 }} />
            <Typography 
              variant="h6" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              Pro Metronome
            </Typography>
            <Chip 
              label={`v${packageInfo.version}`}
              size="small"
              sx={{ 
                ml: 2, 
                fontSize: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton 
                color="inherit" 
                onClick={toggleTheme}
                sx={{ 
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'scale(1.05)',
                  }
                }}
              >
                {isDarkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="View Source Code">
              <IconButton 
                color="inherit"
                onClick={() => window.open('https://github.com', '_blank')}
                sx={{ 
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'scale(1.05)',
                  }
                }}
              >
                <GitHub />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          background: isDarkMode 
            ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a1a 100%)`
            : `linear-gradient(135deg, ${theme.palette.background.default} 0%, #f0f0f0 100%)`,
          py: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="md">
          {/* Navigation Tabs */}
          <Paper
            elevation={2}
            sx={{
              mb: 3,
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              centered
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                },
              }}
            >
              <Tab
                icon={<SpeedIcon />}
                label="Metronome"
                iconPosition="start"
              />
              <Tab
                icon={<LibraryMusicIcon />}
                label="Songs"
                iconPosition="start"
              />
              <Tab
                icon={<MicIcon />}
                label="BPM Detector"
                iconPosition="start"
              />
              <Tab
                icon={<CoachIcon />}
                label="Coach"
                iconPosition="start"
              />
              <Tab
                icon={<HistoryIcon />}
                label="History"
                iconPosition="start"
              />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          <Box sx={{ minHeight: '60vh' }}>
            {currentTab === 0 && (
              <Stack
                spacing={3}
                direction="column"
                alignItems="center"
                justifyContent="center"
                sx={{ 
                  maxWidth: 600,
                  margin: '0 auto',
                  width: '100%'
                }}
              >
                <Box ref={metronomeRef} sx={{ width: '100%' }}>
                  <MetronomeControls ref={startMetronomeRef} />
                </Box>
              </Stack>
            )}

            {currentTab === 1 && (
              <Suspense fallback={<LoadingFallback />}>
                <SongManager onPlaySong={handlePlaySong} />
              </Suspense>
            )}

            {currentTab === 2 && (
              <Suspense fallback={<LoadingFallback />}>
                <LiveBPMDetector />
              </Suspense>
            )}

            {currentTab === 3 && (
              <Suspense fallback={<LoadingFallback />}>
                <CoachDashboard />
              </Suspense>
            )}

            {currentTab === 4 && (
              <Suspense fallback={<LoadingFallback />}>
                <History />
              </Suspense>
            )}
          </Box>

          {/* Footer */}
          <Paper
            elevation={1}
            sx={{
              mt: 4,
              p: 2,
              textAlign: 'center',
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Professional Metronome App • Built with React & Material UI
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Perfect for musicians, drummers, and music practice
            </Typography>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
