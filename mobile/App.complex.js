import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import contexts to match web app
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeProvider';

// Import navigation
import AppNavigator from './src/navigation/AppNavigator';

// Material Design 3 theme matching web app
const mobileTheme = {
  colors: {
    primary: '#1976d2', // Main blue
    secondary: '#dc004e', // Accent pink/red
    surface: '#ffffff',
    background: '#f5f5f5',
    onSurface: '#1a1a1a',
    onBackground: '#1a1a1a',
    outline: '#e0e0e0',
    surfaceVariant: '#f8f9fa',
    onSurfaceVariant: '#6c757d',
    primaryContainer: '#e3f2fd',
    onPrimaryContainer: '#0d47a1',
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#410002',
  },
  roundness: 12, // Consistent with web Material Design
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={mobileTheme}>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <NavigationContainer>
                <AppNavigator />
                <StatusBar 
                  style="light" 
                  backgroundColor="#1976d2" 
                  translucent={false}
                />
              </NavigationContainer>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}