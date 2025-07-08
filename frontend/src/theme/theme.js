import { createTheme } from '@mui/material/styles';

const createCustomTheme = (isDarkMode) => {
  return createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#bb86fc' : '#6200ea',
        light: isDarkMode ? '#d1c4e9' : '#7c4dff',
        dark: isDarkMode ? '#9c27b0' : '#3700b3',
      },
      secondary: {
        main: isDarkMode ? '#03dac6' : '#00695c',
        light: isDarkMode ? '#4db6ac' : '#4db6ac',
        dark: isDarkMode ? '#00695c' : '#004d40',
      },
      background: {
        default: isDarkMode ? '#121212' : '#fafafa',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#1a1a1a',
        secondary: isDarkMode ? '#b3b3b3' : '#666666',
      },
      accent: {
        main: isDarkMode ? '#ff5722' : '#f44336',
      },
      beat: {
        active: isDarkMode ? '#4caf50' : '#2e7d32',
        inactive: isDarkMode ? '#424242' : '#e0e0e0',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        '@media (max-width:600px)': {
          fontSize: '2rem',
        },
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
        '@media (max-width:600px)': {
          fontSize: '1.5rem',
        },
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.4,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 8,
            padding: '10px 24px',
          },
          contained: {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDarkMode 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      // Removed MuiSlider overrides - using custom ThumblessSlider instead
      MuiFab: {
        styleOverrides: {
          root: {
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
    },
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
};

export default createCustomTheme;
