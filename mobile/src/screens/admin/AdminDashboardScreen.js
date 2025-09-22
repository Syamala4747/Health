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

const AdminDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalCounsellors: 0,
    pendingApprovals: 0,
    activeSessions: 0,
    crisisAlerts: 0,
    todayRegistrations: 0,
    systemHealth: 'excellent',
    recentUsers: [],
    pendingCounsellors: [],
    recentActivity: [],
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch admin dashboard data
      const [usersResponse, reportsResponse, crisisResponse] = await Promise.all([
        apiService.admin.getUsers(),
        apiService.reports.getAnalytics(),
        apiService.reports.getCrisis(),
      ]);

      const users = usersResponse.data || [];
      const reports = reportsResponse.data || {};
      const crisisReports = crisisResponse.data || [];

      // Calculate statistics
      const totalUsers = users.length;
      const totalStudents = users.filter(user => user.role === 'student').length;
      const totalCounsellors = users.filter(user => user.role === 'counsellor').length;
      const pendingApprovals = users.filter(user => user.role === 'counsellor' && user.status === 'pending').length;
      
      const today = new Date().toDateString();
      const todayRegistrations = users.filter(user => 
        new Date(user.createdAt).toDateString() === today
      ).length;

      const crisisAlerts = crisisReports.filter(report => 
        report.status === 'active' && new Date(report.createdAt) > new Date(Date.now() - 24*60*60*1000)
      ).length;

      // Recent users (last 10 registered)
      const recentUsers = users
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      // Pending counsellor approvals
      const pendingCounsellors = users
        .filter(user => user.role === 'counsellor' && user.status === 'pending')
        .slice(0, 5);

      setDashboardData({
        totalUsers,
        totalStudents,
        totalCounsellors,
        pendingApprovals,
        activeSessions: reports.activeSessions || 0,
        crisisAlerts,
        todayRegistrations,
        systemHealth: reports.systemHealth || 'excellent',
        recentUsers,
        pendingCounsellors,
        recentActivity: reports.recentActivity || [],
      });
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApproveCounsellor = async (counsellorId) => {
    try {
      await apiService.admin.approveCounsellor(counsellorId);
      Alert.alert('Success', 'Counsellor approved successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to approve counsellor');
    }
  };

  const handleRejectCounsellor = async (counsellorId) => {
    try {
      await apiService.admin.rejectCounsellor(counsellorId);
      Alert.alert('Success', 'Counsellor application rejected');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to reject counsellor');
    }
  };

  const StatCard = ({ title, value, icon, color, onPress, subtitle }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.statCardContent}>
        <View style={styles.statCardLeft}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <MaterialCommunityIcons name={icon} size={32} color={color} />
      </View>
    </TouchableOpacity>
  );

  const UserCard = ({ user }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <MaterialCommunityIcons 
          name={user.role === 'student' ? 'school' : 'account-tie'} 
          size={24} 
          color={user.role === 'student' ? colors.info : colors.primary} 
        />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userRole}>{user.role}</Text>
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: user.status === 'active' ? colors.success : 
                          user.status === 'pending' ? colors.warning : colors.error 
        }]}>
          <Text style={styles.statusText}>{user.status?.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );

  const PendingCounsellorCard = ({ counsellor }) => (
    <View style={styles.pendingCard}>
      <View style={styles.pendingHeader}>
        <View style={styles.counsellorInfo}>
          <Text style={styles.counsellorName}>{counsellor.name}</Text>
          <Text style={styles.counsellorSpecialty}>{counsellor.specialties?.join(', ') || 'General Counseling'}</Text>
        </View>
      </View>
      <Text style={styles.counsellorQualifications}>{counsellor.qualifications}</Text>
      <View style={styles.pendingActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApproveCounsellor(counsellor.id)}
        >
          <MaterialCommunityIcons name="check" size={16} color={colors.surface} />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectCounsellor(counsellor.id)}
        >
          <MaterialCommunityIcons name="close" size={16} color={colors.surface} />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getSystemHealthColor = (health) => {
    switch (health) {
      case 'excellent': return colors.success;
      case 'good': return colors.info;
      case 'warning': return colors.warning;
      case 'critical': return colors.error;
      default: return colors.textSecondary;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />}
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Admin Dashboard</Text>
        <Text style={styles.adminName}>Welcome, {user?.name || 'Administrator'}</Text>
        <View style={styles.systemHealth}>
          <MaterialCommunityIcons 
            name="heart-pulse" 
            size={16} 
            color={getSystemHealthColor(dashboardData.systemHealth)} 
          />
          <Text style={[styles.healthText, { color: getSystemHealthColor(dashboardData.systemHealth) }]}>
            System: {dashboardData.systemHealth?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Users"
          value={dashboardData.totalUsers}
          subtitle={`+${dashboardData.todayRegistrations} today`}
          icon="account-group"
          color={colors.primary}
          onPress={() => navigation.navigate('Users')}
        />
        <StatCard
          title="Students"
          value={dashboardData.totalStudents}
          icon="school"
          color={colors.info}
          onPress={() => navigation.navigate('Users', { filter: 'student' })}
        />
        <StatCard
          title="Counsellors"
          value={dashboardData.totalCounsellors}
          icon="account-tie"
          color={colors.success}
          onPress={() => navigation.navigate('Users', { filter: 'counsellor' })}
        />
        <StatCard
          title="Pending Approvals"
          value={dashboardData.pendingApprovals}
          icon="clock-alert"
          color={colors.warning}
          onPress={() => navigation.navigate('Users', { filter: 'pending' })}
        />
        <StatCard
          title="Active Sessions"
          value={dashboardData.activeSessions}
          icon="video"
          color={colors.primary}
        />
        <StatCard
          title="Crisis Alerts"
          value={dashboardData.crisisAlerts}
          icon="alert-circle"
          color={colors.error}
          onPress={() => navigation.navigate('Reports', { tab: 'crisis' })}
        />
      </View>

      {/* Pending Counsellor Approvals */}
      {dashboardData.pendingCounsellors.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Counsellor Approvals</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Users', { filter: 'pending' })}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {dashboardData.pendingCounsellors.map((counsellor) => (
            <PendingCounsellorCard key={counsellor.id} counsellor={counsellor} />
          ))}
        </View>
      )}

      {/* Recent Users */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Registrations</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Users')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {dashboardData.recentUsers.length > 0 ? (
          dashboardData.recentUsers.slice(0, 5).map((user) => (
            <UserCard key={user.id} user={user} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-plus" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No recent registrations</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Users')}
          >
            <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>Manage Users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Reports')}
          >
            <MaterialCommunityIcons name="chart-line" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>View Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialCommunityIcons name="cog" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>System Settings</Text>
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
  adminName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  systemHealth: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '600',
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
  userCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: colors.primary,
    textTransform: 'capitalize',
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
  pendingCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  counsellorInfo: {
    flex: 1,
  },
  counsellorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  counsellorSpecialty: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  counsellorQualifications: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  pendingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.surface,
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: (width - 64) / 3,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
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

export default AdminDashboardScreen;