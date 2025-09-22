import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Fade,
  Slide,
  useTheme,
  alpha
} from '@mui/material'
import {
  Psychology,
  Assignment,
  TrendingUp,
  CheckCircle,
  ArrowForward,
  ArrowBack,
  Mood,
  Chat,
  Lightbulb
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export default function InPageAssessment({ onComplete, onStartAIChat }) {
  const { user } = useAuth()
  const theme = useTheme()
  const [currentSection, setCurrentSection] = useState('start') // 'start', 'phq9', 'gad7', 'results'
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [phq9Answers, setPhq9Answers] = useState([])
  const [gad7Answers, setGad7Answers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [moodResults, setMoodResults] = useState(null)
  const [loading, setLoading] = useState(false)

  // PHQ-9 Questions (Depression)
  const phq9Questions = [
    "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
    "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?", 
    "Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?",
    "Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?",
    "Over the last 2 weeks, how often have you been bothered by poor appetite or overeating?",
    "Over the last 2 weeks, how often have you been bothered by feeling bad about yourself - or that you are a failure or have let yourself or your family down?",
    "Over the last 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading or watching television?",
    "Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that you have been moving around a lot more than usual?",
    "Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead, or of hurting yourself?"
  ]

  // GAD-7 Questions (Anxiety)
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
    // Calculate mood percentages based on assessment scores
    const maxPhq9 = 27 // 9 questions × 3 max points
    const maxGad7 = 21 // 7 questions × 3 max points
    
    // Calculate base percentages (inverted so lower scores = better moods)
    const depressionLevel = (phq9Score / maxPhq9) * 100
    const anxietyLevel = (gad7Score / maxGad7) * 100
    
    // Calculate mood percentages
    const happy = Math.max(0, 85 - depressionLevel - anxietyLevel * 0.5)
    const calm = Math.max(0, 80 - anxietyLevel - depressionLevel * 0.3)
    const sad = Math.min(100, depressionLevel * 1.2)
    const stressed = Math.min(100, anxietyLevel * 1.1)
    const anxious = Math.min(100, anxietyLevel)
    const depressed = Math.min(100, depressionLevel)
    
    // Normalize to ensure they add up reasonably
    const total = happy + calm + sad + stressed + anxious + depressed
    const normalize = (value) => Math.round((value / total) * 100)
    
    return {
      happy: Math.round(happy),
      calm: Math.round(calm),
      sad: Math.round(sad),
      stressed: Math.round(stressed),
      anxious: Math.round(anxious),
      depressed: Math.round(depressed),
      dominantMood: getDominantMood(happy, calm, sad, stressed, anxious, depressed)
    }
  }

  const getDominantMood = (happy, calm, sad, stressed, anxious, depressed) => {
    const moods = { happy, calm, sad, stressed, anxious, depressed }
    const dominant = Object.keys(moods).reduce((a, b) => moods[a] > moods[b] ? a : b)
    return { mood: dominant, percentage: moods[dominant] }
  }

  const getOverallWellnessScore = (phq9Score, gad7Score) => {
    const maxTotal = 48 // maxPhq9 + maxGad7
    const totalScore = phq9Score + gad7Score
    return Math.round(((maxTotal - totalScore) / maxTotal) * 100)
  }

  const handleNext = () => {
    if (selectedAnswer === '') return

    if (currentSection === 'phq9') {
      const newAnswers = [...phq9Answers, parseInt(selectedAnswer)]
      setPhq9Answers(newAnswers)
      
      if (currentQuestion < phq9Questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer('')
      } else {
        // PHQ-9 complete, move to GAD-7
        setCurrentSection('gad7')
        setCurrentQuestion(0)
        setSelectedAnswer('')
      }
    } else if (currentSection === 'gad7') {
      const newAnswers = [...gad7Answers, parseInt(selectedAnswer)]
      setGad7Answers(newAnswers)
      
      if (currentQuestion < gad7Questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer('')
      } else {
        // GAD-7 complete, calculate results
        completeAssessment(phq9Answers, newAnswers)
      }
    }
  }

  const handlePrevious = () => {
    if (currentSection === 'phq9' && currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer(phq9Answers[currentQuestion - 1] || '')
      setPhq9Answers(phq9Answers.slice(0, -1))
    } else if (currentSection === 'gad7') {
      if (currentQuestion > 0) {
        setCurrentQuestion(currentQuestion - 1)
        setSelectedAnswer(gad7Answers[currentQuestion - 1] || '')
        setGad7Answers(gad7Answers.slice(0, -1))
      } else {
        // Go back to PHQ-9
        setCurrentSection('phq9')
        setCurrentQuestion(phq9Questions.length - 1)
        setSelectedAnswer(phq9Answers[phq9Questions.length - 1] || '')
      }
    }
  }

  const completeAssessment = async (phq9Final, gad7Final) => {
    setLoading(true)
    
    const phq9Score = phq9Final.reduce((sum, answer) => sum + answer, 0)
    const gad7Score = gad7Final.reduce((sum, answer) => sum + answer, 0)
    
    const moodPercentages = calculateMoodPercentages(phq9Score, gad7Score)
    const wellnessScore = getOverallWellnessScore(phq9Score, gad7Score)
    
    const results = {
      phq9Score,
      gad7Score,
      wellnessScore,
      moodPercentages,
      completedAt: new Date().toISOString(),
      phq9Answers: phq9Final,
      gad7Answers: gad7Final
    }
    
    // Save to database
    if (user) {
      try {
        // Save assessment results
        await setDoc(doc(db, 'assessments', `${user.uid}_${Date.now()}`), {
          userId: user.uid,
          type: 'PHQ-9_GAD-7',
          results,
          createdAt: new Date().toISOString()
        })

        // Update user's latest assessment
        await setDoc(doc(db, 'users', user.uid), {
          lastAssessment: {
            type: 'PHQ-9_GAD-7',
            percentage: wellnessScore,
            moodPercentages,
            completedAt: results.completedAt,
            aiPersonality: getAIPersonality(phq9Score, gad7Score)
          }
        }, { merge: true })
      } catch (error) {
        console.error('Error saving assessment:', error)
      }
    }
    
    setMoodResults(results)
    setCurrentSection('results')
    setLoading(false)

    if (onComplete) {
      onComplete(results)
    }
  }

  const getAIPersonality = (phq9Score, gad7Score) => {
    const totalScore = phq9Score + gad7Score
    if (totalScore <= 8) return 'encouraging'
    if (totalScore <= 16) return 'supportive'
    if (totalScore <= 24) return 'gentle'
    if (totalScore <= 32) return 'caring'
    return 'crisis'
  }

  const startAssessment = () => {
    setCurrentSection('phq9')
    setCurrentQuestion(0)
    setSelectedAnswer('')
  }

  const getTotalProgress = () => {
    const totalQuestions = phq9Questions.length + gad7Questions.length
    let completedQuestions = 0
    
    if (currentSection === 'phq9') {
      completedQuestions = currentQuestion
    } else if (currentSection === 'gad7') {
      completedQuestions = phq9Questions.length + currentQuestion
    } else if (currentSection === 'results') {
      completedQuestions = totalQuestions
    }
    
    return (completedQuestions / totalQuestions) * 100
  }

  const getMoodColor = (moodName) => {
    const colors = {
      happy: '#4caf50',
      calm: '#8bc34a', 
      sad: '#ff9800',
      stressed: '#ff5722',
      anxious: '#f44336',
      depressed: '#d32f2f'
    }
    return colors[moodName] || '#757575'
  }

  const getMoodIcon = (moodName) => {
    const icons = {
      happy: '😊',
      calm: '😌',
      sad: '😔', 
      stressed: '😰',
      anxious: '😟',
      depressed: '😞'
    }
    return icons[moodName] || '😐'
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Analyzing your responses...
        </Typography>
      </Box>
    )
  }

  if (currentSection === 'start') {
    return (
      <Fade in timeout={500}>
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'background.default' }}>
          <Assignment sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Mental Wellness Assessment
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            This comprehensive assessment includes PHQ-9 (depression) and GAD-7 (anxiety) questions. 
            Based on your responses, we'll show you personalized mood percentages and connect you with 
            an AI counselor trained to support your specific needs.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>What you'll get:</strong>
              <br />• Your detailed mood breakdown with percentages
              <br />• Personalized wellness score
              <br />• AI counselor adapted to your mental health profile
              <br />• Professional recommendations if needed
            </Typography>
          </Alert>
          
          <Button
            variant="contained"
            size="large"
            onClick={startAssessment}
            sx={{ px: 4, py: 1.5 }}
          >
            Start Assessment (16 Questions)
          </Button>
        </Paper>
      </Fade>
    )
  }

  if (currentSection === 'results' && moodResults) {
    return (
      <Fade in timeout={500}>
        <Box>
          {/* Overall Results */}
          <Paper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Assessment Complete!
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <CardContent>
                    <Typography variant="h3" color="primary">
                      {moodResults.wellnessScore}%
                    </Typography>
                    <Typography variant="h6">
                      Wellness Score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <CardContent>
                    <Typography variant="h3">
                      {getMoodIcon(moodResults.moodPercentages.dominantMood.mood)}
                    </Typography>
                    <Typography variant="h6">
                      Dominant Mood
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {moodResults.moodPercentages.dominantMood.mood} ({moodResults.moodPercentages.dominantMood.percentage}%)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <CardContent>
                    <TrendingUp sx={{ fontSize: 40, color: 'info.main' }} />
                    <Typography variant="h6">
                      Assessment Type
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      PHQ-9 + GAD-7
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Mood Breakdown */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Mood sx={{ mr: 1, color: 'primary.main' }} />
              Your Mood Breakdown
            </Typography>
            
            <Grid container spacing={2}>
              {Object.entries(moodResults.moodPercentages)
                .filter(([key]) => key !== 'dominantMood')
                .map(([moodName, percentage]) => (
                <Grid item xs={6} sm={4} md={2} key={moodName}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    border: 1, 
                    borderColor: 'divider',
                    borderRadius: 2,
                    backgroundColor: alpha(getMoodColor(moodName), 0.1),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: alpha(getMoodColor(moodName), 0.2),
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                      {getMoodIcon(moodName)}
                    </Typography>
                    <Typography variant="h6" sx={{ color: getMoodColor(moodName), fontWeight: 'bold' }}>
                      {percentage}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {moodName}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={percentage} 
                      sx={{ 
                        mt: 1,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(getMoodColor(moodName), 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getMoodColor(moodName),
                          borderRadius: 3
                        }
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* AI Recommendation */}
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Psychology sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Your AI Counselor is Ready
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Based on your assessment results, our AI counselor has been personalized to provide 
              the most appropriate support for your current mental health profile.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Chat />}
                onClick={() => onStartAIChat && onStartAIChat(moodResults)}
                sx={{ px: 4 }}
              >
                Start AI Counseling Session
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<Lightbulb />}
              >
                View Recommendations
              </Button>
            </Box>
          </Paper>
        </Box>
      </Fade>
    )
  }

  // Question display (PHQ-9 or GAD-7)
  const currentQuestions = currentSection === 'phq9' ? phq9Questions : gad7Questions
  const sectionTitle = currentSection === 'phq9' ? 'Depression Assessment (PHQ-9)' : 'Anxiety Assessment (GAD-7)'
  
  return (
    <Slide in direction="left" timeout={300}>
      <Box>
        {/* Progress Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{sectionTitle}</Typography>
            <Chip 
              label={`Question ${currentQuestion + 1} of ${currentQuestions.length}`}
              color="primary" 
              size="small"
            />
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={getTotalProgress()} 
            sx={{ height: 8, borderRadius: 4, mb: 1 }}
          />
          
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Overall Progress: {Math.round(getTotalProgress())}% Complete
          </Typography>
        </Paper>

        {/* Question */}
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            {currentQuestions[currentQuestion]}
          </Typography>
          
          <RadioGroup
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
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
                  borderColor: selectedAnswer == option.value ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  backgroundColor: selectedAnswer == option.value ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
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
              disabled={currentSection === 'phq9' && currentQuestion === 0}
            >
              Previous
            </Button>
            
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={handleNext}
              disabled={selectedAnswer === ''}
            >
              {currentSection === 'gad7' && currentQuestion === gad7Questions.length - 1 
                ? 'Complete Assessment' 
                : 'Next Question'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Slide>
  )
}