import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Card, Chip, Searchbar } from 'react-native-paper';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, handleApiError } from '../../services/apiService';

const ResourcesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [resources, setResources] = useState([
    {
      id: '1',
      title: 'Understanding Anxiety',
      description: 'Learn about anxiety symptoms and coping strategies',
      category: 'articles',
      language: 'en',
      type: 'article',
      duration: '5 min read',
      tags: ['anxiety', 'mental-health'],
      popularity: 4.8,
      views: 1250
    },
    {
      id: '2',
      title: 'Breathing Exercise',
      description: 'Guided breathing exercise to reduce stress',
      category: 'exercises',
      language: 'en',
      type: 'exercise',
      duration: '10 mins',
      tags: ['breathing', 'stress'],
      popularity: 4.9,
      views: 980
    }
  ]);
  
  const [filteredResources, setFilteredResources] = useState(resources);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'All', icon: 'grid' },
    { value: 'articles', label: 'Articles', icon: 'document-text' },
    { value: 'videos', label: 'Videos', icon: 'play-circle' },
    { value: 'exercises', label: 'Exercises', icon: 'fitness' },
  ];

  useEffect(() => {
    filterResources();
  }, [searchQuery, selectedCategory]);

  const filterResources = () => {
    let filtered = resources;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query)
      );
    }
    setFilteredResources(filtered);
  };

  const openResource = (resource) => {
    Alert.alert('Resource Opened', resource.title, [{ text: 'OK' }]);
  };

  const renderResourceCard = ({ item: resource }) => (
    <Card style={styles.resourceCard}>
      <TouchableOpacity onPress={() => openResource(resource)}>
        <Card.Content>
          <View style={styles.resourceHeader}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
            <Text style={styles.resourceDuration}>{resource.duration}</Text>
          </View>
          <Text style={styles.resourceTitle} numberOfLines={2}>
            {resource.title}
          </Text>
          <Text style={styles.resourceDescription} numberOfLines={3}>
            {resource.description}
          </Text>
          <View style={styles.tagsContainer}>
            {resource.tags.map((tag, index) => (
              <Chip key={index} style={styles.tagChip} compact>
                {tag}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  const renderCategoryFilter = ({ item: category }) => (
    <TouchableOpacity
      style={[
        styles.categoryFilter,
        selectedCategory === category.value && styles.selectedCategoryFilter
      ]}
      onPress={() => setSelectedCategory(category.value)}
    >
      <Ionicons name={category.icon} size={16} color={colors.textSecondary} />
      <Text style={styles.categoryFilterText}>{category.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wellness Resources</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search resources..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryFilter}
          keyExtractor={(item) => item.value}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <FlatList
        data={filteredResources}
        renderItem={renderResourceCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="library" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Resources Found</Text>
            <Text style={styles.emptyText}>Try adjusting your search.</Text>
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
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryFilter: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryFilterText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  listContainer: {
    padding: spacing.md,
  },
  resourceCard: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resourceDuration: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  resourceTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  resourceDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.primaryLight,
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
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default ResourcesScreen;
