// src/styles/theme.ts
import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2A5C82',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF6B6B',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3A86FF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFBE0B',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
  },
});

export default lightTheme; // Exportamos lightTheme como tema por defecto