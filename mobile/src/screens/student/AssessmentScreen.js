import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, ProgressBar, RadioButton, Text } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself or that you are a failure",
  "Trouble concentrating on things",
  "Moving or speaking slowly, or being restless",
  "Thoughts that you would be better off dead"
];

const RESPONSE_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" }
];

export default function AssessmentScreen({ navigation }) {
  const theme = useTheme();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState(Array(9).fill(null));

  const handleResponseChange = (value) => {
    const newResponses = [...responses];
    newResponses[currentQuestion] = parseInt(value);
    setResponses(newResponses);
  };

  const handleNext = () => {
    if (currentQuestion < PHQ9_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score and navigate to results
      const score = responses.reduce((sum, response) => sum + (response || 0), 0);
      navigation.navigate('AssessmentResults', { score, responses });
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const progress = (currentQuestion + 1) / PHQ9_QUESTIONS.length;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title style={styles.title}>PHQ-9 Assessment</Title>
          <Paragraph style={styles.subtitle}>
            Question {currentQuestion + 1} of {PHQ9_QUESTIONS.length}
          </Paragraph>
          <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
        </Card.Content>
      </Card>

      <Card style={styles.questionCard}>
        <Card.Content>
          <Title style={styles.questionTitle}>
            {PHQ9_QUESTIONS[currentQuestion]}
          </Title>
          
          <Text style={styles.instructionText}>
            Over the last 2 weeks, how often have you been bothered by this problem?
          </Text>

          <RadioButton.Group
            onValueChange={handleResponseChange}
            value={responses[currentQuestion]?.toString() || ''}
          >
            {RESPONSE_OPTIONS.map((option) => (
              <View key={option.value} style={styles.radioOption}>
                <RadioButton.Item
                  label={option.label}
                  value={option.value.toString()}
                  style={styles.radioItem}
                />
              </View>
            ))}
          </RadioButton.Group>
        </Card.Content>
      </Card>

      <View style={styles.navigationContainer}>
        <Button
          mode="outlined"
          onPress={handlePrevious}
          disabled={currentQuestion === 0}
          style={styles.navButton}
        >
          Previous
        </Button>
        
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={responses[currentQuestion] === null}
          style={styles.navButton}
        >
          {currentQuestion === PHQ9_QUESTIONS.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
  },
  progressBar: {
    marginTop: 16,
    height: 8,
    borderRadius: 4,
  },
  questionCard: {
    margin: 16,
    marginTop: 8,
  },
  questionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  radioOption: {
    marginVertical: 4,
  },
  radioItem: {
    paddingVertical: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
  },
  navButton: {
    flex: 0.45,
  },
});