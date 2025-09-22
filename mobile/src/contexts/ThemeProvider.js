import React, { createContext, useContext } from 'react';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976d2',
    secondary: '#dc004e',
    tertiary: '#1976d2',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    background: '#ffffff',
    onBackground: '#1c1b1f',
    onSurface: '#1c1b1f',
    onSurfaceVariant: '#49454f',
    outline: '#79747e',
    primaryContainer: '#e3f2fd',
    secondaryContainer: '#fce4ec',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    onErrorContainer: '#410002',
  },
  roundness: 12,
  fonts: {
    ...MD3LightTheme.fonts,
  },
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const value = {
    theme,
    colors: theme.colors,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
    typography: {
      h1: { fontSize: 28, fontWeight: 'bold' },
      h2: { fontSize: 24, fontWeight: 'bold' },
      h3: { fontSize: 20, fontWeight: 'bold' },
      h4: { fontSize: 18, fontWeight: '600' },
      h5: { fontSize: 16, fontWeight: '600' },
      h6: { fontSize: 14, fontWeight: '600' },
      body1: { fontSize: 16 },
      body2: { fontSize: 14 },
      caption: { fontSize: 12 },
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={theme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};