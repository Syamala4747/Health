import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 cards per row with margins

export default function StudentDashboard({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const dashboardCards = [
    {
      id: 'health',
      title: t('dashboard.knowYourHealth'),
      subtitle: t('dashboard.takeAssessments'),
      icon: 'heart-pulse',
      color: theme.colors.secondary,
      onPress: () => navigation.navigate('Assessment', { type: 'health' }),
    },
    {
      id: 'ai',
      title: t('dashboard.aiCounsellor'),
      subtitle: t('dashboard.chatWithAI'),
      icon: 'robot',
      color: theme.colors.accent,
      onPress: () => navigation.navigate('Chat', { type: 'ai' }),
    },
    {
      id: 'human',
      title: t('dashboard.humanCounsellor'),
      subtitle: t('dashboard.connectProfessional'),
      icon: 'account-heart',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Sessions'),
    },
    {
      id: 'resources',
      title: t('dashboard.resourceHub'),
      subtitle: t('dashboard.articlesVideos'),
      icon: 'library',
      color: '#9370DB',
      onPress: () => navigation.navigate('Resources'),
    },
  ];

  const renderCard = (card) => (
    <TouchableOpacity
      key={card.id}
      style={[styles.card, { backgroundColor: card.color, width: cardWidth }]}
      onPress={card.onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name={card.icon}
        size={40}
        color={theme.colors.surface}
        style={styles.cardIcon}
      />
      <Text style={[styles.cardTitle, { color: theme.colors.surface }]}>
        {card.title}
      </Text>
      <Text style={[styles.cardSubtitle, { color: theme.colors.surface }]}>
        {card.subtitle}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.secondary }]}>
        <Text style={styles.logo}>🌸</Text>
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          {t('app.welcome')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>
          {user?.email || t('app.subtitle')}
        </Text>
      </View>

      {/* Dashboard Cards */}
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('dashboard.yourWellnessJourney')}
        </Text>
        
        <View style={styles.cardsContainer}>
          {dashboardCards.map(renderCard)}
        </View>

        {/* Emergency Section */}
        <View style={[styles.emergencyContainer, { backgroundColor: theme.colors.error }]}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={24}
            color={theme.colors.surface}
            style={styles.emergencyIcon}
          />
          <Text style={[styles.emergencyTitle, { color: theme.colors.surface }]}>
            {t('emergency.needHelp')}
          </Text>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() => navigation.navigate('Crisis')}
          >
            <Text style={[styles.emergencyButtonText, { color: theme.colors.surface }]}>
              🆘 {t('emergency.crisisResources')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>7</Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              {t('stats.daysActive')}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>85%</Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              {t('stats.wellnessScore')}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    opacity: 0.9,
    textAlign: 'center',
  },
  emergencyContainer: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  emergencyIcon: {
    marginBottom: 8,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emergencyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});