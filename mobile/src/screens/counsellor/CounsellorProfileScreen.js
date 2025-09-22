import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Switch,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { apiService } from '../../services/apiService';

const CounsellorProfileScreen = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    specialties: [],
    qualifications: '',
    experience: '',
    rating: 0,
    totalSessions: 0,
    isAvailable: true,
    languages: [],
    availability: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' },
    },
  });

  const [editedProfile, setEditedProfile] = useState({ ...profile });

  const specialtyOptions = [
    'Anxiety', 'Depression', 'Stress Management', 'Academic Stress',
    'Relationship Issues', 'Family Problems', 'Career Counseling',
    'Addiction', 'Trauma', 'ADHD', 'Eating Disorders', 'Sleep Issues'
  ];

  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'te', name: 'Telugu' },
    { code: 'ta', name: 'Tamil' },
  ];

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiService.users.getProfile();
      const profileData = response.data || {};
      setProfile({ ...profile, ...profileData });
      setEditedProfile({ ...profile, ...profileData });
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await apiService.users.updateProfile(editedProfile);
      setProfile(editedProfile);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile({ ...profile });
    setEditing(false);
  };

  const toggleSpecialty = (specialty) => {
    const currentSpecialties = editedProfile.specialties || [];
    let newSpecialties;
    
    if (currentSpecialties.includes(specialty)) {
      newSpecialties = currentSpecialties.filter(s => s !== specialty);
    } else {
      newSpecialties = [...currentSpecialties, specialty];
    }
    
    setEditedProfile({ ...editedProfile, specialties: newSpecialties });
  };

  const toggleLanguage = (language) => {
    const currentLanguages = editedProfile.languages || [];
    let newLanguages;
    
    if (currentLanguages.includes(language.code)) {
      newLanguages = currentLanguages.filter(l => l !== language.code);
    } else {
      newLanguages = [...currentLanguages, language.code];
    }
    
    setEditedProfile({ ...editedProfile, languages: newLanguages });
  };

  const updateAvailability = (day, field, value) => {
    setEditedProfile({
      ...editedProfile,
      availability: {
        ...editedProfile.availability,
        [day]: {
          ...editedProfile.availability[day],
          [field]: value,
        },
      },
    });
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: signOut, style: 'destructive' },
      ]
    );
  };

  const ProfileField = ({ label, value, onChangeText, multiline = false, editable = true, placeholder }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing && editable ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not specified'}</Text>
      )}
    </View>
  );

  const SpecialtyChip = ({ specialty, isSelected, onPress }) => (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.selectedChip]}
      onPress={onPress}
      disabled={!editing}
    >
      <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
        {specialty}
      </Text>
    </TouchableOpacity>
  );

  const LanguageChip = ({ language, isSelected, onPress }) => (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.selectedChip]}
      onPress={onPress}
      disabled={!editing}
    >
      <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
        {language.name}
      </Text>
    </TouchableOpacity>
  );

  const AvailabilityRow = ({ day, dayData }) => (
    <View style={styles.availabilityRow}>
      <View style={styles.dayInfo}>
        <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
        <Switch
          value={dayData.enabled}
          onValueChange={(value) => updateAvailability(day, 'enabled', value)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
          disabled={!editing}
        />
      </View>
      {dayData.enabled && (
        <View style={styles.timeSlots}>
          <TextInput
            style={styles.timeInput}
            value={dayData.start}
            onChangeText={(value) => updateAvailability(day, 'start', value)}
            placeholder="09:00"
            placeholderTextColor={colors.textSecondary}
            editable={editing}
          />
          <Text style={styles.timeSeparator}>to</Text>
          <TextInput
            style={styles.timeInput}
            value={dayData.end}
            onChangeText={(value) => updateAvailability(day, 'end', value)}
            placeholder="17:00"
            placeholderTextColor={colors.textSecondary}
            editable={editing}
          />
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <MaterialCommunityIcons name="account" size={48} color={colors.primary} />
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: profile.isAvailable ? colors.success : colors.error }]} />
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={styles.profileName}>{profile.name || user?.displayName || 'Counsellor'}</Text>
          <Text style={styles.profileEmail}>{profile.email || user?.email}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.totalSessions || '0'}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {editing ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              <MaterialCommunityIcons name="check" size={20} color={colors.surface} />
              <Text style={styles.actionButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelEdit}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setEditing(true)}
          >
            <MaterialCommunityIcons name="pencil" size={20} color={colors.surface} />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <ProfileField
          label="Full Name"
          value={editedProfile.name}
          onChangeText={(value) => setEditedProfile({ ...editedProfile, name: value })}
          placeholder="Enter your full name"
        />
        
        <ProfileField
          label="Email"
          value={editedProfile.email}
          editable={false}
        />
        
        <ProfileField
          label="Phone Number"
          value={editedProfile.phone}
          onChangeText={(value) => setEditedProfile({ ...editedProfile, phone: value })}
          placeholder="Enter your phone number"
        />
        
        <ProfileField
          label="Bio"
          value={editedProfile.bio}
          onChangeText={(value) => setEditedProfile({ ...editedProfile, bio: value })}
          placeholder="Tell students about yourself..."
          multiline
        />
      </View>

      {/* Professional Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        
        <ProfileField
          label="Qualifications"
          value={editedProfile.qualifications}
          onChangeText={(value) => setEditedProfile({ ...editedProfile, qualifications: value })}
          placeholder="e.g., Ph.D. in Psychology, Licensed Clinical Psychologist"
          multiline
        />
        
        <ProfileField
          label="Experience"
          value={editedProfile.experience}
          onChangeText={(value) => setEditedProfile({ ...editedProfile, experience: value })}
          placeholder="e.g., 5 years of clinical experience"
        />
      </View>

      {/* Specialties */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specialties</Text>
        <Text style={styles.sectionSubtitle}>Select your areas of expertise</Text>
        <View style={styles.chipsContainer}>
          {specialtyOptions.map((specialty) => (
            <SpecialtyChip
              key={specialty}
              specialty={specialty}
              isSelected={(editedProfile.specialties || []).includes(specialty)}
              onPress={() => toggleSpecialty(specialty)}
            />
          ))}
        </View>
      </View>

      {/* Languages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Languages</Text>
        <Text style={styles.sectionSubtitle}>Languages you can provide counseling in</Text>
        <View style={styles.chipsContainer}>
          {languageOptions.map((language) => (
            <LanguageChip
              key={language.code}
              language={language}
              isSelected={(editedProfile.languages || []).includes(language.code)}
              onPress={() => toggleLanguage(language)}
            />
          ))}
        </View>
      </View>

      {/* Availability */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <Switch
            value={editedProfile.isAvailable}
            onValueChange={(value) => setEditedProfile({ ...editedProfile, isAvailable: value })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            disabled={!editing}
          />
        </View>
        <Text style={styles.sectionSubtitle}>Set your weekly availability hours</Text>
        
        {Object.entries(editedProfile.availability || {}).map(([day, dayData]) => (
          <AvailabilityRow key={day} day={day} dayData={dayData} />
        ))}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={colors.text} />
          <Text style={styles.settingText}>Notification Settings</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color={colors.text} />
          <Text style={styles.settingText}>Help & Support</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <MaterialCommunityIcons name="shield-outline" size={24} color={colors.text} />
          <Text style={styles.settingText}>Privacy Policy</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.settingItem, styles.signOutItem]} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={24} color={colors.error} />
          <Text style={[styles.settingText, { color: colors.error }]}>Sign Out</Text>
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
  header: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
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
  editButton: {
    backgroundColor: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.success,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.surface,
    marginLeft: 4,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  fieldValue: {
    fontSize: 16,
    color: colors.text,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedChipText: {
    color: colors.surface,
  },
  availabilityRow: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  dayInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timeSlots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    width: 80,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  signOutItem: {
    borderBottomWidth: 0,
  },
});

export default CounsellorProfileScreen;