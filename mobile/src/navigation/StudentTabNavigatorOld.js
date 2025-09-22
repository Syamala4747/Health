import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

// Test screen for now
import TestDashboard from '../screens/student/TestDashboard';

// Simple placeholder screens
const PlaceholderScreen = ({ title }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialCommunityIcons name="construction" size={64} color="#1976d2" />
    <Text style={{ fontSize: 18, marginTop: 10, color: '#333' }}>{title}</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>Coming Soon!</Text>
  </View>
);

const ResourcesScreen = () => <PlaceholderScreen title="Resources" />;
const ChatbotScreen = () => <PlaceholderScreen title="AI Chatbot" />;
const SessionsScreen = () => <PlaceholderScreen title="Sessions" />;
const ProfileScreen = () => <PlaceholderScreen title="Profile" />;

const Tab = createBottomTabNavigator();

export default function StudentTabNavigator() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Resources') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'robot' : 'robot-outline';
          } else if (route.name === 'Sessions') {
            iconName = focused ? 'calendar-check' : 'calendar-check-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
        },
        headerStyle: {
          backgroundColor: '#1976d2',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={TestDashboard}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Resources" 
        component={ResourcesScreen}
        options={{ title: 'Resources' }}
      />
      <Tab.Screen 
        name="Chatbot" 
        component={ChatbotScreen}
        options={{ title: 'AI Chat' }}
      />
      <Tab.Screen 
        name="Sessions" 
        component={SessionsScreen}
        options={{ title: 'Sessions' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}