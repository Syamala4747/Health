import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { apiService } from '../../services/apiService';

const CounsellorBookingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // pending, upcoming, past
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await apiService.bookings.getCounsellorBookings();
      const allBookings = response.data || [];
      setBookings(allBookings);
      filterBookings(allBookings, activeTab, searchQuery);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = (allBookings, tab, query) => {
    let filtered = allBookings;

    // Filter by tab
    const now = new Date();
    switch (tab) {
      case 'pending':
        filtered = allBookings.filter(booking => booking.status === 'pending');
        break;
      case 'upcoming':
        filtered = allBookings.filter(booking => 
          booking.status === 'confirmed' && new Date(booking.date) >= now
        );
        break;
      case 'past':
        filtered = allBookings.filter(booking => 
          booking.status === 'completed' || new Date(booking.date) < now
        );
        break;
    }

    // Filter by search query
    if (query) {
      filtered = filtered.filter(booking =>
        booking.studentName?.toLowerCase().includes(query.toLowerCase()) ||
        booking.sessionType?.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort bookings
    filtered.sort((a, b) => {
      if (tab === 'past') {
        return new Date(b.date) - new Date(a.date); // Most recent first for past
      }
      return new Date(a.date) - new Date(b.date); // Earliest first for pending/upcoming
    });

    setFilteredBookings(filtered);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings(bookings, activeTab, searchQuery);
  }, [activeTab, searchQuery, bookings]);

  const handleBookingAction = async (bookingId, action) => {
    try {
      await apiService.bookings.updateStatus(bookingId, action);
      Alert.alert('Success', `Booking ${action} successfully`);
      fetchBookings(); // Refresh data
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} booking`);
    }
  };

  const handleStartSession = (booking) => {
    if (booking.sessionType === 'video') {
      navigation.navigate('VideoCall', { 
        sessionId: booking.id,
        studentId: booking.studentId,
        counsellorId: user?.uid
      });
    } else {
      navigation.navigate('Chat', { 
        sessionId: booking.id,
        studentId: booking.studentId,
        counsellorId: user?.uid
      });
    }
  };

  const handleAddNotes = (booking) => {
    setSelectedBooking(booking);
    setSessionNotes(booking.notes || '');
    setNotesModalVisible(true);
  };

  const saveSessionNotes = async () => {
    try {
      await apiService.bookings.addNotes(selectedBooking.id, sessionNotes);
      Alert.alert('Success', 'Notes saved successfully');
      setNotesModalVisible(false);
      fetchBookings();
    } catch (error) {
      Alert.alert('Error', 'Failed to save notes');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.warning;
      case 'cancelled': return colors.error;
      case 'completed': return colors.primary;
      default: return colors.text;
    }
  };

  const formatDateTime = (dateStr, timeStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateText = date.toLocaleDateString();
    if (date.toDateString() === today.toDateString()) {
      dateText = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateText = 'Tomorrow';
    }

    return `${dateText} at ${timeStr}`;
  };

  const TabButton = ({ title, isActive, onPress, count }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
        {title}
      </Text>
      {count > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const BookingCard = ({ booking }) => {
    const isUpcoming = activeTab === 'upcoming';
    const isPending = activeTab === 'pending';
    const isPast = activeTab === 'past';

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{booking.studentName}</Text>
            <Text style={styles.bookingDateTime}>
              {formatDateTime(booking.date, booking.time)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="video" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{booking.sessionType} Session</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="alert-circle" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{booking.priority} Priority</Text>
          </View>
          {booking.notes && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="note-text" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText} numberOfLines={2}>{booking.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          {isPending && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleBookingAction(booking.id, 'confirmed')}
              >
                <MaterialCommunityIcons name="check" size={20} color={colors.surface} />
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleBookingAction(booking.id, 'cancelled')}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.surface} />
                <Text style={styles.actionButtonText}>Decline</Text>
              </TouchableOpacity>
            </>
          )}

          {isUpcoming && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => handleStartSession(booking)}
              >
                <MaterialCommunityIcons name="play" size={20} color={colors.surface} />
                <Text style={styles.actionButtonText}>Start Session</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => handleAddNotes(booking)}
              >
                <MaterialCommunityIcons name="note-plus" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>Add Notes</Text>
              </TouchableOpacity>
            </>
          )}

          {isPast && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleAddNotes(booking)}
            >
              <MaterialCommunityIcons name="note-text" size={20} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                {booking.notes ? 'View Notes' : 'Add Notes'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    let message = '';
    let icon = '';
    switch (activeTab) {
      case 'pending':
        message = 'No pending booking requests';
        icon = 'clock-outline';
        break;
      case 'upcoming':
        message = 'No upcoming sessions';
        icon = 'calendar-blank';
        break;
      case 'past':
        message = 'No past sessions';
        icon = 'history';
        break;
    }

    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name={icon} size={64} color={colors.textSecondary} />
        <Text style={styles.emptyStateText}>{message}</Text>
      </View>
    );
  };

  const getTabCounts = () => {
    const now = new Date();
    return {
      pending: bookings.filter(b => b.status === 'pending').length,
      upcoming: bookings.filter(b => b.status === 'confirmed' && new Date(b.date) >= now).length,
      past: bookings.filter(b => b.status === 'completed' || new Date(b.date) < now).length,
    };
  };

  const tabCounts = getTabCounts();

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student name or session type..."
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TabButton
          title="Pending"
          isActive={activeTab === 'pending'}
          onPress={() => setActiveTab('pending')}
          count={tabCounts.pending}
        />
        <TabButton
          title="Upcoming"
          isActive={activeTab === 'upcoming'}
          onPress={() => setActiveTab('upcoming')}
          count={tabCounts.upcoming}
        />
        <TabButton
          title="Past"
          isActive={activeTab === 'past'}
          onPress={() => setActiveTab('past')}
          count={tabCounts.past}
        />
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard booking={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBookings} />}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredBookings.length === 0 ? styles.emptyContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Notes Modal */}
      <Modal
        visible={notesModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Session Notes</Text>
            <TouchableOpacity onPress={() => setNotesModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {selectedBooking && (
            <View style={styles.modalBookingInfo}>
              <Text style={styles.modalStudentName}>{selectedBooking.studentName}</Text>
              <Text style={styles.modalDateTime}>
                {formatDateTime(selectedBooking.date, selectedBooking.time)}
              </Text>
            </View>
          )}

          <TextInput
            style={styles.notesInput}
            placeholder="Add your session notes here..."
            value={sessionNotes}
            onChangeText={setSessionNotes}
            multiline
            textAlignVertical="top"
            placeholderTextColor={colors.textSecondary}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setNotesModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={saveSessionNotes}
            >
              <Text style={styles.saveButtonText}>Save Notes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabButtonText: {
    color: colors.surface,
  },
  countBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bookingCard: {
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  bookingDateTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.surface,
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
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
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  acceptButton: {
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
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
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
  modalBookingInfo: {
    padding: 20,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  modalStudentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  modalDateTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notesInput: {
    flex: 1,
    backgroundColor: colors.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.surface,
  },
});

export default CounsellorBookingsScreen;