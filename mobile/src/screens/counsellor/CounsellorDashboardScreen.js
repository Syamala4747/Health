import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { apiService } from '../../services/apiService';

const { width } = Dimensions.get('window');

const CounsellorDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    todaySessions: 0,
    pendingBookings: 0,
    totalStudents: 0,
    crisisAlerts: 0,
    upcomingSession: null,
    recentBookings: [],
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch counsellor dashboard data
      const [bookingsResponse, studentsResponse] = await Promise.all([
        apiService.bookings.getCounsellorBookings(),
        apiService.users.getCounsellorStudents(),
      ]);

      const bookings = bookingsResponse.data || [];
      const students = studentsResponse.data || [];

      // Calculate stats
      const today = new Date().toDateString();
      const todaySessions = bookings.filter(
        (booking) => new Date(booking.date).toDateString() === today && booking.status === 'confirmed'
      ).length;

      const pendingBookings = bookings.filter(
        (booking) => booking.status === 'pending'
      ).length;

      const crisisAlerts = students.filter(
        (student) => student.crisisAlert
      ).length;

      // Find next upcoming session
      const upcomingSessions = bookings
        .filter((booking) => new Date(booking.date) > new Date() && booking.status === 'confirmed')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const upcomingSession = upcomingSessions[0] || null;

      // Recent bookings (last 5)
      const recentBookings = bookings
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setDashboardData({
        todaySessions,
        pendingBookings,
        totalStudents: students.length,
        crisisAlerts,
        upcomingSession,
        recentBookings,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleBookingAction = async (bookingId, action) => {
    try {
      await apiService.bookings.updateStatus(bookingId, action);
      Alert.alert('Success', `Booking ${action} successfully`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} booking`);
    }
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.statCardContent}>
        <View style={styles.statCardLeft}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <MaterialCommunityIcons name={icon} size={32} color={color} />
      </View>
    </TouchableOpacity>
  );

  const BookingCard = ({ booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.studentName}>{booking.studentName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.bookingDetails}>
        {new Date(booking.date).toLocaleDateString()} at {booking.time}
      </Text>
      <Text style={styles.sessionType}>{booking.sessionType} • {booking.priority} Priority</Text>
      
      {booking.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleBookingAction(booking.id, 'confirmed')}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleBookingAction(booking.id, 'cancelled')}
          >
            <Text style={styles.actionButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.warning;
      case 'cancelled': return colors.error;
      case 'completed': return colors.primary;
      default: return colors.text;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />}
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.counsellorName}>{user?.name || 'Counsellor'}</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Today's Sessions"
          value={dashboardData.todaySessions}
          icon="calendar-today"
          color={colors.primary}
          onPress={() => navigation.navigate('Bookings')}
        />
        <StatCard
          title="Pending Bookings"
          value={dashboardData.pendingBookings}
          icon="clock-outline"
          color={colors.warning}
          onPress={() => navigation.navigate('Bookings')}
        />
        <StatCard
          title="Total Students"
          value={dashboardData.totalStudents}
          icon="account-group"
          color={colors.info}
        />
        <StatCard
          title="Crisis Alerts"
          value={dashboardData.crisisAlerts}
          icon="alert-circle"
          color={colors.error}
        />
      </View>

      {/* Next Session */}
      {dashboardData.upcomingSession && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Session</Text>
          <View style={styles.nextSessionCard}>
            <View style={styles.nextSessionHeader}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color={colors.primary} />
              <Text style={styles.nextSessionTime}>
                {new Date(dashboardData.upcomingSession.date).toLocaleDateString()} at{' '}
                {dashboardData.upcomingSession.time}
              </Text>
            </View>
            <Text style={styles.nextSessionStudent}>
              {dashboardData.upcomingSession.studentName}
            </Text>
            <Text style={styles.nextSessionType}>
              {dashboardData.upcomingSession.sessionType} Session
            </Text>
            <TouchableOpacity
              style={styles.startSessionButton}
              onPress={() => {
                if (dashboardData.upcomingSession.sessionType === 'video') {
                  navigation.navigate('VideoCall', { sessionId: dashboardData.upcomingSession.id });
                } else {
                  navigation.navigate('Chat', { sessionId: dashboardData.upcomingSession.id });
                }
              }}
            >
              <Text style={styles.startSessionText}>Start Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Recent Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {dashboardData.recentBookings.length > 0 ? (
          dashboardData.recentBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No recent bookings</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Bookings')}
          >
            <MaterialCommunityIcons name="calendar-check" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>Manage Sessions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <MaterialCommunityIcons name="account-edit" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  counsellorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    width: (width - 48) / 2,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardLeft: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
  },
  nextSessionCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  nextSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextSessionTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  nextSessionStudent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  nextSessionType: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  startSessionButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startSessionText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  bookingCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.surface,
  },
  bookingDetails: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  sessionType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: (width - 64) / 2,
  },
  quickActionText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
});

export default CounsellorDashboardScreen;