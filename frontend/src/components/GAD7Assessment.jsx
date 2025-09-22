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

const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen"
]

const RESPONSE_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" }
]

export default function GAD7Assessment({ onComplete, onBack }) {
  const theme = useTheme()
  const [responses, setResponses] = useState(Array(7).fill(null))
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const handleResponseChange = (questionIndex, value) => {
    const newResponses = [...responses]
    newResponses[questionIndex] = parseInt(value)
    setResponses(newResponses)
  }

  const handleNext = () => {
    if (currentQuestion < GAD7_QUESTIONS.length - 1) {
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
    if (score >= 15) return { level: 'Severe', color: theme.palette.error.main, description: 'Severe anxiety' }
    if (score >= 10) return { level: 'Moderate', color: theme.palette.warning.main, description: 'Moderate anxiety' }
    if (score >= 5) return { level: 'Mild', color: theme.palette.warning.main, description: 'Mild anxiety' }
    return { level: 'Minimal', color: theme.palette.success.main, description: 'Minimal anxiety' }
  }

  const handleComplete = () => {
    const score = calculateScore()
    const severity = getSeverityLevel(score)
    
    const results = {
      type: 'GAD7',
      score,
      severity: severity.level.toLowerCase(),
      responses,
      completedAt: new Date(),
      recommendations: getRecommendations(score)
    }
    
    onComplete(results)
  }

  const getRecommendations = (score) => {
    if (score >= 15) {
      return [
        'Seek immediate professional help for anxiety',
        'Consider speaking with a counselor or therapist',
        'Practice deep breathing and relaxation techniques',
        'Contact your healthcare provider'
      ]
    } else if (score >= 10) {
      return [
        'Consider professional counseling for anxiety',
        'Practice mindfulness and meditation',
        'Try regular exercise and physical activity',
        'Learn stress management techniques'
      ]
    } else if (score >= 5) {
      return [
        'Practice relaxation techniques regularly',
        'Maintain a healthy sleep schedule',
        'Consider mindfulness or meditation',
        'Stay physically active'
      ]
    } else {
      return [
        'Continue healthy stress management practices',
        'Maintain regular exercise routine',
        'Practice good sleep hygiene',
        'Stay connected with supportive people'
      ]
    }
  }

  const progress = ((currentQuestion + 1) / GAD7_QUESTIONS.length) * 100
  const isComplete = responses.every(response => response !== null)

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Psychology sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            GAD-7 Anxiety Assessment
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
            Question {currentQuestion + 1} of {GAD7_QUESTIONS.length}
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
            bgcolor: alpha(theme.palette.info.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: 'linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)'
            }
          }}
        />
      </Box>

      {/* Current Question */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            {GAD7_QUESTIONS[currentQuestion]}
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
                    bgcolor: alpha(theme.palette.info.main, 0.05)
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
          {currentQuestion < GAD7_QUESTIONS.length - 1 ? (
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
              Assessment complete! Your GAD-7 score: <strong>{calculateScore()}</strong>
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