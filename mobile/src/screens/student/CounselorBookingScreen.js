import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Chip, FAB, Portal, Modal, TextInput } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function CounselorBookingScreen({ navigation }) {
  const theme = useTheme();
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');

  useEffect(() => {
    fetchCounselors();
  }, []);

  const fetchCounselors = async () => {
    try {
      // Mock data for now
      const mockCounselors = [
        {
          id: '1',
          name: 'Dr. Sarah Johnson',
          specialization: 'Anxiety & Depression',
          experience: '8 years',
          rating: 4.8,
          languages: ['English', 'Spanish'],
          available: true
        },
        {
          id: '2',
          name: 'Dr. Michael Chen',
          specialization: 'Academic Stress',
          experience: '5 years',
          rating: 4.6,
          languages: ['English', 'Mandarin'],
          available: true
        }
      ];
      
      setCounselors(mockCounselors);
    } catch (error) {
      console.error('Error fetching counselors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookCounselor = (counselor) => {
    setSelectedCounselor(counselor);
    setBookingModalVisible(true);
  };

  const submitBooking = async () => {
    try {
      // Submit booking request
      Alert.alert(
        'Booking Submitted',
        'Your booking request has been sent to the counselor. You will be notified once they respond.',
        [{ text: 'OK', onPress: () => setBookingModalVisible(false) }]
      );
      setBookingNotes('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit booking request');
    }
  };

  const renderCounselorCard = (counselor) => (
    <Card key={counselor.id} style={styles.counselorCard}>
      <Card.Content>
        <View style={styles.counselorHeader}>
          <Avatar.Icon
            size={60}
            icon="account"
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
          <View style={styles.counselorInfo}>
            <Title style={styles.counselorName}>{counselor.name}</Title>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Paragraph style={styles.rating}>{counselor.rating}</Paragraph>
            </View>
          </View>
        </View>

        <Paragraph style={styles.specialization}>
          <Icon name="psychology" size={16} /> {counselor.specialization}
        </Paragraph>
        
        <Paragraph style={styles.experience}>
          <Icon name="work" size={16} /> {counselor.experience} experience
        </Paragraph>

        <View style={styles.languagesContainer}>
          {counselor.languages.map((language) => (
            <Chip key={language} style={styles.languageChip} textStyle={styles.chipText}>
              {language}
            </Chip>
          ))}
        </View>

        <Button
          mode="contained"
          onPress={() => handleBookCounselor(counselor)}
          style={styles.bookButton}
          disabled={!counselor.available}
        >
          {counselor.available ? 'Book Session' : 'Unavailable'}
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.headerTitle}>Book a Counselor</Title>
            <Paragraph style={styles.headerSubtitle}>
              Connect with qualified mental health professionals
            </Paragraph>
          </Card.Content>
        </Card>

        {counselors.map(renderCounselorCard)}
      </ScrollView>

      <Portal>
        <Modal
          visible={bookingModalVisible}
          onDismiss={() => setBookingModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>
            Book Session with {selectedCounselor?.name}
          </Title>
          
          <TextInput
            label="Additional Notes (Optional)"
            value={bookingNotes}
            onChangeText={setBookingNotes}
            multiline
            numberOfLines={4}
            style={styles.notesInput}
            placeholder="Describe what you'd like to discuss..."
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setBookingModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={submitBooking}
              style={styles.modalButton}
            >
              Send Request
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    marginTop: 8,
  },
  counselorCard: {
    margin: 16,
    marginTop: 8,
  },
  counselorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  counselorInfo: {
    flex: 1,
  },
  counselorName: {
    fontSize: 18,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
  },
  specialization: {
    marginBottom: 8,
    fontSize: 14,
  },
  experience: {
    marginBottom: 16,
    fontSize: 14,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  languageChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 12,
  },
  bookButton: {
    marginTop: 8,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  notesInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.45,
  },
});