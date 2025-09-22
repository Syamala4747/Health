import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, handleApiError } from '../../services/apiService';
import { colors, spacing, typography, shadows, borderRadius } from '../../theme/theme';

const StudentDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const statsResponse = await apiService.users.getStats();
      setStats(statsResponse.data.stats);
    } catch (error) {
      console.error('Dashboard data load error:', error);
      Alert.alert('Error', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const navigateToChatbot = () => {
    navigation.navigate('Chatbot');
  };

  const navigateToCounsellors = () => {
    navigation.navigate('CounsellorList');
  };

  const navigateToResources = () => {
    navigation.navigate('Resources');
  };

  const DashboardCard = ({ title, subtitle, icon, onPress, color = colors.primary, disabled = false }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: color }, disabled && styles.cardDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={32} color={colors.textOnPrimary} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textOnPrimary} />
      </View>
    </TouchableOpacity>
  );

  const WelcomeHeader = () => (
    <View style={styles.welcomeContainer}>
      <Text style={styles.welcomeText}>Welcome back,</Text>
      <Text style={styles.userName}>{user?.name || 'Student'}</Text>
      <Text style={styles.welcomeSubtext}>
        How are you feeling today? Take a moment to check in with yourself.
      </Text>
    </View>
  );

  const QuickStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalSessions || 0}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.assessmentsCompleted?.phq9 + stats.assessmentsCompleted?.gad7 || 0}</Text>
            <Text style={styles.statLabel}>Assessments</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.upcomingBookings || 0}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <WelcomeHeader />
      
      <QuickStats />

      <View style={styles.cardsContainer}>
        <Text style={styles.sectionTitle}>Wellness Tools</Text>
        
        <View style={styles.cardsGrid}>
          <DashboardCard
            title="AI Counsellor"
            subtitle="Chat with our AI wellness companion"
            icon="chatbubbles"
            color={colors.secondary}
            onPress={navigateToChatbot}
          />
          
          <DashboardCard
            title="Human Counsellor"
            subtitle="Connect with professional counsellors"
            icon="people"
            color={colors.accent}
            onPress={navigateToCounsellors}
          />
          
          <DashboardCard
            title="Resource Hub"
            subtitle="Articles, videos, and wellness tools"
            icon="library"
            color={colors.secondaryDark}
            onPress={navigateToResources}
          />
        </View>
      </View>

      <View style={styles.emergencyContainer}>
        <Text style={styles.emergencyTitle}>Need Immediate Help?</Text>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => Alert.alert(
            'Crisis Resources',
            'Suicide & Crisis Lifeline: 988\nCrisis Text Line: Text HOME to 741741\nEmergency: 911',
            [
              { text: 'Call 988', onPress: () => {} },
              { text: 'Text 741741', onPress: () => {} },
              { text: 'Close', style: 'cancel' }
            ]
          )}
        >
          <Ionicons name="call" size={20} color={colors.surface} />
          <Text style={styles.emergencyButtonText}>Crisis Resources</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  welcomeContainer: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  welcomeText: {
    fontSize: typography.fontSize.lg,
    color: colors.textOnPrimary,
    fontFamily: typography.fontFamily.regular,
  },
  userName: {
    fontSize: typography.fontSize.xxl,
    color: colors.textOnPrimary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.sm,
  },
  welcomeSubtext: {
    fontSize: typography.fontSize.md,
    color: colors.textOnPrimary,
    fontFamily: typography.fontFamily.regular,
    opacity: 0.9,
  },
  statsContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    color: colors.accent,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cardsContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  cardsGrid: {
    gap: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textOnPrimary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textOnPrimary,
    opacity: 0.9,
  },
  assessmentsContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  assessmentItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  assessmentInfo: {
    flex: 1,
  },
  assessmentName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  assessmentScore: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  assessmentDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  retakeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  retakeButtonText: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  emergencyContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.surface,
    marginBottom: spacing.md,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  emergencyButtonText: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.sm,
  },
});

export default StudentDashboardScreen;