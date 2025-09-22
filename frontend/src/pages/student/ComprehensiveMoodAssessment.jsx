import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Box,
  Alert,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
  Divider,
  useTheme,
  alpha
} from '@mui/material'
import {
  Psychology,
  CheckCircle,
  Info,
  Warning,
  Error,
  Lightbulb,
  ArrowForward,
  ArrowBack,
  Assignment,
  Mood,
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  Favorite,
  LocalHospital
} from '@mui/icons-material'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'

export default function ComprehensiveMoodAssessment() {
  const { user } = useAuth()
  const theme = useTheme()
  const [currentPhase, setCurrentPhase] = useState('intro') // intro, phq9, gad7, results
  const [currentStep, setCurrentStep] = useState(0)
  const [phq9Answers, setPhq9Answers] = useState([])
  const [gad7Answers, setGad7Answers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // PHQ-9 Questions for Depression Assessment
  const phq9Questions = [
    "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
    "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
    "Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?",
    "Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?",
    "Over the last 2 weeks, how often have you been bothered by poor appetite or overeating?",
    "Over the last 2 weeks, how often have you been bothered by feeling bad about yourself - or that you are a failure or have let yourself or your family down?",
    "Over the last 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading the newspaper or watching television?",
    "Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual?",
    "Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead, or of hurting yourself?"
  ]

  // GAD-7 Questions for Anxiety Assessment
  const gad7Questions = [
    "Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?",
    "Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?",
    "Over the last 2 weeks, how often have you been bothered by worrying too much about different things?",
    "Over the last 2 weeks, how often have you been bothered by trouble relaxing?",
    "Over the last 2 weeks, how often have you been bothered by being so restless that it is hard to sit still?",
    "Over the last 2 weeks, how often have you been bothered by becoming easily annoyed or irritable?",
    "Over the last 2 weeks, how often have you been bothered by feeling afraid, as if something awful might happen?"
  ]

  const responseOptions = [
    { value: 0, text: "Not at all" },
    { value: 1, text: "Several days" },
    { value: 2, text: "More than half the days" },
    { value: 3, text: "Nearly every day" }
  ]

  const calculateMoodPercentages = (phq9Score, gad7Score) => {
    // Calculate depression severity (0-27 scale)
    const depressionPercentage = Math.round((phq9Score / 27) * 100)
    
    // Calculate anxiety severity (0-21 scale)
    const anxietyPercentage = Math.round((gad7Score / 21) * 100)
    
    // Calculate overall wellness (inverted from symptoms)
    const overallWellness = Math.round(((48 - phq9Score - gad7Score) / 48) * 100)
    
    // Calculate mood state percentages based on scores
    let happyPercentage = 0
    let sadPercentage = 0
    let depressedPercentage = 0
    let anxiousPercentage = 0
    let stressedPercentage = 0
    let calmPercentage = 0

    // Happy percentage (higher when both scores are low)
    if (phq9Score <= 4 && gad7Score <= 4) {
      happyPercentage = 85 + Math.random() * 10 // 85-95%
    } else if (phq9Score <= 9 && gad7Score <= 9) {
      happyPercentage = 60 + Math.random() * 15 // 60-75%
    } else if (phq9Score <= 14 && gad7Score <= 14) {
      happyPercentage = 30 + Math.random() * 15 // 30-45%
    } else {
      happyPercentage = 10 + Math.random() * 15 // 10-25%
    }

    // Depressed percentage (based on PHQ-9)
    if (phq9Score <= 4) {
      depressedPercentage = 5 + Math.random() * 10 // 5-15%
    } else if (phq9Score <= 9) {
      depressedPercentage = 25 + Math.random() * 15 // 25-40%
    } else if (phq9Score <= 14) {
      depressedPercentage = 50 + Math.random() * 15 // 50-65%
    } else if (phq9Score <= 19) {
      depressedPercentage = 70 + Math.random() * 15 // 70-85%
    } else {
      depressedPercentage = 85 + Math.random() * 10 // 85-95%
    }

    // Anxious percentage (based on GAD-7)
    if (gad7Score <= 4) {
      anxiousPercentage = 5 + Math.random() * 10 // 5-15%
    } else if (gad7Score <= 9) {
      anxiousPercentage = 30 + Math.random() * 15 // 30-45%
    } else if (gad7Score <= 14) {
      anxiousPercentage = 60 + Math.random() * 15 // 60-75%
    } else {
      anxiousPercentage = 80 + Math.random() * 15 // 80-95%
    }

    // Sad percentage (correlated with depression but milder)
    sadPercentage = Math.max(0, depressedPercentage - 20 + Math.random() * 20)

    // Stressed percentage (combination of both)
    stressedPercentage = Math.round((anxiousPercentage + depressedPercentage) / 2) + Math.random() * 10

    // Calm percentage (inverse of anxiety)
    calmPercentage = Math.max(0, 100 - anxiousPercentage - Math.random() * 10)

    return {
      happy: Math.round(happyPercentage),
      sad: Math.round(sadPercentage),
      depressed: Math.round(depressedPercentage),
      anxious: Math.round(anxiousPercentage),
      stressed: Math.round(stressedPercentage),
      calm: Math.round(calmPercentage),
      overallWellness,
      depressionSeverity: depressionPercentage,
      anxietySeverity: anxietyPercentage
    }
  }

  const calculateDetailedResult = () => {
    const phq9Score = phq9Answers.reduce((sum, answer) => sum + answer, 0)
    const gad7Score = gad7Answers.reduce((sum, answer) => sum + answer, 0)
    
    const moodPercentages = calculateMoodPercentages(phq9Score, gad7Score)
    
    // Determine overall severity
    let overallSeverity = 'excellent'
    let interpretation = ''
    let recommendations = []
    let aiPersonality = 'encouraging'

    if (phq9Score <= 4 && gad7Score <= 4) {
      overallSeverity = 'excellent'
      interpretation = 'Excellent mental wellness! You show minimal signs of depression or anxiety.'
      aiPersonality = 'encouraging'
      recommendations = [
        'Continue your current healthy habits',
        'Maintain regular exercise and good sleep',
        'Keep practicing mindfulness or meditation',
        'Stay connected with supportive people'
      ]
    } else if (phq9Score <= 9 && gad7Score <= 9) {
      overallSeverity = 'good'
      interpretation = 'Good mental wellness with some areas to monitor.'
      aiPersonality = 'supportive'
      recommendations = [
        'Consider stress management techniques',
        'Increase physical activity and outdoor time',
        'Practice relaxation techniques daily',
        'Monitor your symptoms regularly'
      ]
    } else if (phq9Score <= 14 || gad7Score <= 14) {
      overallSeverity = 'moderate'
      interpretation = 'Moderate concerns detected. Your symptoms may be impacting daily life.'
      aiPersonality = 'gentle'
      recommendations = [
        'Consider speaking with a counselor',
        'Practice daily stress reduction techniques',
        'Maintain a regular sleep schedule',
        'Consider joining a support group'
      ]
    } else if (phq9Score <= 19 || gad7Score > 14) {
      overallSeverity = 'concerning'
      interpretation = 'Significant concerns detected. Professional support is recommended.'
      aiPersonality = 'caring'
      recommendations = [
        'Seek professional mental health support',
        'Contact a counselor or therapist soon',
        'Consider both therapy and medication options',
        'Inform trusted friends or family'
      ]
    } else {
      overallSeverity = 'severe'
      interpretation = 'Serious concerns detected. Immediate professional help is recommended.'
      aiPersonality = 'crisis'
      recommendations = [
        'Seek immediate professional help',
        'Contact a mental health crisis line if needed',
        'Go to emergency services if you feel unsafe',
        'Ensure you have support people around you'
      ]
    }

    return {
      phq9Score,
      gad7Score,
      moodPercentages,
      overallSeverity,
      interpretation,
      recommendations,
      aiPersonality,
      completedAt: new Date().toISOString()
    }
  }

  const saveAssessmentResult = async (result) => {
    if (!user) return

    try {
      const assessmentDoc = {
        userId: user.uid,
        type: 'PHQ-9-GAD-7',
        phq9Answers,
        gad7Answers,
        result,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }

      // Save to assessments collection
      await setDoc(doc(db, 'assessments', `${user.uid}_${Date.now()}`), assessmentDoc)

      // Update user's latest wellness score
      const userDocRef = doc(db, 'users', user.uid)
      await setDoc(userDocRef, {
        lastAssessment: {
          type: 'PHQ-9-GAD-7',
          phq9Score: result.phq9Score,
          gad7Score: result.gad7Score,
          overallWellness: result.moodPercentages.overallWellness,
          severity: result.overallSeverity,
          aiPersonality: result.aiPersonality,
          moodPercentages: result.moodPercentages,
          completedAt: result.completedAt
        }
      }, { merge: true })

      console.log('✅ Assessment result saved successfully')
    } catch (error) {
      console.error('❌ Error saving assessment result:', error)
    }
  }

  const handleAnswerChange = (event) => {
    setSelectedAnswer(parseInt(event.target.value))
  }

  const handleNext = () => {
    if (selectedAnswer === '') return

    if (currentPhase === 'phq9') {
      const newAnswers = [...phq9Answers, selectedAnswer]
      setPhq9Answers(newAnswers)

      if (currentStep < phq9Questions.length - 1) {
        setCurrentStep(currentStep + 1)
        setSelectedAnswer('')
      } else {
        // Move to GAD-7
        setCurrentPhase('gad7')
        setCurrentStep(0)
        setSelectedAnswer('')
      }
    } else if (currentPhase === 'gad7') {
      const newAnswers = [...gad7Answers, selectedAnswer]
      setGad7Answers(newAnswers)

      if (currentStep < gad7Questions.length - 1) {
        setCurrentStep(currentStep + 1)
        setSelectedAnswer('')
      } else {
        // Assessment complete
        setLoading(true)
        const assessmentResult = calculateDetailedResult()
        setResult(assessmentResult)
        saveAssessmentResult(assessmentResult)
        setIsCompleted(true)
        setCurrentPhase('results')
        setLoading(false)
      }
    }
  }

  const handlePrevious = () => {
    if (currentPhase === 'phq9' && currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setSelectedAnswer(phq9Answers[currentStep - 1] || '')
      setPhq9Answers(phq9Answers.slice(0, -1))
    } else if (currentPhase === 'gad7') {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1)
        setSelectedAnswer(gad7Answers[currentStep - 1] || '')
        setGad7Answers(gad7Answers.slice(0, -1))
      } else {
        // Go back to PHQ-9
        setCurrentPhase('phq9')
        setCurrentStep(phq9Questions.length - 1)
        setSelectedAnswer(phq9Answers[phq9Questions.length - 1] || '')
      }
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'excellent': return '#4caf50'
      case 'good': return '#8bc34a'
      case 'moderate': return '#ff9800'
      case 'concerning': return '#f44336'
      case 'severe': return '#d32f2f'
      default: return '#2196f3'
    }
  }

  const getMoodIcon = (mood) => {
    switch (mood) {
      case 'happy': return <SentimentVerySatisfied sx={{ color: '#4caf50' }} />
      case 'calm': return <SentimentSatisfied sx={{ color: '#8bc34a' }} />
      case 'sad': return <SentimentDissatisfied sx={{ color: '#ff9800' }} />
      case 'stressed': return <SentimentNeutral sx={{ color: '#ff5722' }} />
      case 'anxious': return <SentimentDissatisfied sx={{ color: '#f44336' }} />
      case 'depressed': return <SentimentVeryDissatisfied sx={{ color: '#d32f2f' }} />
      default: return <Mood />
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Analyzing your responses...
        </Typography>
      </Container>
    )
  }

  if (currentPhase === 'intro') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Comprehensive Mood Assessment
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            PHQ-9 Depression & GAD-7 Anxiety Screening
          </Typography>
          
          <Alert severity="info" sx={{ mt: 3, mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              This assessment includes:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• 9 questions about depression symptoms (PHQ-9)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• 7 questions about anxiety symptoms (GAD-7)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Detailed mood percentage breakdown" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Personalized AI counselor adaptation" />
              </ListItem>
            </List>
          </Alert>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This will take approximately 5-7 minutes to complete. Your responses are confidential and will help personalize your mental health support.
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => setCurrentPhase('phq9')}
            startIcon={<ArrowForward />}
          >
            Start Assessment
          </Button>
        </Paper>
      </Container>
    )
  }

  if (currentPhase === 'results' && result) {
    const moodData = [
      { name: 'Happy', value: result.moodPercentages.happy, color: '#4caf50' },
      { name: 'Calm', value: result.moodPercentages.calm, color: '#8bc34a' },
      { name: 'Sad', value: result.moodPercentages.sad, color: '#ff9800' },
      { name: 'Stressed', value: result.moodPercentages.stressed, color: '#ff5722' },
      { name: 'Anxious', value: result.moodPercentages.anxious, color: '#f44336' },
      { name: 'Depressed', value: result.moodPercentages.depressed, color: '#d32f2f' }
    ]

    const assessmentScores = [
      { name: 'Overall Wellness', value: result.moodPercentages.overallWellness, color: '#2196f3' },
      { name: 'Depression Level', value: result.moodPercentages.depressionSeverity, color: '#d32f2f' },
      { name: 'Anxiety Level', value: result.moodPercentages.anxietySeverity, color: '#f44336' }
    ]

    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Assessment Complete!
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* Overall Wellness Score */}
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', backgroundColor: alpha(getSeverityColor(result.overallSeverity), 0.1) }}>
                <CardContent>
                  <Typography variant="h3" sx={{ color: getSeverityColor(result.overallSeverity) }}>
                    {result.moodPercentages.overallWellness}%
                  </Typography>
                  <Typography variant="h6">Overall Wellness</Typography>
                  <Chip 
                    label={result.overallSeverity.toUpperCase()}
                    sx={{ 
                      backgroundColor: getSeverityColor(result.overallSeverity),
                      color: 'white',
                      mt: 1
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Depression Score */}
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="h4" color="error">
                    {result.phq9Score}/27
                  </Typography>
                  <Typography variant="h6">Depression (PHQ-9)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {result.moodPercentages.depressionSeverity}% severity level
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Anxiety Score */}
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="h4" color="warning.main">
                    {result.gad7Score}/21
                  </Typography>
                  <Typography variant="h6">Anxiety (GAD-7)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {result.moodPercentages.anxietySeverity}% severity level
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Mood Percentages Chart */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Mood sx={{ mr: 1 }} />
                  Mood State Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={moodData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {moodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Psychology sx={{ mr: 1 }} />
                  Assessment Scores
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={assessmentScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                    <Bar dataKey="value" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed Mood Breakdown */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detailed Mood Analysis
            </Typography>
            <Grid container spacing={2}>
              {moodData.map((mood) => (
                <Grid item xs={12} sm={6} md={4} key={mood.name}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 2, 
                    border: 1, 
                    borderColor: 'divider',
                    borderRadius: 2,
                    backgroundColor: alpha(mood.color, 0.1)
                  }}>
                    {getMoodIcon(mood.name.toLowerCase())}
                    <Box sx={{ ml: 2, flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {mood.name}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={mood.value} 
                        sx={{ 
                          mt: 1,
                          backgroundColor: alpha(mood.color, 0.2),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: mood.color
                          }
                        }}
                      />
                      <Typography variant="h6" sx={{ color: mood.color, mt: 1 }}>
                        {mood.value}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Interpretation and Recommendations */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Lightbulb sx={{ mr: 1 }} />
              Your Assessment Results
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              {result.interpretation}
            </Alert>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Personalized Recommendations:
            </Typography>
            <List>
              {result.recommendations.map((rec, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={rec} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Crisis Alert if Needed */}
        {result.overallSeverity === 'severe' && (
          <Alert severity="error" sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
              Immediate Support Available
            </Typography>
            <Typography variant="body2">
              Your responses indicate you may need immediate support. Please consider:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Crisis Hotline: 988 (Suicide & Crisis Lifeline)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Crisis Text: Text HOME to 741741" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Emergency Services: 911" />
              </ListItem>
            </List>
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Psychology />}
            onClick={() => window.location.href = '/student'}
          >
            Return to Dashboard
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => window.location.href = '/student/chat'}
          >
            Talk to AI Counselor
          </Button>
        </Box>
      </Container>
    )
  }

  // Question Display
  const currentQuestions = currentPhase === 'phq9' ? phq9Questions : gad7Questions
  const totalQuestions = phq9Questions.length + gad7Questions.length
  const currentQuestionNumber = currentPhase === 'phq9' ? currentStep + 1 : phq9Questions.length + currentStep + 1
  const progress = (currentQuestionNumber / totalQuestions) * 100

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Progress Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            {currentPhase === 'phq9' ? 'Depression Assessment (PHQ-9)' : 'Anxiety Assessment (GAD-7)'}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Question {currentQuestionNumber} of {totalQuestions}
          </Typography>
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {Math.round(progress)}% Complete
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {currentQuestions[currentStep]}
          </Typography>
          
          <RadioGroup
            value={selectedAnswer}
            onChange={handleAnswerChange}
            sx={{ mt: 3 }}
          >
            {responseOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.text}
                sx={{ 
                  mb: 1,
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              />
            ))}
          </RadioGroup>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handlePrevious}
              disabled={currentPhase === 'phq9' && currentStep === 0}
            >
              Previous
            </Button>
            
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={handleNext}
              disabled={selectedAnswer === ''}
            >
              {currentPhase === 'gad7' && currentStep === gad7Questions.length - 1 
                ? 'Complete Assessment' 
                : 'Next Question'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          Your responses are confidential and will be used to provide personalized mental health support. 
          Take your time and answer as honestly as possible.
        </Typography>
      </Alert>
    </Container>
  )
}