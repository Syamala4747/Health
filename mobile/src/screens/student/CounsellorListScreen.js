import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Card, Chip, Searchbar, Badge } from 'react-native-paper';

import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, handleApiError } from '../../services/apiService';

const CounsellorListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [counsellors, setCounsellors] = useState([]);
  const [filteredCounsellors, setFilteredCounsellors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [availableSpecialties, setAvailableSpecialties] = useState([]);

  useEffect(() => {
    loadCounsellors();
  }, []);

  useEffect(() => {
    filterCounsellors();
  }, [searchQuery, selectedSpecialties, counsellors]);

  const loadCounsellors = async () => {
    try {
      setLoading(true);
      const response = await apiService.users.getCounsellors();
      
      // Filter only approved and active counsellors
      const activeCounsellors = response.data.filter(
        counsellor => counsellor.approved && !counsellor.isBlocked
      );
      
      setCounsellors(activeCounsellors);
      
      // Extract unique specialties
      const specialties = [...new Set(
        activeCounsellors.flatMap(c => c.specialties || [])
      )];
      setAvailableSpecialties(specialties);
      
    } catch (error) {
      console.error('Failed to load counsellors:', error);
      Alert.alert('Error', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCounsellors();
    setRefreshing(false);
  };

  const filterCounsellors = () => {
    let filtered = counsellors;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(counsellor =>
        counsellor.name.toLowerCase().includes(query) ||
        counsellor.bio?.toLowerCase().includes(query) ||
        counsellor.specialties?.some(s => s.toLowerCase().includes(query))
      );
    }

    // Filter by selected specialties
    if (selectedSpecialties.length > 0) {
      filtered = filtered.filter(counsellor =>
        selectedSpecialties.some(specialty =>
          counsellor.specialties?.includes(specialty)
        )
      );
    }

    setFilteredCounsellors(filtered);
  };

  const toggleSpecialty = (specialty) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const bookCounsellor = (counsellorId) => {
    navigation.navigate('BookingScreen', { counsellorId });
  };

  const startChat = (counsellorId) => {
    navigation.navigate('ChatScreen', { counsellorId, type: 'counsellor' });
  };

  const selectRandomCounsellor = () => {
    if (filteredCounsellors.length === 0) {
      Alert.alert('No Counsellors', 'No counsellors available at the moment.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * filteredCounsellors.length);
    const randomCounsellor = filteredCounsellors[randomIndex];
    
    Alert.alert(
      'Random Counsellor Selected',
      `You've been matched with ${randomCounsellor.name}. Would you like to book a session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book Session', onPress: () => bookCounsellor(randomCounsellor.id) },
        { text: 'Start Chat', onPress: () => startChat(randomCounsellor.id) }
      ]
    );
  };

  const renderCounsellorCard = ({ item: counsellor }) => {
    return (
      <Card style={styles.counsellorCard}>
        <Card.Content>
          <View style={styles.counsellorHeader}>
            <View style={styles.avatarContainer}>
              {counsellor.photoURL ? (
                <Image source={{ uri: counsellor.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color={colors.textSecondary} />
                </View>
              )}
              {counsellor.isOnline && (
                <Badge style={styles.onlineBadge} size={12} />
              )}
            </View>

            <View style={styles.counsellorInfo}>
              <Text style={styles.counsellorName}>{counsellor.name}</Text>
              <Text style={styles.counsellorTitle}>
                {counsellor.title || 'Mental Health Counsellor'}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={styles.rating}>
                  {counsellor.rating?.toFixed(1) || 'New'} 
                  {counsellor.totalReviews ? ` (${counsellor.totalReviews})` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.availabilityIndicator}>
              <Text style={[
                styles.availabilityText,
                { color: counsellor.isAvailable ? colors.success : colors.textSecondary }
              ]}>
                {counsellor.isAvailable ? 'Available' : 'Busy'}
              </Text>
            </View>
          </View>

          {counsellor.bio && (
            <Text style={styles.counsellorBio} numberOfLines={2}>
              {counsellor.bio}
            </Text>
          )}

          {counsellor.specialties && counsellor.specialties.length > 0 && (
            <View style={styles.specialtiesContainer}>
              {counsellor.specialties.slice(0, 3).map((specialty, index) => (
                <Chip 
                  key={index} 
                  style={styles.specialtyChip}
                  textStyle={styles.specialtyChipText}
                  compact
                >
                  {specialty}
                </Chip>
              ))}
              {counsellor.specialties.length > 3 && (
                <Text style={styles.moreSpecialties}>
                  +{counsellor.specialties.length - 3} more
                </Text>
              )}
            </View>
          )}

          <View style={styles.counsellorActions}>
            <Button
              mode="outlined"
              onPress={() => startChat(counsellor.id)}
              style={styles.actionButton}
              disabled={!counsellor.isAvailable}
              compact
            >
              Chat
            </Button>
            <Button
              mode="contained"
              onPress={() => bookCounsellor(counsellor.id)}
              style={styles.actionButton}
              compact
            >
              Book Session
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderSpecialtyFilter = ({ item: specialty }) => (
    <Chip
      selected={selectedSpecialties.includes(specialty)}
      onPress={() => toggleSpecialty(specialty)}
      style={[
        styles.filterChip,
        selectedSpecialties.includes(specialty) && styles.selectedFilterChip
      ]}
      textStyle={styles.filterChipText}
    >
      {specialty}
    </Chip>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading counsellors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find a Counsellor</Text>
        <TouchableOpacity onPress={selectRandomCounsellor}>
          <Ionicons name="shuffle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search counsellors..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      </View>

      {availableSpecialties.length > 0 && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Specialties:</Text>
          <FlatList
            data={availableSpecialties}
            renderItem={renderSpecialtyFilter}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersList}
          />
        </View>
      )}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredCounsellors.length} counsellor{filteredCounsellors.length !== 1 ? 's' : ''} available
        </Text>
        <TouchableOpacity onPress={selectRandomCounsellor}>
          <Text style={styles.randomButton}>Random Match</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCounsellors}
        renderItem={renderCounsellorCard}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Counsellors Found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or specialty filters.
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                setSearchQuery('');
                setSelectedSpecialties([]);
              }}
              style={styles.clearFiltersButton}
            >
              Clear Filters
            </Button>
          </View>
        }
      />
    </View>
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
  searchContainer: {
    padding: spacing.md,
  },
  searchBar: {
    backgroundColor: colors.surface,
  },
  filtersContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  filtersTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filtersList: {
    flexGrow: 0,
  },
  filterChip: {
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  selectedFilterChip: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  resultsCount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  randomButton: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  listContainer: {
    padding: spacing.md,
  },
  counsellorCard: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  counsellorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.success,
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
  availabilityIndicator: {
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    textTransform: 'uppercase',
  },
  counsellorBio: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
    lineHeight: typography.lineHeight.sm,
    marginBottom: spacing.md,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  specialtyChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.primaryLight,
  },
  specialtyChipText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  moreSpecialties: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  counsellorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.48,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  clearFiltersButton: {
    marginTop: spacing.md,
  },
});

export default CounsellorListScreen;