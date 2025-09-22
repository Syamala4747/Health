import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';

// Simple theme
const simpleTheme = {
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e',
    surface: '#ffffff',
    background: '#f5f5f5',
  },
};

function SimpleContent() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ZenCare Mobile v2</Text>
      <Text style={styles.subtext}>Testing with React Native Paper</Text>
    </View>
  );
}

export default function App() {
  return (
    <PaperProvider theme={simpleTheme}>
      <SimpleContent />
      <StatusBar style="auto" />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});