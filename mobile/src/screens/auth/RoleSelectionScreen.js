import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Text, Button, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';

export default function RoleSelectionScreen({ navigation }) {
  const { setUserRole } = useAuth();

  const roles = [
    {
      id: 'student',
      title: 'Student',
      description: 'Access mental health resources, assessments, and support',
      icon: 'school',
      color: '#1976d2'
    },
    {
      id: 'counsellor',
      title: 'Counsellor',
      description: 'Provide support and manage student sessions',
      icon: 'psychology',
      color: '#388e3c'
    },
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Manage the platform and monitor activities',
      icon: 'admin-panel-settings',
      color: '#d32f2f'
    }
  ];

  const handleRoleSelect = (roleId) => {
    setUserRole(roleId);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.header}>
        <Icon name="person" size={48} color="#1976d2" />
        <Title style={styles.title}>Select Your Role</Title>
        <Text style={styles.subtitle}>
          Choose how you'll be using the Mental Wellness Platform
        </Text>
      </Surface>

      <View style={styles.rolesContainer}>
        {roles.map((role) => (
          <Card 
            key={role.id} 
            style={[styles.roleCard, { borderColor: role.color }]}
            onPress={() => handleRoleSelect(role.id)}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Icon name={role.icon} size={40} color={role.color} />
              </View>
              <Title style={[styles.roleTitle, { color: role.color }]}>
                {role.title}
              </Title>
              <Text style={styles.roleDescription}>{role.description}</Text>
              <Button
                mode="contained"
                style={[styles.selectButton, { backgroundColor: role.color }]}
                onPress={() => handleRoleSelect(role.id)}
              >
                Select {role.title}
              </Button>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  rolesContainer: {
    gap: 16,
  },
  roleCard: {
    borderWidth: 2,
    borderRadius: 12,
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  selectButton: {
    width: '100%',
    borderRadius: 8,
  },
});