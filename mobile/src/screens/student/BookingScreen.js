import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Card, RadioButton, TextInput, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, handleApiError } from '../../services/apiService';

const BookingScreen = ({ route, navigation }) => {
  const { counsellorId } = route.params;
  const { user } = useAuth();
  const { t } = useTranslation();

  const [counsellor, setCounsellor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Booking form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState('video'); // video, audio, chat
  const [duration, setDuration] = useState(60); // minutes
  const [notes, setNotes] = useState('');
  const [urgency, setUrgency] = useState('normal'); // urgent, normal, flexible
  
  // Date/time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Available time slots (would normally come from API)
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const sessionTypes = [
    { value: 'video', label: 'Video Call', icon: 'videocam', description: 'Face-to-face session' },
    { value: 'audio', label: 'Audio Call', icon: 'call', description: 'Voice-only session' },
    { value: 'chat', label: 'Text Chat', icon: 'chatbubbles', description: 'Text-based session' }
  ];

  const urgencyLevels = [
    { value: 'urgent', label: 'Urgent', color: colors.error, description: 'Need immediate help' },
    { value: 'normal', label: 'Normal', color: colors.primary, description: 'Regular appointment' },
    { value: 'flexible', label: 'Flexible', color: colors.success, description: 'Any available time' }
  ];

  useEffect(() => {
    loadCounsellorDetails();
  }, [counsellorId]);

  const loadCounsellorDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.users.getProfile(counsellorId);
      setCounsellor(response.data);
    } catch (error) {
      console.error('Failed to load counsellor details:', error);
      Alert.alert('Error', handleApiError(error));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(false);
    if (time) {
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      setSelectedTime(`${hours}:${minutes}`);
    }
  };

  const isTimeSlotAvailable = (time) => {
    // This would normally check against counsellor's availability
    // For demo, all slots are available except past times for today
    const now = new Date();
    const selectedDateStr = selectedDate.toDateString();
    const todayStr = now.toDateString();
    
    if (selectedDateStr === todayStr) {
      const currentHour = now.getHours();
      const slotHour = parseInt(time.split(':')[0]);
      return slotHour > currentHour;
    }
    
    return true;
  };

  const submitBooking = async () => {
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    try {
      setSubmitting(true);
      
      const bookingData = {
        counsellorId,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        sessionType,
        duration,
        notes: notes.trim(),
        urgency,
        status: 'pending'
      };

      await apiService.bookings.create(bookingData);
      
      Alert.alert(
        'Booking Requested',
        'Your session request has been sent to the counsellor. You will receive a confirmation shortly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('StudentDashboard')
          }
        ]
      );
    } catch (error) {
      console.error('Booking submission failed:', error);
      Alert.alert('Error', handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading counsellor details...</Text>
      </View>
    );
  }

  if (!counsellor) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>Counsellor not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Session</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Counsellor Info */}
      <Card style={styles.counsellorCard}>
        <Card.Content>
          <View style={styles.counsellorHeader}>
            <View style={styles.avatarContainer}>
              {counsellor.photoURL ? (
                <Image source={{ uri: counsellor.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color={colors.textSecondary} />
                </View>
              )}
            </View>
            <View style={styles.counsellorInfo}>
              <Text style={styles.counsellorName}>{counsellor.name}</Text>
              <Text style={styles.counsellorTitle}>
                {counsellor.title || 'Mental Health Counsellor'}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={colors.warning} />
                <Text style={styles.rating}>
                  {counsellor.rating?.toFixed(1) || 'New'} 
                  {counsellor.totalReviews ? ` (${counsellor.totalReviews} reviews)` : ''}
                </Text>
              </View>
            </View>
          </View>
          
          {counsellor.specialties && (
            <View style={styles.specialtiesContainer}>
              {counsellor.specialties.map((specialty, index) => (
                <Chip key={index} style={styles.specialtyChip} compact>
                  {specialty}
                </Chip>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Booking Form */}
      <Card style={styles.formCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Session Details</Text>

          {/* Date Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={styles.dateButtonText}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Available Time Slots</Text>
            <View style={styles.timeSlotsContainer}>
              {timeSlots.map((time) => {
                const available = isTimeSlotAvailable(time);
                const selected = selectedTime === time;
                
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      selected && styles.selectedTimeSlot,
                      !available && styles.unavailableTimeSlot
                    ]}
                    onPress={() => available && setSelectedTime(time)}
                    disabled={!available}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      selected && styles.selectedTimeSlotText,
                      !available && styles.unavailableTimeSlotText
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Session Type */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Session Type</Text>
            {sessionTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.sessionTypeOption,
                  sessionType === type.value && styles.selectedSessionType
                ]}
                onPress={() => setSessionType(type.value)}
              >
                <View style={styles.sessionTypeInfo}>
                  <Ionicons
                    name={type.icon}
                    size={24}
                    color={sessionType === type.value ? colors.primary : colors.textSecondary}
                  />
                  <View style={styles.sessionTypeText}>
                    <Text style={[
                      styles.sessionTypeLabel,
                      sessionType === type.value && styles.selectedSessionTypeLabel
                    ]}>
                      {type.label}
                    </Text>
                    <Text style={styles.sessionTypeDescription}>
                      {type.description}
                    </Text>
                  </View>
                </View>
                <RadioButton
                  value={type.value}
                  status={sessionType === type.value ? 'checked' : 'unchecked'}
                  onPress={() => setSessionType(type.value)}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Duration */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Session Duration</Text>
            <View style={styles.durationContainer}>
              {[30, 45, 60, 90].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.durationOption,
                    duration === minutes && styles.selectedDuration
                  ]}
                  onPress={() => setDuration(minutes)}
                >
                  <Text style={[
                    styles.durationText,
                    duration === minutes && styles.selectedDurationText
                  ]}>
                    {minutes} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Urgency Level */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Priority Level</Text>
            {urgencyLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.urgencyOption,
                  urgency === level.value && styles.selectedUrgency
                ]}
                onPress={() => setUrgency(level.value)}
              >
                <View style={styles.urgencyInfo}>
                  <View style={[styles.urgencyIndicator, { backgroundColor: level.color }]} />
                  <View style={styles.urgencyText}>
                    <Text style={[
                      styles.urgencyLabel,
                      urgency === level.value && styles.selectedUrgencyLabel
                    ]}>
                      {level.label}
                    </Text>
                    <Text style={styles.urgencyDescription}>
                      {level.description}
                    </Text>
                  </View>
                </View>
                <RadioButton
                  value={level.value}
                  status={urgency === level.value ? 'checked' : 'unchecked'}
                  onPress={() => setUrgency(level.value)}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Additional Notes (Optional)</Text>
            <TextInput
              mode="outlined"
              placeholder="Describe your concerns or specific areas you'd like to discuss..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={styles.notesInput}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          mode="contained"
          onPress={submitBooking}
          loading={submitting}
          disabled={submitting || !selectedTime}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          {submitting ? 'Submitting...' : 'Book Session'}
        </Button>
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  counsellorCard: {
    margin: spacing.md,
    ...shadows.small,
  },
  counsellorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  counsellorInfo: {
    flex: 1,
  },
  counsellorName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  counsellorTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  rating: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  specialtyChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.primaryLight,
  },
  formCard: {
    margin: spacing.md,
    marginTop: 0,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlot: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTimeSlot: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unavailableTimeSlot: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
  },
  timeSlotText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
  },
  selectedTimeSlotText: {
    color: colors.surface,
  },
  unavailableTimeSlotText: {
    color: colors.textSecondary,
  },
  sessionTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedSessionType: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  sessionTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionTypeText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  sessionTypeLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  selectedSessionTypeLabel: {
    color: colors.primary,
  },
  sessionTypeDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  durationOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedDuration: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
  },
  selectedDurationText: {
    color: colors.surface,
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedUrgency: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  urgencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  urgencyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  urgencyText: {
    flex: 1,
  },
  urgencyLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  selectedUrgencyLabel: {
    color: colors.primary,
  },
  urgencyDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  notesInput: {
    backgroundColor: colors.surface,
  },
  submitContainer: {
    padding: spacing.md,
  },
  submitButton: {
    marginBottom: spacing.lg,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
});

export default BookingScreen;