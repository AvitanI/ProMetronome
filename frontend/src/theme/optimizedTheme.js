import { createTheme } from '@mui/material/styles';

// Animation durations constant
const ANIMATION_DURATIONS = {
  NORMAL: 250,
};

// Pre-computed theme objects for AOT optimization
const LIGHT_THEME_BASE = {
  palette: {
    mode: 'light',
    primary: {
      main: '#6200ea',
      light: '#7c4dff',
      dark: '#3700b3',
    },
    secondary: {
      main: '#00695c',
      light: '#4db6ac',
      dark: '#004d40',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
    accent: {
      main: '#f44336',
    },
    beat: {
      active: '#2e7d32',
      inactive: '#e0e0e0',
    },
  },
};

const DARK_THEME_BASE = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#bb86fc',
      light: '#d1c4e9',
      dark: '#9c27b0',
    },
    secondary: {
      main: '#03dac6',
      light: '#4db6ac',
      dark: '#00695c',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
    accent: {
      main: '#ff5722',
    },
    beat: {
      active: '#4caf50',
      inactive: '#424242',
    },
  },
};

// Pre-compiled component styles for better performance
const COMMON_COMPONENT_OVERRIDES = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        textTransform: 'none',
        fontWeight: 600,
        transition: `all ${ANIMATION_DURATIONS.NORMAL}ms ease`,
        '&:hover': {
          transform: 'translateY(-1px)',
        },
      },
    },
  },
  MuiFab: {
    styleOverrides: {
      root: {
        transition: `all ${ANIMATION_DURATIONS.NORMAL}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        '&:hover': {
          transform: 'scale(1.05)',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        transition: `all ${ANIMATION_DURATIONS.NORMAL}ms ease`,
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      elevation2: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
        },
      },
      elevation8: {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
        '&:hover': {
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 500,
      },
    },
  },
  // Removed MuiSlider overrides - using custom ThumblessSlider instead
};

// Memoized theme creation - these will be cached at build time
let lightThemeCache = null;
let darkThemeCache = null;

const createCustomTheme = (isDarkMode) => {
  if (isDarkMode) {
    if (!darkThemeCache) {
      darkThemeCache = createTheme({
        ...DARK_THEME_BASE,
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 600 },
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        components: COMMON_COMPONENT_OVERRIDES,
        breakpoints: {
          values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
          },
        },
      });
    }
    return darkThemeCache;
  } else {
    if (!lightThemeCache) {
      lightThemeCache = createTheme({
        ...LIGHT_THEME_BASE,
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 600 },
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        components: COMMON_COMPONENT_OVERRIDES,
        breakpoints: {
          values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
          },
        },
      });
    }
    return lightThemeCache;
  }
};

export default createCustomTheme;
