import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../contexts/ThemeProvider';
import { useLanguage } from '../contexts/LanguageContext';

// Import screens - use simple versions first
import StudentDashboard from '../screens/student/StudentDashboard';
import ResourcesScreen from '../screens/student/ResourcesScreenOld';
import ChatbotScreen from '../screens/student/ChatbotScreenEnhanced';
import SessionsScreen from '../screens/student/SessionsScreenSimple';
import ProfileScreen from '../screens/student/ProfileScreenSimple';

const Tab = createBottomTabNavigator();

export default function StudentTabNavigator() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Resources':
              iconName = 'library-books';
              break;
            case 'Chatbot':
              iconName = 'chat';
              break;
            case 'Sessions':
              iconName = 'event';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors?.primary || '#1976d2',
        tabBarInactiveTintColor: colors?.onSurfaceVariant || '#666',
        tabBarStyle: {
          backgroundColor: colors?.surface || '#ffffff',
          borderTopColor: colors?.outline || '#e0e0e0',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors?.primary || '#1976d2',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={StudentDashboard}
        options={{
          title: t('dashboard'),
          headerTitle: 'Mental Wellness Platform'
        }}
      />
      <Tab.Screen 
        name="Resources" 
        component={ResourcesScreen}
        options={{
          title: t('resources'),
          headerTitle: t('resources')
        }}
      />
      <Tab.Screen 
        name="Chatbot" 
        component={ChatbotScreen}
        options={{
          title: t('chatbot'),
          headerTitle: 'AI Assistant'
        }}
      />
      <Tab.Screen 
        name="Sessions" 
        component={SessionsScreen}
        options={{
          title: t('sessions'),
          headerTitle: t('sessions')
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: t('profile'),
          headerTitle: t('profile')
        }}
      />
    </Tab.Navigator>
  );
}