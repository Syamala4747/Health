import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { Card, Button, Chip, Avatar, ActivityIndicator, Badge, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

const CounselorCard = ({ counselor, onBookSession }) => (
  <Card style={styles.counselorCard}>
    <Card.Content>
      <View style={styles.counselorHeader}>
        <Avatar.Text size={50} label={counselor.name.split(' ').map(n => n[0]).join('')} />
        <View style={styles.counselorInfo}>
          <Text style={styles.counselorName}>{counselor.name}</Text>
          <Text style={styles.counselorSpecialty}>{counselor.specialty}</Text>
          <Text style={styles.counselorExperience}>{counselor.experience} years experience</Text>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={16} color="#ffa726" />
            <Text style={styles.rating}>{counselor.rating} ({counselor.reviews} reviews)</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <Badge 
            style={[
              styles.statusBadge, 
              { backgroundColor: counselor.available ? '#4caf50' : '#f44336' }
            ]}
          >
            {counselor.available ? 'Available' : 'Busy'}
          </Badge>
        </View>
      </View>
      
      <View style={styles.languagesContainer}>
        <Text style={styles.languagesLabel}>Languages:</Text>
        {counselor.languages.map((lang, index) => (
          <Chip key={index} style={styles.languageChip} textStyle={styles.languageText}>
            {lang}
          </Chip>
        ))}
      </View>
      
      <Text style={styles.counselorBio} numberOfLines={3}>
        {counselor.bio}
      </Text>
      
      <View style={styles.sessionTypes}>
        <Text style={styles.sessionTypesLabel}>Session Types:</Text>
        <View style={styles.sessionTypesList}>
          {counselor.sessionTypes.map((type, index) => (
            <Chip key={index} style={styles.sessionTypeChip}>
              {type}
            </Chip>
          ))}
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <Button 
          mode="outlined" 
          style={styles.actionButton}
          onPress={() => {/* View profile */}}
        >
          View Profile
        </Button>
        <Button 
          mode="contained" 
          style={styles.actionButton}
          onPress={() => onBookSession(counselor)}
          disabled={!counselor.available}
        >
          Book Session
        </Button>
      </View>
    </Card.Content>
  </Card>
);

const SessionCard = ({ session, onAction }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'completed': return '#2196f3';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card style={styles.sessionCard}>
      <Card.Content>
        <View style={styles.sessionHeader}>
          <View>
            <Text style={styles.sessionTitle}>{session.type} Session</Text>
            <Text style={styles.sessionCounselor}>with {session.counselorName}</Text>
            <Text style={styles.sessionDate}>{formatDate(session.dateTime)}</Text>
          </View>
          <Badge style={[styles.sessionStatus, { backgroundColor: getStatusColor(session.status) }]}>
            {session.status.toUpperCase()}
          </Badge>
        </View>
        
        <View style={styles.sessionDetails}>
          <View style={styles.sessionDetailItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
            <Text style={styles.sessionDetailText}>{session.duration} minutes</Text>
          </View>
          <View style={styles.sessionDetailItem}>
            <MaterialCommunityIcons name="video-outline" size={16} color="#666" />
            <Text style={styles.sessionDetailText}>{session.format}</Text>
          </View>
          <View style={styles.sessionDetailItem}>
            <MaterialCommunityIcons name="currency-usd" size={16} color="#666" />
            <Text style={styles.sessionDetailText}>${session.cost}</Text>
          </View>
        </View>
        
        {session.notes && (
          <Text style={styles.sessionNotes}>Note: {session.notes}</Text>
        )}
        
        <View style={styles.sessionActions}>
          {session.status === 'pending' && (
            <>
              <Button 
                mode="outlined" 
                style={styles.sessionActionButton}
                onPress={() => onAction('cancel', session)}
              >
                Cancel
              </Button>
              <Button 
                mode="outlined" 
                style={styles.sessionActionButton}
                onPress={() => onAction('reschedule', session)}
              >
                Reschedule
              </Button>
            </>
          )}
          
          {session.status === 'confirmed' && (
            <>
              <Button 
                mode="contained" 
                style={styles.sessionActionButton}
                onPress={() => onAction('join', session)}
              >
                Join Session
              </Button>
              <Button 
                mode="outlined" 
                style={styles.sessionActionButton}
                onPress={() => onAction('reschedule', session)}
              >
                Reschedule
              </Button>
            </>
          )}
          
          {session.status === 'completed' && (
            <Button 
              mode="outlined" 
              style={styles.sessionActionButton}
              onPress={() => onAction('feedback', session)}
            >
              Leave Feedback
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const EmergencySupport = () => (
  <Card style={styles.emergencyCard}>
    <Card.Content>
      <View style={styles.emergencyHeader}>
        <MaterialCommunityIcons name="phone-alert" size={24} color="#d32f2f" />
        <Text style={styles.emergencyTitle}>Need Immediate Help?</Text>
      </View>
      <Text style={styles.emergencyText}>
        If you're in crisis or having thoughts of self-harm, please reach out immediately:
      </Text>
      <View style={styles.emergencyContacts}>
        <Button 
          mode="contained" 
          style={styles.emergencyButton}
          buttonColor="#d32f2f"
          onPress={() => {/* Call crisis line */}}
        >
          📞 Crisis Hotline: 988
        </Button>
        <Button 
          mode="outlined" 
          style={styles.emergencyButton}
          onPress={() => {/* Text crisis line */}}
        >
          📱 Text: HOME to 741741
        </Button>
      </View>
    </Card.Content>
  </Card>
);

export default function EnhancedSessionsScreen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counselors, setCounselors] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Mock data
  const mockCounselors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialty: "Anxiety & Depression",
      experience: 8,
      rating: 4.9,
      reviews: 127,
      available: true,
      languages: ["English", "Spanish"],
      bio: "Specialized in cognitive-behavioral therapy with extensive experience in treating anxiety disorders, depression, and trauma. Passionate about helping students navigate academic stress and life transitions.",
      sessionTypes: ["Individual", "Group", "Crisis"],
      cost: 75
    },
    {
      id: 2,
      name: "Dr. Rajesh Patel",
      specialty: "Academic Stress & Career Counseling",
      experience: 12,
      rating: 4.8,
      reviews: 89,
      available: true,
      languages: ["English", "Hindi", "Gujarati"],
      bio: "Expert in academic stress management and career guidance. Helps students overcome study-related anxiety and develop effective coping strategies for academic success.",
      sessionTypes: ["Individual", "Academic Support"],
      cost: 80
    },
    {
      id: 3,
      name: "Dr. Emily Chen",
      specialty: "Mindfulness & Stress Reduction",
      experience: 6,
      rating: 4.7,
      reviews: 156,
      available: false,
      languages: ["English", "Mandarin"],
      bio: "Mindfulness-based stress reduction specialist. Integrates meditation, breathing techniques, and cognitive therapy to help students achieve mental clarity and emotional balance.",
      sessionTypes: ["Individual", "Group", "Mindfulness"],
      cost: 70
    }
  ];

  const mockSessions = [
    {
      id: 1,
      type: "Individual Therapy",
      counselorName: "Dr. Sarah Johnson",
      dateTime: "2024-01-15T14:00:00",
      duration: 50,
      format: "Video Call",
      cost: 75,
      status: "confirmed",
      notes: "Follow-up session for anxiety management techniques"
    },
    {
      id: 2,
      type: "Group Therapy",
      counselorName: "Dr. Emily Chen",
      dateTime: "2024-01-12T16:00:00",
      duration: 60,
      format: "Video Call",
      cost: 45,
      status: "completed",
      notes: "Mindfulness and stress reduction group"
    },
    {
      id: 3,
      type: "Academic Support",
      counselorName: "Dr. Rajesh Patel",
      dateTime: "2024-01-18T10:00:00",
      duration: 45,
      format: "Phone Call",
      cost: 60,
      status: "pending",
      notes: "Career guidance and study strategies"
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCounselors(mockCounselors);
      setSessions(mockSessions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleBookSession = (counselor) => {
    Alert.alert(
      "Book Session",
      `Book a session with ${counselor.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Book Now",
          onPress: () => {
            // Navigate to booking form
            Alert.alert("Success", "Booking request sent! You'll receive confirmation within 24 hours.");
          }
        }
      ]
    );
  };

  const handleSessionAction = (action, session) => {
    switch (action) {
      case 'cancel':
        Alert.alert(
          "Cancel Session",
          "Are you sure you want to cancel this session?",
          [
            { text: "No", style: "cancel" },
            { text: "Yes", onPress: () => Alert.alert("Session cancelled") }
          ]
        );
        break;
      case 'reschedule':
        Alert.alert("Reschedule", "Redirecting to reschedule form...");
        break;
      case 'join':
        Alert.alert("Join Session", "Starting video call...");
        break;
      case 'feedback':
        Alert.alert("Feedback", "Redirecting to feedback form...");
        break;
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'available':
        return (
          <View>
            <EmergencySupport />
            {counselors.map(counselor => (
              <CounselorCard
                key={counselor.id}
                counselor={counselor}
                onBookSession={handleBookSession}
              />
            ))}
          </View>
        );
      case 'sessions':
        return (
          <View>
            {sessions.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text style={styles.emptyText}>No sessions booked yet</Text>
                  <Button 
                    mode="contained" 
                    onPress={() => setActiveTab('available')}
                    style={styles.emptyButton}
                  >
                    Find Counselors
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              sessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onAction={handleSessionAction}
                />
              ))
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <MaterialCommunityIcons 
            name="account-search" 
            size={20} 
            color={activeTab === 'available' ? '#1976d2' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Find Counselors
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sessions' && styles.activeTab]}
          onPress={() => setActiveTab('sessions')}
        >
          <MaterialCommunityIcons 
            name="calendar-clock" 
            size={20} 
            color={activeTab === 'sessions' ? '#1976d2' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'sessions' && styles.activeTabText]}>
            My Sessions ({sessions.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        label="Quick Book"
        onPress={() => Alert.alert("Quick Book", "Find the next available counselor...")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
  },
  tabText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emergencyCard: {
    marginBottom: 15,
    backgroundColor: '#ffebee',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginLeft: 8,
  },
  emergencyText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  emergencyContacts: {
    gap: 10,
  },
  emergencyButton: {
    marginBottom: 5,
  },
  counselorCard: {
    marginBottom: 15,
  },
  counselorHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  counselorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  counselorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  counselorSpecialty: {
    fontSize: 14,
    color: '#1976d2',
    marginTop: 2,
  },
  counselorExperience: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    color: '#fff',
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  languagesLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  languageChip: {
    marginRight: 5,
    height: 24,
  },
  languageText: {
    fontSize: 10,
  },
  counselorBio: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 15,
  },
  sessionTypes: {
    marginBottom: 15,
  },
  sessionTypesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  sessionTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  sessionTypeChip: {
    height: 28,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  sessionCard: {
    marginBottom: 15,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sessionCounselor: {
    fontSize: 14,
    color: '#1976d2',
    marginTop: 2,
  },
  sessionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sessionStatus: {
    color: '#fff',
  },
  sessionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 10,
  },
  sessionDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  sessionNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  sessionActionButton: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyButton: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976d2',
  },
});