import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

// Counsellor Screens
import CounsellorDashboardScreen from '../screens/counsellor/CounsellorDashboardScreen';
import CounsellorProfileScreen from '../screens/counsellor/CounsellorProfileScreen';
import CounsellorBookingsScreen from '../screens/counsellor/CounsellorBookingsScreen';

const Tab = createBottomTabNavigator();

export default function CounsellorTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar-check' : 'calendar-check-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.secondary,
        },
        headerStyle: {
          backgroundColor: theme.colors.secondary,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={CounsellorDashboardScreen}
        options={{ title: 'ZenCare Pro' }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={CounsellorBookingsScreen}
        options={{ title: 'My Sessions' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={CounsellorProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}