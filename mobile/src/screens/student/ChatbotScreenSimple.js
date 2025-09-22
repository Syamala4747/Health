import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Title, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ChatbotScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Icon name="chat" size={64} color="#1976d2" />
        <Title style={styles.title}>AI Assistant</Title>
        <Text style={styles.subtitle}>Chat with our AI mental health assistant</Text>
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