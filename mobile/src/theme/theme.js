import { DefaultTheme } from 'react-native-paper';

export const zenCareTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#7c3aed', // Lavender purple (matching web)
    primaryContainer: '#a855f7',
    secondary: '#06b6d4', // Cyan (matching web)
    secondaryContainer: '#22d3ee',
    tertiary: '#5b21b6',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    background: '#f8fafc',
    error: '#dc2626',
    errorContainer: '#fef2f2',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#111827',
    onSurfaceVariant: '#6b7280',
    onBackground: '#111827',
    outline: '#d1d5db',
    surfaceDisabled: '#f3f4f6',
    onSurfaceDisabled: '#9ca3af',
    notification: '#dc2626',
    success: '#10b981',
    warning: '#f59e0b',
  },
  roundness: 8, // Matching web app
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'Inter',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'Inter',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'Inter',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'Inter',
      fontWeight: '100',
    },
  },
};

export const colors = {
  primary: '#7c3aed',
  primaryLight: '#a855f7',
  primaryDark: '#5b21b6',
  secondary: '#06b6d4',
  secondaryLight: '#22d3ee',
  secondaryDark: '#0891b2',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#F44336',
  crisis: '#D32F2F',
};