import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { 
  Card, 
  Button, 
  Avatar, 
  Divider, 
  Switch, 
  List,
  IconButton,
  ProgressBar,
  Badge
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../../components/LanguageSelector';

const StatCard = ({ title, value, icon, color = "#1976d2" }) => (
  <Card style={styles.statCard}>
    <Card.Content style={styles.statContent}>
      <View style={styles.statIcon}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </Card.Content>
  </Card>
);

const SettingsItem = ({ icon, title, subtitle, onPress, rightComponent, divider = true }) => (
  <>
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <MaterialCommunityIcons name={icon} size={24} color="#666" />
        <View style={styles.settingsItemText}>
          <Text style={styles.settingsItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />}
    </TouchableOpacity>
    {divider && <Divider />}
  </>
);

const ProgressSection = ({ title, progress, items }) => (
  <Card style={styles.progressCard}>
    <Card.Content>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>{title}</Text>
        <Text style={styles.progressPercentage}>{Math.round(progress * 100)}%</Text>
      </View>
      <ProgressBar progress={progress} color="#4caf50" style={styles.progressBar} />
      <View style={styles.progressItems}>
        {items.map((item, index) => (
          <View key={index} style={styles.progressItem}>
            <MaterialCommunityIcons 
              name={item.completed ? "check-circle" : "circle-outline"} 
              size={16} 
              color={item.completed ? "#4caf50" : "#ccc"} 
            />
            <Text style={[
              styles.progressItemText,
              item.completed && styles.progressItemCompleted
            ]}>
              {item.title}
            </Text>
          </View>
        ))}
      </View>
    </Card.Content>
  </Card>
);

const AchievementBadge = ({ achievement }) => (
  <View style={styles.achievementBadge}>
    <View style={[styles.badgeIcon, { backgroundColor: achievement.color }]}>
      <MaterialCommunityIcons name={achievement.icon} size={20} color="#fff" />
    </View>
    <Text style={styles.badgeTitle}>{achievement.title}</Text>
    <Text style={styles.badgeDate}>{achievement.earnedDate}</Text>
  </View>
);

export default function EnhancedProfileScreen() {
  const { t, currentLanguage } = useLanguage();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [user, setUser] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@university.edu",
    avatar: null,
    joinDate: "January 2024",
    university: "State University",
    major: "Computer Science",
    year: "Sophomore",
    mentalHealthScore: 72,
    completedSessions: 8,
    resourcesViewed: 24,
    assessmentsTaken: 5
  });

  const wellnessProgress = [
    { title: "Complete Profile Setup", completed: true },
    { title: "Take Initial Assessment", completed: true },
    { title: "Attend First Session", completed: true },
    { title: "Complete Wellness Check-in", completed: false },
    { title: "Explore Resources Library", completed: true },
    { title: "Join Support Group", completed: false }
  ];

  const achievements = [
    {
      id: 1,
      title: "First Step",
      icon: "foot-print",
      color: "#4caf50",
      earnedDate: "Jan 15, 2024",
      description: "Completed your first wellness assessment"
    },
    {
      id: 2,
      title: "Consistent User",
      icon: "calendar-check",
      color: "#2196f3",
      earnedDate: "Jan 20, 2024",
      description: "Used the app for 7 consecutive days"
    },
    {
      id: 3,
      title: "Session Champion",
      icon: "account-group",
      color: "#ff9800",
      earnedDate: "Jan 25, 2024",
      description: "Completed 5 counseling sessions"
    }
  ];

  const progressItems = wellnessProgress;
  const completedItems = progressItems.filter(item => item.completed).length;
  const totalProgress = completedItems / progressItems.length;

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Profile editing feature will be available soon!");
  };

  const handleNotificationSettings = () => {
    Alert.alert("Notifications", "Configure your notification preferences");
  };

  const handlePrivacySettings = () => {
    Alert.alert("Privacy", "Manage your privacy and data settings");
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "Export your wellness data and session history?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export", onPress: () => Alert.alert("Success", "Data export will be sent to your email") }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => Alert.alert("Account Deleted", "Your account has been scheduled for deletion")
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: () => Alert.alert("Logged Out", "You have been logged out") }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleEditProfile}>
              <Avatar.Text 
                size={80} 
                label={user.name.split(' ').map(n => n[0]).join('')}
                style={styles.avatar}
              />
              <View style={styles.editIconContainer}>
                <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userDetails}>
                {user.year} • {user.major}
              </Text>
              <Text style={styles.userDetails}>
                {user.university} • Member since {user.joinDate}
              </Text>
            </View>
          </View>
          
          <Button 
            mode="outlined" 
            onPress={handleEditProfile}
            style={styles.editProfileButton}
          >
            Edit Profile
          </Button>
        </Card.Content>
      </Card>

      {/* Wellness Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Wellness Score"
          value={`${user.mentalHealthScore}/100`}
          icon="heart-pulse"
          color="#e91e63"
        />
        <StatCard
          title="Sessions"
          value={user.completedSessions}
          icon="account-group"
          color="#4caf50"
        />
        <StatCard
          title="Resources"
          value={user.resourcesViewed}
          icon="book-open-variant"
          color="#ff9800"
        />
        <StatCard
          title="Assessments"
          value={user.assessmentsTaken}
          icon="clipboard-check"
          color="#2196f3"
        />
      </View>

      {/* Wellness Progress */}
      <ProgressSection
        title="Wellness Journey Progress"
        progress={totalProgress}
        items={progressItems}
      />

      {/* Achievements */}
      <Card style={styles.achievementsCard}>
        <Card.Content>
          <View style={styles.achievementsHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Badge style={styles.achievementCount}>{achievements.length}</Badge>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.achievementsList}>
              {achievements.map(achievement => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </View>
          </ScrollView>
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <SettingsItem
            icon="translate"
            title="Language"
            subtitle={currentLanguage === 'en' ? 'English' : 
                     currentLanguage === 'hi' ? 'हिंदी' :
                     currentLanguage === 'ta' ? 'தமிழ்' : 'తెలుగు'}
            onPress={() => setShowLanguageSelector(true)}
          />
          
          <SettingsItem
            icon="bell-outline"
            title="Notifications"
            subtitle="Push notifications and reminders"
            onPress={handleNotificationSettings}
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            }
          />
          
          <SettingsItem
            icon="weather-night"
            title="Dark Mode"
            subtitle="Switch to dark theme"
            onPress={() => setDarkModeEnabled(!darkModeEnabled)}
            rightComponent={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
              />
            }
          />
          
          <SettingsItem
            icon="shield-outline"
            title="Privacy & Security"
            subtitle="Manage your data and privacy"
            onPress={handlePrivacySettings}
          />
          
          <SettingsItem
            icon="download-outline"
            title="Export Data"
            subtitle="Download your wellness data"
            onPress={handleExportData}
          />
          
          <SettingsItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="FAQs and contact support"
            onPress={() => Alert.alert("Support", "Contact our support team")}
          />
          
          <SettingsItem
            icon="information-outline"
            title="About"
            subtitle="App version and legal info"
            onPress={() => Alert.alert("About", "MindCare v1.0.0")}
            divider={false}
          />
        </Card.Content>
      </Card>

      {/* Account Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.actionButton}
            textColor="#1976d2"
          >
            Logout
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleDeleteAccount}
            style={[styles.actionButton, styles.deleteButton]}
            textColor="#d32f2f"
          >
            Delete Account
          </Button>
        </Card.Content>
      </Card>

      {/* Emergency Contact */}
      <Card style={styles.emergencyCard}>
        <Card.Content>
          <View style={styles.emergencyHeader}>
            <MaterialCommunityIcons name="phone-alert" size={24} color="#d32f2f" />
            <Text style={styles.emergencyTitle}>Crisis Support</Text>
          </View>
          <Text style={styles.emergencyText}>
            If you're in crisis or having thoughts of self-harm:
          </Text>
          <Button
            mode="contained"
            buttonColor="#d32f2f"
            onPress={() => Alert.alert("Emergency", "Calling crisis helpline...")}
            style={styles.emergencyButton}
          >
            📞 Call Crisis Hotline: 988
          </Button>
        </Card.Content>
      </Card>

      <LanguageSelector
        visible={showLanguageSelector}
        onDismiss={() => setShowLanguageSelector(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    margin: 15,
    marginBottom: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    backgroundColor: '#1976d2',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1976d2',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userDetails: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  editProfileButton: {
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  statCard: {
    width: '48%',
    marginBottom: 10,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 10,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
  },
  progressCard: {
    margin: 15,
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 15,
  },
  progressItems: {
    gap: 8,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressItemText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  progressItemCompleted: {
    textDecorationLine: 'line-through',
    color: '#4caf50',
  },
  achievementsCard: {
    margin: 15,
    marginBottom: 10,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  achievementCount: {
    backgroundColor: '#1976d2',
  },
  achievementsList: {
    flexDirection: 'row',
    gap: 15,
  },
  achievementBadge: {
    alignItems: 'center',
    width: 80,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  badgeDate: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
  settingsCard: {
    margin: 15,
    marginBottom: 10,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    marginLeft: 15,
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 14,
    color: '#333',
  },
  settingsItemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionsCard: {
    margin: 15,
    marginBottom: 10,
  },
  actionButton: {
    marginBottom: 10,
  },
  deleteButton: {
    borderColor: '#d32f2f',
  },
  emergencyCard: {
    margin: 15,
    marginBottom: 30,
    backgroundColor: '#ffebee',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginLeft: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  emergencyButton: {
    marginTop: 5,
  },
});