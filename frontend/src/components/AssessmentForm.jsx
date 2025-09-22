import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stepper,
  Step,
  StepLabel,
  Paper,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import {
  Psychology,
  BarChart,
  Mood,
  TrendingUp,
} from '@mui/icons-material';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const AssessmentForm = ({ open, onClose, onComplete, onStartAIChat }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [phq9Answers, setPhq9Answers] = useState({});
  const [gad7Answers, setGad7Answers] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // PHQ-9 Questions
  const phq9Questions = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things, such as reading the newspaper or watching television",
    "Moving or speaking so slowly that other people could have noticed, or the opposite being so fidgety or restless that you have been moving around a lot more than usual",
    "Thoughts that you would be better off dead, or of hurting yourself"
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

  const answerOptions = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" }
  ];

  const steps = ['PHQ-9 Assessment', 'GAD-7 Assessment', 'Results'];

  const handlePhq9Answer = (questionIndex, value) => {
    const numValue = parseInt(value);
    console.log(`PHQ-9 Question ${questionIndex}: ${value} (parsed: ${numValue})`);
    setPhq9Answers(prev => ({
      ...prev,
      [questionIndex]: numValue
    }));
  };

  const handleGad7Answer = (questionIndex, value) => {
    const numValue = parseInt(value);
    console.log(`GAD-7 Question ${questionIndex}: ${value} (parsed: ${numValue})`);
    setGad7Answers(prev => ({
      ...prev,
      [questionIndex]: numValue
    }));
  };

  const calculateResults = () => {
    // Calculate PHQ-9 score
    const phq9Score = Object.values(phq9Answers).reduce((sum, score) => sum + score, 0);
    
    // Calculate GAD-7 score
    const gad7Score = Object.values(gad7Answers).reduce((sum, score) => sum + score, 0);

    // Calculate mood percentages based on responses
    const totalQuestions = 16;
    const totalPossibleScore = totalQuestions * 3;
    const combinedScore = phq9Score + gad7Score;

    // Mood percentage calculations
    const stressLevel = Math.max(0, Math.min(100, (gad7Score / 21) * 100));
    const depressionLevel = Math.max(0, Math.min(100, (phq9Score / 27) * 100));
    
    const moodPercentages = {
      happy: Math.max(0, 100 - (combinedScore / totalPossibleScore) * 100),
      calm: Math.max(0, 100 - stressLevel),
      sad: Math.min(100, depressionLevel * 0.7),
      stressed: stressLevel,
      anxious: Math.min(100, stressLevel * 0.8),
      depressed: depressionLevel
    };

    // Determine severity levels
    const phq9Severity = phq9Score <= 4 ? 'Minimal' : 
                        phq9Score <= 9 ? 'Mild' :
                        phq9Score <= 14 ? 'Moderate' :
                        phq9Score <= 19 ? 'Moderately Severe' : 'Severe';

    const gad7Severity = gad7Score <= 4 ? 'Minimal' :
                        gad7Score <= 9 ? 'Mild' :
                        gad7Score <= 14 ? 'Moderate' : 'Severe';

    return {
      phq9Score,
      gad7Score,
      phq9Severity,
      gad7Severity,
      moodPercentages,
      combinedScore,
      timestamp: new Date().toISOString()
    };
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('📝 Assessment submit clicked');
    console.log('PHQ-9 Answers:', phq9Answers);
    console.log('GAD-7 Answers:', gad7Answers);
    console.log('User:', user);
    
    setLoading(true);
    try {
      const assessmentResults = calculateResults();
      console.log('📊 Assessment results calculated:', assessmentResults);
      
      // Calculate wellness score for dashboard
      const wellnessScore = Math.max(0, 100 - ((assessmentResults.phq9Score + assessmentResults.gad7Score) / 48) * 100);
      
      // Prepare data for dashboard
      const dashboardData = {
        percentage: Math.round(wellnessScore),
        severity: assessmentResults.phq9Severity,
        moodPercentages: assessmentResults.moodPercentages,
        completedAt: new Date().toISOString(),
        phq9Score: assessmentResults.phq9Score,
        gad7Score: assessmentResults.gad7Score,
        lastAssessmentDate: new Date().toLocaleDateString()
      };
      
      setResults(assessmentResults);

      // Save to assessments collection
      console.log('💾 Saving to assessments collection...');
      await addDoc(collection(db, 'assessments'), {
        userId: user.uid,
        userEmail: user.email,
        phq9Answers,
        gad7Answers,
        results: assessmentResults,
        timestamp: new Date(),
        type: 'PHQ9_GAD7_Combined'
      });
      
      // Update user document for dashboard
      console.log('📋 Updating user document for dashboard...');
      await updateDoc(doc(db, 'users', user.uid), {
        lastAssessment: dashboardData,
        lastAssessmentDate: new Date()
      });
      
      console.log('✅ Successfully saved assessment and updated dashboard');

      if (onComplete) {
        onComplete({
          ...assessmentResults,
          wellnessScore: Math.round(wellnessScore)
        });
      }

      setCurrentStep(2); // Move to results step
      console.log('📋 Moved to results step');
    } catch (error) {
      console.error('❌ Error saving assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setPhq9Answers({});
    setGad7Answers({});
    setResults(null);
    setLoading(false);
  };

  const handleClose = () => {
    // Only reset if we're not on the results page, or if explicitly closing from results
    if (currentStep !== 2) {
      resetForm();
    } else {
      // On results page, just close but keep the results in case user reopens
      resetForm(); // Reset for next assessment
    }
    onClose();
  };

  const handleCloseFromResults = () => {
    // Explicitly close from results page and reset everything
    resetForm();
    onClose();
  };

  const canProceed = () => {
    if (currentStep === 0) {
      const phq9Complete = Object.keys(phq9Answers).length === phq9Questions.length;
      console.log(`PHQ-9 Progress: ${Object.keys(phq9Answers).length}/${phq9Questions.length} - Can proceed: ${phq9Complete}`);
      return phq9Complete;
    }
    if (currentStep === 1) {
      const gad7Complete = Object.keys(gad7Answers).length === gad7Questions.length;
      console.log(`GAD-7 Progress: ${Object.keys(gad7Answers).length}/${gad7Questions.length} - Can proceed: ${gad7Complete}`);
      return gad7Complete;
    }
    return false;
  };

  const renderPhq9Form = () => (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        PHQ-9 Depression Assessment
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Over the last 2 weeks, how often have you been bothered by any of the following problems?
      </Typography>
      
      {phq9Questions.map((question, index) => (
        <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'medium' }}>
              {index + 1}. {question}
            </FormLabel>
            <RadioGroup
              value={phq9Answers[index] !== undefined ? phq9Answers[index] : ''}
              onChange={(e) => handlePhq9Answer(index, e.target.value)}
              row
            >
              {answerOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                  sx={{ mr: 2 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Paper>
      ))}
    </Box>
  );

  const renderGad7Form = () => (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        GAD-7 Anxiety Assessment
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Over the last 2 weeks, how often have you been bothered by the following problems?
      </Typography>

      {gad7Questions.map((question, index) => (
        <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'medium' }}>
              {index + 1}. {question}
            </FormLabel>
            <RadioGroup
              value={gad7Answers[index] !== undefined ? gad7Answers[index] : ''}
              onChange={(e) => handleGad7Answer(index, e.target.value)}
              row
            >
              {answerOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                  sx={{ mr: 2 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Paper>
      ))}
    </Box>
  );

  const getPersonalizedGuidance = (results) => {
    const { phq9Score, gad7Score, phq9Severity, gad7Severity } = results;
    
    let message = "";
    let severity = "info";
    let aiGuidance = "";
    
    // Determine overall mental health status
    if (phq9Score >= 15 || gad7Score >= 15) {
      message = "You are experiencing significant mental health challenges. ";
      severity = "error";
      if (phq9Score >= 15) message += "You show signs of moderate to severe depression. ";
      if (gad7Score >= 15) message += "You show signs of severe anxiety. ";
      aiGuidance = "It's important to seek professional help immediately. Our AI counselor can provide immediate support while you connect with a healthcare provider.";
    } else if (phq9Score >= 10 || gad7Score >= 10) {
      message = "You are experiencing moderate mental health concerns. ";
      severity = "warning";
      if (phq9Score >= 10) message += "You show signs of moderate depression. ";
      if (gad7Score >= 10) message += "You show signs of moderate anxiety. ";
      aiGuidance = "Consider speaking with a counselor or therapist. Our AI counselor can help you develop coping strategies and provide emotional support.";
    } else if (phq9Score >= 5 || gad7Score >= 5) {
      message = "You are experiencing mild mental health symptoms. ";
      severity = "warning";
      if (phq9Score >= 5) message += "You show signs of mild depression. ";
      if (gad7Score >= 5) message += "You show signs of mild anxiety. ";
      aiGuidance = "These symptoms are manageable with proper support. Our AI counselor can help you learn effective coping techniques and stress management.";
    } else {
      message = "Your mental health appears to be in good condition. ";
      severity = "success";
      aiGuidance = "Great job maintaining your mental wellness! Our AI counselor can help you continue building resilience and positive mental habits.";
    }
    
    return { message, severity, aiGuidance };
  };

  const renderResults = () => {
    const guidance = getPersonalizedGuidance(results);
    
    return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChart /> Assessment Results
        </Typography>
        <Chip 
          label="Results will stay visible until you close" 
          color="info" 
          variant="outlined" 
          size="small" 
        />
      </Box>
      
      {/* Personalized Guidance */}
      <Alert severity={guidance.severity} sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Mental Health Status
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {guidance.message}
        </Typography>
        <Typography variant="body2">
          {guidance.aiGuidance}
        </Typography>
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="primary">Depression (PHQ-9)</Typography>
              <Typography variant="h4" color="text.primary">{results?.phq9Score}/27</Typography>
              <Typography variant="body2" color="text.secondary">
                Severity: {results?.phq9Severity}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="primary">Anxiety (GAD-7)</Typography>
              <Typography variant="h4" color="text.primary">{results?.gad7Score}/21</Typography>
              <Typography variant="body2" color="text.secondary">
                Severity: {results?.gad7Severity}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>Mood Breakdown</Typography>
      <Grid container spacing={2}>
        {results && Object.entries(results.moodPercentages).map(([mood, percentage]) => (
          <Grid item xs={6} sm={4} key={mood}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ textTransform: 'capitalize', color: 'primary.main' }}>
                {mood}
              </Typography>
              <Typography variant="h4" color="text.primary">
                {Math.round(percentage)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={percentage} 
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          These results are for informational purposes only and should not replace professional medical advice. 
          If you're experiencing thoughts of self-harm, please contact emergency services immediately.
        </Typography>
      </Alert>
    </Box>
  )};

  const renderResults_old = () => (
    <Box>
      <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BarChart /> Assessment Results
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="primary">Depression (PHQ-9)</Typography>
              <Typography variant="h4" color="text.primary">{results?.phq9Score}/27</Typography>
              <Typography variant="body2" color="text.secondary">
                Severity: {results?.phq9Severity}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="primary">Anxiety (GAD-7)</Typography>
              <Typography variant="h4" color="text.primary">{results?.gad7Score}/21</Typography>
              <Typography variant="body2" color="text.secondary">
                Severity: {results?.gad7Severity}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>Mood Breakdown</Typography>
      <Grid container spacing={2}>
        {results && Object.entries(results.moodPercentages).map(([mood, percentage]) => (
          <Grid item xs={6} sm={4} key={mood}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ textTransform: 'capitalize', color: 'primary.main' }}>
                {mood}
              </Typography>
              <Typography variant="h4" color="text.primary">
                {Math.round(percentage)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={percentage} 
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          These results are for informational purposes only and should not replace professional medical advice. 
          Consider speaking with a counselor for personalized support.
        </Typography>
      </Alert>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={currentStep === 2 ? () => {} : handleClose} // Prevent closing during results
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={currentStep === 2} // Prevent ESC key closing during results
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Psychology color="primary" />
          <Typography variant="h5">Mental Health Assessment</Typography>
        </Box>
        <Stepper activeStep={currentStep} sx={{ mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {currentStep === 0 && renderPhq9Form()}
        {currentStep === 1 && renderGad7Form()}
        {currentStep === 2 && renderResults()}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        {currentStep === 2 ? (
          <>
            <Button onClick={handleCloseFromResults} variant="outlined">
              Close Assessment
            </Button>
            <Button 
              onClick={() => {
                onStartAIChat(results);
                handleCloseFromResults();
              }}
              variant="contained"
              startIcon={<Psychology />}
              sx={{ 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                color: 'white'
              }}
            >
              Get Support from AI Counselor
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose} variant="outlined">
              Cancel
            </Button>
            {currentStep > 0 && (
              <Button onClick={handleBack}>
                Back
              </Button>
            )}
            {currentStep < 1 ? (
              <Button 
                onClick={handleNext}
                variant="contained"
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                variant="contained"
                disabled={!canProceed() || loading}
              >
                Submit Assessment
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AssessmentForm;