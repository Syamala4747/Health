import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Chip,
  ProgressBar,
  Surface,
  IconButton,
  FAB
} from 'react-native-paper';
import {
  MaterialCommunityIcons
} from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';

const StudentDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    wellnessScore: 75,
    lastAssessment: null,
    upcomingSessions: [],
    recentActivity: [],
    quickStats: {
      assessmentsCompleted: 0,
      sessionsAttended: 0,
      resourcesViewed: 0
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user's latest assessment
      const assessmentQuery = query(
        collection(db, 'assessments'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const assessmentSnapshot = await getDocs(assessmentQuery);
      let lastAssessment = null;
      
      if (!assessmentSnapshot.empty) {
        lastAssessment = assessmentSnapshot.docs[0].data();
      }

      // Load upcoming sessions
      const sessionsQuery = query(
        collection(db, 'counselor_bookings'),
        where('studentId', '==', user.uid),
        where('status', '==', 'accepted'),
        orderBy('requestedAt', 'desc'),
        limit(3)
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const upcomingSessions = [];
      
      sessionsSnapshot.forEach((doc) => {
        upcomingSessions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setDashboardData(prev => ({
        ...prev,
        lastAssessment,
        upcomingSessions,
        wellnessScore: lastAssessment?.wellnessScore || 75
      }));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWellnessColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getWellnessMessage = (score) => {
    if (score >= 80) return 'Great! You\'re doing well';
    if (score >= 60) return 'Good, with room for improvement';
    return 'Consider seeking additional support';
  };

  const handleTakeAssessment = () => {
    navigation.navigate('Assessment');
  };

  const handleAICounselor = () => {
    navigation.navigate('AICounselor');
  };

  const handleBookCounselor = () => {
    navigation.navigate('CounselorBooking');
  };

  const handleResourceHub = () => {
    navigation.navigate('ResourceHub');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDashboardData} />
        }
      >
        {/* Welcome Section */}
        <Surface style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Avatar.Icon 
              size={60} 
              icon="account" 
              style={styles.avatar}
            />
            <View style={styles.welcomeText}>
              <Title style={styles.welcomeTitle}>
                Welcome back!
              </Title>
              <Paragraph style={styles.welcomeSubtitle}>
                How are you feeling today?
              </Paragraph>
            </View>
          </View>
        </Surface>

        {/* Wellness Score */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.wellnessHeader}>
              <MaterialCommunityIcons 
                name="heart-pulse" 
                size={24} 
                color={getWellnessColor(dashboardData.wellnessScore)} 
              />
              <Title style={styles.cardTitle}>Mental Wellness Score</Title>
            </View>
            
            <View style={styles.wellnessScore}>
              <Title style={[styles.scoreText, { color: getWellnessColor(dashboardData.wellnessScore) }]}>
                {dashboardData.wellnessScore}%
              </Title>
              <Paragraph style={styles.scoreMessage}>
                {getWellnessMessage(dashboardData.wellnessScore)}
              </Paragraph>
            </View>
            
            <ProgressBar 
              progress={dashboardData.wellnessScore / 100} 
              color={getWellnessColor(dashboardData.wellnessScore)}
              style={styles.progressBar}
            />
            
            {dashboardData.lastAssessment && (
              <Paragraph style={styles.lastAssessment}>
                Last assessment: {new Date(dashboardData.lastAssessment.timestamp?.toDate()).toLocaleDateString()}
              </Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            
            <View style={styles.actionGrid}>
              <Surface style={styles.actionCard} onTouchEnd={handleTakeAssessment}>
                <MaterialCommunityIcons name="clipboard-check" size={32} color="#2196F3" />
                <Paragraph style={styles.actionText}>Take Assessment</Paragraph>
              </Surface>
              
              <Surface style={styles.actionCard} onTouchEnd={handleAICounselor}>
                <MaterialCommunityIcons name="robot" size={32} color="#4CAF50" />
                <Paragraph style={styles.actionText}>AI Counselor</Paragraph>
              </Surface>
              
              <Surface style={styles.actionCard} onTouchEnd={handleBookCounselor}>
                <MaterialCommunityIcons name="account-heart" size={32} color="#FF9800" />
                <Paragraph style={styles.actionText}>Book Counselor</Paragraph>
              </Surface>
              
              <Surface style={styles.actionCard} onTouchEnd={handleResourceHub}>
                <MaterialCommunityIcons name="library" size={32} color="#9C27B0" />
                <Paragraph style={styles.actionText}>Resources</Paragraph>
              </Surface>
            </View>
          </Card.Content>
        </Card>

        {/* Upcoming Sessions */}
        {dashboardData.upcomingSessions.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Upcoming Sessions</Title>
              
              {dashboardData.upcomingSessions.map((session) => (
                <Surface key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionContent}>
                    <MaterialCommunityIcons 
                      name="calendar-clock" 
                      size={24} 
                      color="#2196F3" 
                    />
                    <View style={styles.sessionDetails}>
                      <Paragraph style={styles.sessionTitle}>
                        {session.type === 'chat' ? 'Chat Session' : 
                         session.type === 'audio' ? 'Audio Call' : 'Chat + Audio'}
                      </Paragraph>
                      <Paragraph style={styles.sessionSubtitle}>
                        with {session.counselorName}
                      </Paragraph>
                    </View>
                    <Chip mode="outlined" compact>
                      {session.status}
                    </Chip>
                  </View>
                </Surface>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Quick Stats */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Your Progress</Title>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="chart-line" size={24} color="#4CAF50" />
                <Paragraph style={styles.statNumber}>
                  {dashboardData.quickStats.assessmentsCompleted}
                </Paragraph>
                <Paragraph style={styles.statLabel}>Assessments</Paragraph>
              </View>
              
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="account-group" size={24} color="#2196F3" />
                <Paragraph style={styles.statNumber}>
                  {dashboardData.quickStats.sessionsAttended}
                </Paragraph>
                <Paragraph style={styles.statLabel}>Sessions</Paragraph>
              </View>
              
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="book-open" size={24} color="#FF9800" />
                <Paragraph style={styles.statNumber}>
                  {dashboardData.quickStats.resourcesViewed}
                </Paragraph>
                <Paragraph style={styles.statLabel}>Resources</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Emergency Resources */}
        <Card style={[styles.card, styles.emergencyCard]}>
          <Card.Content>
            <View style={styles.emergencyHeader}>
              <MaterialCommunityIcons name="alert-circle" size={24} color="#F44336" />
              <Title style={[styles.cardTitle, styles.emergencyTitle]}>
                Need Immediate Help?
              </Title>
            </View>
            
            <Paragraph style={styles.emergencyText}>
              If you're experiencing a mental health crisis, help is available 24/7.
            </Paragraph>
            
            <View style={styles.emergencyActions}>
              <Button 
                mode="contained" 
                buttonColor="#F44336"
                onPress={() => Alert.alert(
                  'Crisis Support',
                  'National Crisis Lifeline: 988\nCrisis Text Line: Text HOME to 741741',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Call 988', onPress: () => {} }
                  ]
                )}
                style={styles.emergencyButton}
              >
                Crisis Support
              </Button>
              
              <Button 
                mode="outlined" 
                textColor="#F44336"
                onPress={() => navigation.navigate('Resources', { filter: 'crisis' })}
              >
                Crisis Resources
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          Alert.alert(
            'Quick Actions',
            'What would you like to do?',
            [
              { text: 'Take Assessment', onPress: handleTakeAssessment },
              { text: 'Talk to AI', onPress: handleAICounselor },
              { text: 'Book Counselor', onPress: handleBookCounselor },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    marginRight: 16,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  wellnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  wellnessScore: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  lastAssessment: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  actionText: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  sessionCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  sessionTitle: {
    fontWeight: '500',
  },
  sessionSubtitle: {
    opacity: 0.7,
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  emergencyCard: {
    borderColor: '#F44336',
    borderWidth: 1,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyTitle: {
    color: '#F44336',
    marginLeft: 8,
    marginBottom: 0,
  },
  emergencyText: {
    marginBottom: 16,
    lineHeight: 20,
  },
  emergencyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emergencyButton: {
    flex: 1,
    marginRight: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default StudentDashboard;