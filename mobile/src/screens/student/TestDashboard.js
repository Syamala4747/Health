import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TestDashboard() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="heart-pulse" size={32} color="#1976d2" />
        <Text style={styles.title}>ZenCare Dashboard</Text>
      </View>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Welcome to ZenCare!</Text>
          <Text style={styles.cardText}>
            Your mental health and wellness companion. This is a test screen to verify the app is working correctly.
          </Text>
          <Button mode="contained" style={styles.button}>
            Get Started
          </Button>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actions}>
            <Button mode="outlined" style={styles.actionButton}>
              📊 Take Assessment
            </Button>
            <Button mode="outlined" style={styles.actionButton}>
              🎯 View Resources
            </Button>
            <Button mode="outlined" style={styles.actionButton}>
              💬 Chat with AI
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1976d2',
  },
  card: {
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    marginBottom: 5,
  },
});