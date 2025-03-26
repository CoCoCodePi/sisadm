// src/contexts/ThemeContext.tsx
import { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider } from '@mui/material';
import { lightTheme, darkTheme } from '../styles/theme';

type ThemeContextType = {
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const theme = useMemo(() => 
    isDarkMode ? darkTheme : lightTheme,
  [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ toggleTheme, isDarkMode }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);