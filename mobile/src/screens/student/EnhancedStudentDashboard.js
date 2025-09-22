import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert
} from 'react-native';
import { Card, Button, Chip, ProgressBar, RadioButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const EmotionTestModal = ({ visible, onClose }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState('selection');
  const [phq9Answers, setPhq9Answers] = useState({});
  const [gad7Answers, setGad7Answers] = useState({});
  const [testResults, setTestResults] = useState(null);

  // PHQ-9 Questions
  const phq9Questions = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself or that you are a failure",
    "Trouble concentrating on things",
    "Moving or speaking slowly, or being fidgety/restless",
    "Thoughts that you would be better off dead or hurting yourself"
  ];

  // GAD-7 Questions
  const gad7Questions = [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it is hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid, as if something awful might happen"
  ];

  const responseOptions = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" }
  ];

  const calculateResults = () => {
    const phq9Score = Object.values(phq9Answers).reduce((sum, val) => sum + val, 0);
    const gad7Score = Object.values(gad7Answers).reduce((sum, val) => sum + val, 0);

    const getPhq9Level = (score) => {
      if (score <= 4) return { level: 'Minimal', color: 'success', description: 'Minimal or no depression' };
      if (score <= 9) return { level: 'Mild', color: 'warning', description: 'Mild depression' };
      if (score <= 14) return { level: 'Moderate', color: 'warning', description: 'Moderate depression' };
      if (score <= 19) return { level: 'Moderately Severe', color: 'error', description: 'Moderately severe depression' };
      return { level: 'Severe', color: 'error', description: 'Severe depression' };
    };

    const getGad7Level = (score) => {
      if (score <= 4) return { level: 'Minimal', color: 'success', description: 'Minimal anxiety' };
      if (score <= 9) return { level: 'Mild', color: 'warning', description: 'Mild anxiety' };
      if (score <= 14) return { level: 'Moderate', color: 'warning', description: 'Moderate anxiety' };
      return { level: 'Severe', color: 'error', description: 'Severe anxiety' };
    };

    setTestResults({
      phq9: { score: phq9Score, ...getPhq9Level(phq9Score) },
      gad7: { score: gad7Score, ...getGad7Level(gad7Score) }
    });
    setCurrentStep('results');
  };

  const resetTest = () => {
    setCurrentStep('selection');
    setPhq9Answers({});
    setGad7Answers({});
    setTestResults(null);
  };

  const renderQuestion = (question, index, answers, setAnswers) => (
    <View key={index} style={styles.questionContainer}>
      <Text style={styles.questionText}>
        {index + 1}. {question}
      </Text>
      <RadioButton.Group
        onValueChange={(value) => setAnswers(prev => ({ ...prev, [index]: parseInt(value) }))}
        value={answers[index]?.toString() || ''}
      >
        {responseOptions.map((option) => (
          <View key={option.value} style={styles.radioOption}>
            <RadioButton value={option.value.toString()} />
            <Text style={styles.radioLabel}>{option.label}</Text>
          </View>
        ))}
      </RadioButton.Group>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('mentalHealthAssessment')}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {currentStep === 'selection' && (
            <View>
              <Text style={styles.sectionTitle}>Clinical Mental Health Assessment</Text>
              <Text style={styles.description}>
                This assessment combines two validated screening tools
              </Text>
              
              <Card style={styles.assessmentCard}>
                <Card.Content>
                  <Text style={styles.cardTitle}>PHQ-9: Depression Screening</Text>
                  <Text style={styles.cardDescription}>
                    9 questions to assess depression symptoms over the past 2 weeks
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.assessmentCard}>
                <Card.Content>
                  <Text style={styles.cardTitle}>GAD-7: Anxiety Screening</Text>
                  <Text style={styles.cardDescription}>
                    7 questions to assess anxiety symptoms over the past 2 weeks
                  </Text>
                </Card.Content>
              </Card>

              <Text style={styles.note}>
                Note: This is a screening tool, not a diagnostic instrument. 
                Results should be discussed with a healthcare professional.
              </Text>
              
              <Button
                mode="contained"
                onPress={() => setCurrentStep('phq9')}
                style={styles.startButton}
              >
                {t('startAssessment')}
              </Button>
            </View>
          )}

          {currentStep === 'phq9' && (
            <View>
              <Text style={styles.sectionTitle}>{t('phq9Title')}</Text>
              <Text style={styles.description}>
                Over the last 2 weeks, how often have you been bothered by any of the following problems?
              </Text>
              
              {phq9Questions.map((question, index) => 
                renderQuestion(question, index, phq9Answers, setPhq9Answers)
              )}
              
              <View style={styles.buttonContainer}>
                <Button onPress={() => setCurrentStep('selection')}>
                  {t('back')}
                </Button>
                <Button 
                  mode="contained"
                  onPress={() => setCurrentStep('gad7')}
                  disabled={Object.keys(phq9Answers).length !== phq9Questions.length}
                >
                  Next: Anxiety Assessment
                </Button>
              </View>
            </View>
          )}

          {currentStep === 'gad7' && (
            <View>
              <Text style={styles.sectionTitle}>{t('gad7Title')}</Text>
              <Text style={styles.description}>
                Over the last 2 weeks, how often have you been bothered by the following problems?
              </Text>
              
              {gad7Questions.map((question, index) => 
                renderQuestion(question, index, gad7Answers, setGad7Answers)
              )}
              
              <View style={styles.buttonContainer}>
                <Button onPress={() => setCurrentStep('phq9')}>
                  {t('back')}
                </Button>
                <Button 
                  mode="contained"
                  onPress={calculateResults}
                  disabled={Object.keys(gad7Answers).length !== gad7Questions.length}
                >
                  Complete Assessment
                </Button>
              </View>
            </View>
          )}

          {currentStep === 'results' && testResults && (
            <View>
              <Text style={styles.sectionTitle}>Assessment Results</Text>
              
              <Card style={styles.resultCard}>
                <Card.Content>
                  <Text style={styles.resultTitle}>Depression (PHQ-9)</Text>
                  <Text style={styles.resultScore}>{testResults.phq9.score}/27</Text>
                  <Chip mode="outlined">{testResults.phq9.level}</Chip>
                  <Text style={styles.resultDescription}>{testResults.phq9.description}</Text>
                </Card.Content>
              </Card>

              <Card style={styles.resultCard}>
                <Card.Content>
                  <Text style={styles.resultTitle}>Anxiety (GAD-7)</Text>
                  <Text style={styles.resultScore}>{testResults.gad7.score}/21</Text>
                  <Chip mode="outlined">{testResults.gad7.level}</Chip>
                  <Text style={styles.resultDescription}>{testResults.gad7.description}</Text>
                </Card.Content>
              </Card>

              <Card style={styles.noteCard}>
                <Card.Content>
                  <Text style={styles.noteTitle}>📌 Important Notes:</Text>
                  <Text style={styles.noteText}>
                    • These results are for screening purposes only and do not constitute a diagnosis{'\n'}
                    • If you scored in the moderate to severe range, consider speaking with a healthcare professional{'\n'}
                    • Crisis resources are available 24/7 if you're having thoughts of self-harm
                  </Text>
                </Card.Content>
              </Card>

              <View style={styles.buttonContainer}>
                <Button onPress={resetTest}>Take Again</Button>
                <Button mode="contained" onPress={onClose}>{t('close')}</Button>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const FeatureCard = ({ title, description, icon, color, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.featureCard}>
    <Card>
      <Card.Content style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon} size={24} color="#fff" />
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </Card.Content>
    </Card>
  </TouchableOpacity>
);

export default function StudentDashboardScreen({ navigation }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [emotionTestVisible, setEmotionTestVisible] = useState(false);

  const features = [
    {
      title: t('mentalHealthAssessment'),
      description: t('assessmentDescription'),
      icon: 'brain',
      color: '#e91e63',
      action: () => setEmotionTestVisible(true)
    },
    {
      title: t('findCounsellor'),
      description: t('counsellorDescription'),
      icon: 'account-heart',
      color: '#2196f3',
      action: () => navigation.navigate('CounsellorList')
    },
    {
      title: t('resourceHub'),
      description: t('resourceDescription'),
      icon: 'book-open-variant',
      color: '#4caf50',
      action: () => navigation.navigate('Resources')
    },
    {
      title: t('aiChatbot'),
      description: t('chatbotDescription'),
      icon: 'robot',
      color: '#ff9800',
      action: () => navigation.navigate('Chatbot')
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{t('welcome')}</Text>
        <Text style={styles.subtitle}>{t('subtitle')}</Text>
      </View>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            color={feature.color}
            onPress={feature.action}
          />
        ))}
      </View>

      <EmotionTestModal
        visible={emotionTestVisible}
        onClose={() => setEmotionTestVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  featuresContainer: {
    padding: 10,
  },
  featureCard: {
    marginVertical: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  featureDescription: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  assessmentCard: {
    marginVertical: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  note: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 15,
  },
  startButton: {
    marginTop: 20,
  },
  questionContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  resultCard: {
    marginVertical: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginVertical: 5,
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  noteCard: {
    backgroundColor: '#e3f2fd',
    marginVertical: 15,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
  },
});