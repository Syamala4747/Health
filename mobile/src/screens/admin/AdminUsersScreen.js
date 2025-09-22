import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { apiService } from '../../services/apiService';

const AdminUsersScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState(route?.params?.filter || 'all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);

  const filterOptions = [
    { key: 'all', label: 'All Users', icon: 'account-group' },
    { key: 'student', label: 'Students', icon: 'school' },
    { key: 'counsellor', label: 'Counsellors', icon: 'account-tie' },
    { key: 'pending', label: 'Pending', icon: 'clock-alert' },
    { key: 'blocked', label: 'Blocked', icon: 'account-cancel' },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiService.admin.getUsers();
      const allUsers = response.data || [];
      setUsers(allUsers);
      filterUsers(allUsers, filterType, searchQuery);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = (allUsers, type, query) => {
    let filtered = allUsers;

    // Filter by type
    switch (type) {
      case 'student':
        filtered = allUsers.filter(u => u.role === 'student');
        break;
      case 'counsellor':
        filtered = allUsers.filter(u => u.role === 'counsellor');
        break;
      case 'pending':
        filtered = allUsers.filter(u => u.status === 'pending');
        break;
      case 'blocked':
        filtered = allUsers.filter(u => u.status === 'blocked');
        break;
      default:
        filtered = allUsers;
    }

    // Filter by search query
    if (query) {
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort users
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers(users, filterType, searchQuery);
  }, [filterType, searchQuery, users]);

  const handleUserAction = async (userId, action) => {
    try {
      switch (action) {
        case 'approve':
          await apiService.admin.approveCounsellor(userId);
          Alert.alert('Success', 'Counsellor approved successfully');
          break;
        case 'reject':
          await apiService.admin.rejectCounsellor(userId);
          Alert.alert('Success', 'Counsellor application rejected');
          break;
        case 'block':
          await apiService.admin.blockUser(userId);
          Alert.alert('Success', 'User blocked successfully');
          break;
        case 'unblock':
          await apiService.admin.unblockUser(userId);
          Alert.alert('Success', 'User unblocked successfully');
          break;
        case 'delete':
          Alert.alert(
            'Delete User',
            'Are you sure you want to delete this user? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await apiService.admin.deleteUser(userId);
                  Alert.alert('Success', 'User deleted successfully');
                  fetchUsers();
                }
              }
            ]
          );
          return; // Don't refresh immediately for delete
      }
      fetchUsers(); // Refresh data
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} user`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return colors.success;
      case 'pending': return colors.warning;
      case 'blocked': return colors.error;
      case 'rejected': return colors.textSecondary;
      default: return colors.text;
    }
  };

  const getUserIcon = (user) => {
    if (user.role === 'student') return 'school';
    if (user.role === 'counsellor') return 'account-tie';
    if (user.role === 'admin') return 'shield-crown';
    return 'account';
  };

  const FilterTab = ({ option, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.filterTab, isActive && styles.activeFilterTab]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={option.icon}
        size={16}
        color={isActive ? colors.surface : colors.textSecondary}
      />
      <Text style={[styles.filterTabText, isActive && styles.activeFilterTabText]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );

  const UserCard = ({ user }) => {
    const isPending = user.status === 'pending' && user.role === 'counsellor';
    const isBlocked = user.status === 'blocked';
    const isActive = user.status === 'active';

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => {
          setSelectedUser(user);
          setUserModalVisible(true);
        }}
      >
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <MaterialCommunityIcons
              name={getUserIcon(user)}
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userRole}>{user.role}</Text>
            <Text style={styles.userDate}>
              Joined: {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.userActions}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) }]}>
              <Text style={styles.statusText}>{user.status?.toUpperCase()}</Text>
            </View>
            {isPending && (
              <View style={styles.pendingActions}>
                <TouchableOpacity
                  style={[styles.quickAction, styles.approveAction]}
                  onPress={() => handleUserAction(user.id, 'approve')}
                >
                  <MaterialCommunityIcons name="check" size={16} color={colors.surface} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickAction, styles.rejectAction]}
                  onPress={() => handleUserAction(user.id, 'reject')}
                >
                  <MaterialCommunityIcons name="close" size={16} color={colors.surface} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const UserDetailModal = () => {
    if (!selectedUser) return null;

    const isPending = selectedUser.status === 'pending';
    const isBlocked = selectedUser.status === 'blocked';
    const isActive = selectedUser.status === 'active';

    return (
      <Modal
        visible={userModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setUserModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity onPress={() => setUserModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.userProfileHeader}>
              <View style={styles.largeAvatar}>
                <MaterialCommunityIcons
                  name={getUserIcon(selectedUser)}
                  size={48}
                  color={colors.primary}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{selectedUser.name}</Text>
                <Text style={styles.profileEmail}>{selectedUser.email}</Text>
                <Text style={styles.profileRole}>{selectedUser.role}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedUser.status) }]}>
                <Text style={styles.statusText}>{selectedUser.status?.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>User Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{selectedUser.phone || 'Not provided'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Joined:</Text>
                <Text style={styles.detailValue}>{new Date(selectedUser.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Active:</Text>
                <Text style={styles.detailValue}>
                  {selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleDateString() : 'Never'}
                </Text>
              </View>
            </View>

            {selectedUser.role === 'counsellor' && (
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Professional Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Specialties:</Text>
                  <Text style={styles.detailValue}>
                    {selectedUser.specialties?.join(', ') || 'Not specified'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Qualifications:</Text>
                  <Text style={styles.detailValue}>{selectedUser.qualifications || 'Not provided'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Experience:</Text>
                  <Text style={styles.detailValue}>{selectedUser.experience || 'Not provided'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rating:</Text>
                  <Text style={styles.detailValue}>{selectedUser.rating?.toFixed(1) || 'No ratings yet'}</Text>
                </View>
              </View>
            )}

            <View style={styles.actionSection}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <View style={styles.actionButtons}>
                {isPending && selectedUser.role === 'counsellor' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => {
                        handleUserAction(selectedUser.id, 'approve');
                        setUserModalVisible(false);
                      }}
                    >
                      <MaterialCommunityIcons name="check" size={20} color={colors.surface} />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => {
                        handleUserAction(selectedUser.id, 'reject');
                        setUserModalVisible(false);
                      }}
                    >
                      <MaterialCommunityIcons name="close" size={20} color={colors.surface} />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}

                {isActive && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.blockButton]}
                    onPress={() => {
                      handleUserAction(selectedUser.id, 'block');
                      setUserModalVisible(false);
                    }}
                  >
                    <MaterialCommunityIcons name="account-cancel" size={20} color={colors.surface} />
                    <Text style={styles.actionButtonText}>Block User</Text>
                  </TouchableOpacity>
                )}

                {isBlocked && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.unblockButton]}
                    onPress={() => {
                      handleUserAction(selectedUser.id, 'unblock');
                      setUserModalVisible(false);
                    }}
                  >
                    <MaterialCommunityIcons name="account-check" size={20} color={colors.surface} />
                    <Text style={styles.actionButtonText}>Unblock User</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => {
                    setUserModalVisible(false);
                    handleUserAction(selectedUser.id, 'delete');
                  }}
                >
                  <MaterialCommunityIcons name="delete" size={20} color={colors.surface} />
                  <Text style={styles.actionButtonText}>Delete User</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="account-search"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyStateText}>No users found</Text>
      <Text style={styles.emptyStateSubtext}>Try adjusting your search or filter</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filterOptions.map((option) => (
          <FilterTab
            key={option.key}
            option={option}
            isActive={filterType === option.key}
            onPress={() => setFilterType(option.key)}
          />
        ))}
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserCard user={item} />}
        refreshing={loading}
        onRefresh={fetchUsers}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredUsers.length === 0 ? styles.emptyContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* User Detail Modal */}
      <UserDetailModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeFilterTab: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  activeFilterTabText: {
    color: colors.surface,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
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
    marginBottom: 2,
  },
  userDate: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  userActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.surface,
  },
  pendingActions: {
    flexDirection: 'row',
  },
  quickAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  approveAction: {
    backgroundColor: colors.success,
  },
  rejectAction: {
    backgroundColor: colors.error,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  userProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  largeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  actionSection: {
    marginTop: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '48%',
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  blockButton: {
    backgroundColor: colors.warning,
  },
  unblockButton: {
    backgroundColor: colors.success,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.surface,
    marginLeft: 4,
  },
});

export default AdminUsersScreen;