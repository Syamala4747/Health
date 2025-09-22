import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Alert,
  Paper,
  useTheme,
  alpha
} from '@mui/material'
import { Psychology, TrendingUp, Warning } from '@mui/icons-material'

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself"
]

const RESPONSE_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" }
]

export default function PHQ9Assessment({ onComplete, onBack }) {
  const theme = useTheme()
  const [responses, setResponses] = useState(Array(9).fill(null))
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const handleResponseChange = (questionIndex, value) => {
    const newResponses = [...responses]
    newResponses[questionIndex] = parseInt(value)
    setResponses(newResponses)
  }

  const handleNext = () => {
    if (currentQuestion < PHQ9_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateScore = () => {
    return responses.reduce((sum, response) => sum + (response || 0), 0)
  }

  const getSeverityLevel = (score) => {
    if (score >= 20) return { level: 'Severe', color: theme.palette.error.main, description: 'Severe depression' }
    if (score >= 15) return { level: 'Moderately Severe', color: theme.palette.error.main, description: 'Moderately severe depression' }
    if (score >= 10) return { level: 'Moderate', color: theme.palette.warning.main, description: 'Moderate depression' }
    if (score >= 5) return { level: 'Mild', color: theme.palette.warning.main, description: 'Mild depression' }
    return { level: 'Minimal', color: theme.palette.success.main, description: 'Minimal depression' }
  }

  const handleComplete = () => {
    const score = calculateScore()
    const severity = getSeverityLevel(score)
    
    const results = {
      type: 'PHQ9',
      score,
      severity: severity.level.toLowerCase().replace(' ', '_'),
      responses,
      completedAt: new Date(),
      recommendations: getRecommendations(score)
    }
    
    onComplete(results)
  }

  const getRecommendations = (score) => {
    if (score >= 20) {
      return [
        'Seek immediate professional help',
        'Consider speaking with a counselor or therapist',
        'Contact your healthcare provider',
        'Reach out to crisis support if needed'
      ]
    } else if (score >= 15) {
      return [
        'Consider professional counseling',
        'Speak with a healthcare provider',
        'Practice stress management techniques',
        'Maintain social connections'
      ]
    } else if (score >= 10) {
      return [
        'Consider counseling or therapy',
        'Practice self-care activities',
        'Maintain regular exercise',
        'Connect with supportive friends and family'
      ]
    } else if (score >= 5) {
      return [
        'Monitor your mood regularly',
        'Practice stress reduction techniques',
        'Maintain healthy lifestyle habits',
        'Stay connected with others'
      ]
    } else {
      return [
        'Continue healthy lifestyle practices',
        'Stay aware of your mental health',
        'Maintain social connections',
        'Practice preventive self-care'
      ]
    }
  }

  const progress = ((currentQuestion + 1) / PHQ9_QUESTIONS.length) * 100
  const isComplete = responses.every(response => response !== null)

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Psychology sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            PHQ-9 Depression Assessment
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Over the last 2 weeks, how often have you been bothered by any of the following problems?
        </Typography>
      </Paper>

      {/* Progress */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Question {currentQuestion + 1} of {PHQ9_QUESTIONS.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}% Complete
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
            }
          }}
        />
      </Box>

      {/* Current Question */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            {PHQ9_QUESTIONS[currentQuestion]}
          </Typography>
          
          <RadioGroup
            value={responses[currentQuestion] || ''}
            onChange={(e) => handleResponseChange(currentQuestion, e.target.value)}
          >
            {RESPONSE_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
                sx={{
                  mb: 1,
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              />
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="outlined"
          onClick={currentQuestion === 0 ? onBack : handlePrevious}
          sx={{ borderRadius: 2 }}
        >
          {currentQuestion === 0 ? 'Back to Menu' : 'Previous'}
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {currentQuestion < PHQ9_QUESTIONS.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={responses[currentQuestion] === null}
              sx={{ borderRadius: 2 }}
            >
              Next Question
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleComplete}
              disabled={!isComplete}
              sx={{ 
                borderRadius: 2,
                bgcolor: theme.palette.success.main,
                '&:hover': { bgcolor: theme.palette.success.dark }
              }}
            >
              Complete Assessment
            </Button>
          )}
        </Box>
      </Box>

      {/* Preview Results */}
      {isComplete && (
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">
              Assessment complete! Your PHQ-9 score: <strong>{calculateScore()}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: getSeverityLevel(calculateScore()).color, fontWeight: 600 }}>
              {getSeverityLevel(calculateScore()).level}
            </Typography>
          </Box>
        </Alert>
      )}
    </Box>
  )
}