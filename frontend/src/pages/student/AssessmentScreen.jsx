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
  CircularProgress
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
  Assignment
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'

export default function AssessmentScreen() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const questions = [
    {
      id: 1,
      text: "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
      options: [
        { value: 0, text: "Not at all" },
        { value: 1, text: "Several days" },
        { value: 2, text: "More than half the days" },
        { value: 3, text: "Nearly every day" }
      ]
    },
    {
      id: 2,
      text: "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
      options: [
        { value: 0, text: "Not at all" },
        { value: 1, text: "Several days" },
        { value: 2, text: "More than half the days" },
        { value: 3, text: "Nearly every day" }
      ]
    },
    {
      id: 3,
      text: "Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?",
      options: [
        { value: 0, text: "Not at all" },
        { value: 1, text: "Several days" },
        { value: 2, text: "More than half the days" },
        { value: 3, text: "Nearly every day" }
      ]
    },
    {
      id: 4,
      text: "Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?",
      options: [
        { value: 0, text: "Not at all" },
        { value: 1, text: "Several days" },
        { value: 2, text: "More than half the days" },
        { value: 3, text: "Nearly every day" }
      ]
    },
    {
      id: 5,
      text: "Over the last 2 weeks, how often have you been bothered by poor appetite or overeating?",
      options: [
        { value: 0, text: "Not at all" },
        { value: 1, text: "Several days" },
        { value: 2, text: "More than half the days" },
        { value: 3, text: "Nearly every day" }
      ]
    },
    {
      id: 6,
      text: "Over the last 2 weeks, how often have you been bothered by feeling bad about yourself - or that you are a failure or have let yourself or your family down?",
      options: [
        { value: 0, text: "Not at all" },
        { value: 1, text: "Several days" },
        { value: 2, text: "More than half the days" },
        { value: 3, text: "Nearly every day" }
      ]
    },
    {
      id: 7,
      text: "Over the last 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading the newspaper or watching television?",
      options: [
        { value: 0, text: "Not at all" },
        { value: 1, text: "Several days" },
        { value: 2, text: "More than half the days" },
        { value: 3, text: "Nearly every day" }
      ]
    },
    {
      id: 8,
      text: "Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual?",
      options: [
        { value: 0, text: "Not at all" },
        { value: 1, text: "Several days" },
        { value: 2, text: "More than half the days" },
        { value: 3, text: "Nearly every day" }
      ]
    },
    {
      id: 9,
      text: "Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead, or of hurting yourself?",
      options: [
        { value: 0, text: "Not at all" },
        { value: 1, text: "Several days" },
        { value: 2, text: "More than half the days" },
        { value: 3, text: "Nearly every day" }
      ]
    }
  ]

  const calculateScore = (answers) => {
    const totalScore = answers.reduce((sum, answer) => sum + answer, 0)
    const maxScore = 27 // 9 questions × 3 points max each
    const percentage = Math.round(((maxScore - totalScore) / maxScore) * 100) // Inverted so higher % = better wellness
    
    let severity, interpretation, recommendations, aiPersonality

    if (totalScore >= 0 && totalScore <= 4) {
      severity = 'minimal'
      interpretation = 'Excellent mental wellness! You appear to be experiencing very few symptoms of depression.'
      aiPersonality = 'encouraging'
      recommendations = [
        'Continue with your current self-care practices',
        'Maintain regular exercise and healthy sleep habits',
        'Stay connected with friends and family',
        'Consider mindfulness or meditation practices'
      ]
    } else if (totalScore >= 5 && totalScore <= 9) {
      severity = 'mild'
      interpretation = 'Good mental wellness with some areas to watch. You may be experiencing some symptoms that could benefit from attention.'
      aiPersonality = 'supportive'
      recommendations = [
        'Consider talking to a counsellor or therapist',
        'Increase physical activity and outdoor time',
        'Practice stress management techniques',
        'Maintain social connections and activities you enjoy',
        'Monitor your symptoms and seek help if they worsen'
      ]
    } else if (totalScore >= 10 && totalScore <= 14) {
      severity = 'moderate'
      interpretation = 'Moderate concerns detected. Your symptoms are significant and may be impacting your daily life.'
      aiPersonality = 'gentle'
      recommendations = [
        'Strongly consider professional counselling or therapy',
        'Speak with a healthcare provider about your symptoms',
        'Consider joining a support group',
        'Implement structured self-care routines',
        'Avoid alcohol and drugs as coping mechanisms'
      ]
    } else if (totalScore >= 15 && totalScore <= 19) {
      severity = 'moderately_severe'
      interpretation = 'Significant concerns detected. Your symptoms are quite significant and likely affecting multiple areas of your life.'
      aiPersonality = 'caring'
      recommendations = [
        'Seek professional help from a mental health provider immediately',
        'Consider both therapy and medication options',
        'Inform trusted friends or family about your situation',
        'Create a safety plan with professional guidance',
        'Avoid making major life decisions while experiencing these symptoms'
      ]
    } else if (totalScore >= 20) {
      severity = 'severe'
      interpretation = 'Serious concerns detected. You are experiencing significant symptoms that require immediate professional attention.'
      aiPersonality = 'crisis'
      recommendations = [
        'Seek immediate professional help from a mental health provider',
        'Contact your doctor or a mental health crisis line',
        'Consider intensive treatment options',
        'Ensure you have a strong support system in place',
        'If you have thoughts of self-harm, seek emergency help immediately'
      ]
    }

    return {
      score: totalScore,
      percentage,
      severity,
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
        type: 'PHQ-9',
        answers,
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
          type: 'PHQ-9',
          score: result.score,
          percentage: result.percentage,
          severity: result.severity,
          aiPersonality: result.aiPersonality,
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

    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
      setSelectedAnswer('')
    } else {
      // Assessment complete
      setLoading(true)
      const assessmentResult = calculateScore(newAnswers)
      setResult(assessmentResult)
      saveAssessmentResult(assessmentResult)
      setIsCompleted(true)
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setSelectedAnswer(answers[currentStep - 1] || '')
      setAnswers(answers.slice(0, -1))
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'minimal': return 'success'
      case 'mild': return 'info'
      case 'moderate': return 'warning'
      case 'moderately_severe': return 'error'
      case 'severe': return 'error'
      default: return 'info'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'minimal': return <CheckCircle />
      case 'mild': return <Info />
      case 'moderate': return <Warning />
      case 'moderately_severe': return <Error />
      case 'severe': return <Error />
      default: return <Info />
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

  if (isCompleted && result) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Assessment Complete!
          </Typography>
          
          <Card sx={{ mb: 3, backgroundColor: 'background.default' }}>
            <CardContent>
              <Typography variant="h3" color="primary" gutterBottom>
                {result.percentage}%
              </Typography>
              <Typography variant="h6" gutterBottom>
                Your Wellness Score
              </Typography>
              <Chip 
                icon={getSeverityIcon(result.severity)}
                label={result.severity.replace('_', ' ').toUpperCase()}
                color={getSeverityColor(result.severity)}
                sx={{ mb: 2 }}
              />
              <Typography variant="body1" color="text.secondary">
                {result.interpretation}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Lightbulb sx={{ mr: 1 }} />
                Personalized Recommendations
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

          <Alert severity="info" sx={{ mb: 3 }}>
            Your AI counselor has been updated with your assessment results and will provide personalized support based on your current wellness level.
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
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
        </Paper>
      </Container>
    )
  }

  const progress = ((currentStep + 1) / questions.length) * 100

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Mental Wellness Assessment
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            PHQ-9 Depression Screening Tool
          </Typography>
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Question {currentStep + 1} of {questions.length}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {questions[currentStep].text}
          </Typography>
          
          <RadioGroup
            value={selectedAnswer}
            onChange={handleAnswerChange}
            sx={{ mt: 3 }}
          >
            {questions[currentStep].options.map((option) => (
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
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={handleNext}
              disabled={selectedAnswer === ''}
            >
              {currentStep === questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          This assessment is confidential and will help personalize your AI counselor experience. 
          Results are not shared with anyone and are used solely to provide you with better support.
        </Typography>
      </Alert>
    </Container>
  )
}