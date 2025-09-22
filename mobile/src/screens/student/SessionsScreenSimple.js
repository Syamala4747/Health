import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Title, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function SessionsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Icon name="event" size={64} color="#1976d2" />
        <Title style={styles.title}>Sessions</Title>
        <Text style={styles.subtitle}>Book and manage counseling sessions</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginTop: 16,
    marginBottom: 8,
    color: '#1976d2',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});