import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';

// Import contexts
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';

// Main App Screens
import StudentTabNavigator from './StudentTabNavigator';
import CounsellorTabNavigator from './CounsellorTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';

const Stack = createStackNavigator();

// Loading component that matches web
const LoadingScreen = ({ message = "Loading..." }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <ActivityIndicator size="large" color="#1976d2" />
    <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>{message}</Text>
  </View>
);

export default function AppNavigator() {
  const { user, userRole, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return <LoadingScreen message="Loading application..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth flow - not logged in
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        </>
      ) : (
        // Main app flow - logged in
        <>
          {userRole === 'student' && (
            <Stack.Screen name="StudentApp" component={StudentTabNavigator} />
          )}
          {userRole === 'counsellor' && (
            <Stack.Screen name="CounsellorApp" component={CounsellorTabNavigator} />
          )}
          {userRole === 'admin' && (
            <Stack.Screen name="AdminApp" component={AdminTabNavigator} />
          )}
          {!userRole && (
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}