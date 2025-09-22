import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  useTheme,
  Container
} from '@mui/material'
import {
  Psychology,
  Assessment,
  TrendingUp,
  History
} from '@mui/icons-material'
import PHQ9Assessment from '../../components/PHQ9Assessment.jsx'
import GAD7Assessment from '../../components/GAD7Assessment.jsx'
import AssessmentResults from '../../components/AssessmentResults.jsx'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function ComprehensiveAssessment() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState('menu') // menu, phq9, gad7, results
  const [assessmentResults, setAssessmentResults] = useState({})

  const handleStartPHQ9 = () => {
    setCurrentStep('phq9')
  }

  const handleStartGAD7 = () => {
    setCurrentStep('gad7')
  }

  const handleStartBoth = () => {
    setCurrentStep('phq9')
  }

  const handlePHQ9Complete = async (results) => {
    const newResults = { ...assessmentResults, phq9: results }
    setAssessmentResults(newResults)
    
    // Save to database
    await saveAssessment(results)
    
    // If we're doing both assessments, move to GAD7
    if (currentStep === 'phq9' && !assessmentResults.gad7) {
      setCurrentStep('gad7')
    } else {
      // Show results
      setCurrentStep('results')
    }
  }

  const handleGAD7Complete = async (results) => {
    const newResults = { ...assessmentResults, gad7: results }
    setAssessmentResults(newResults)
    
    // Save to database
    await saveAssessment(results)
    
    // Show results
    setCurrentStep('results')
  }

  const saveAssessment = async (results) => {
    try {
      await addDoc(collection(db, 'assessments'), {
        userId: user.uid,
        type: results.type,
        score: results.score,
        severity: results.severity,
        responses: results.responses,
        recommendations: results.recommendations,
        createdAt: serverTimestamp(),
        completedAt: results.completedAt
      })
    } catch (error) {
      console.error('Error saving assessment:', error)
      toast.error('Failed to save assessment results')
    }
  }

  const handleBackToMenu = () => {
    setCurrentStep('menu')
  }

  const handleRetakeAssessment = () => {
    setAssessmentResults({})
    setCurrentStep('menu')
  }

  const handleViewHistory = () => {
    navigate('/student/assessment-history')
  }

  const handleBookCounselor = () => {
    navigate('/student/counselor-booking')
  }

  const handleAICounselor = () => {
    navigate('/student/ai-counselor', { state: { assessmentResults } })
  }

  if (currentStep === 'phq9') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PHQ9Assessment 
          onComplete={handlePHQ9Complete}
          onBack={handleBackToMenu}
        />
      </Container>
    )
  }

  if (currentStep === 'gad7') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <GAD7Assessment 
          onComplete={handleGAD7Complete}
          onBack={assessmentResults.phq9 ? () => setCurrentStep('phq9') : handleBackToMenu}
        />
      </Container>
    )
  }

  if (currentStep === 'results') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AssessmentResults
          results={{
            ...assessmentResults,
            completedAt: new Date()
          }}
          onRetakeAssessment={handleRetakeAssessment}
          onViewHistory={handleViewHistory}
          onBookCounselor={handleBookCounselor}
          onAICounselor={handleAICounselor}
        />
      </Container>
    )
  }

  // Assessment Menu
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Assessment sx={{ fontSize: 40 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Mental Health Assessment
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Take standardized assessments to understand your mental health status
        </Typography>
      </Paper>

      {/* Assessment Options */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: theme.shadows[12]
              }
            }}
            onClick={handleStartPHQ9}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}>
                <Psychology sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                PHQ-9 Depression
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                9-question assessment to screen for depression symptoms over the past 2 weeks
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                ~5 minutes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: theme.shadows[12]
              }
            }}
            onClick={handleStartGAD7}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: theme.palette.info.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}>
                <Psychology sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                GAD-7 Anxiety
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                7-question assessment to screen for anxiety symptoms over the past 2 weeks
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                ~3 minutes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: `2px solid ${theme.palette.success.main}`,
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: theme.shadows[12]
              }
            }}
            onClick={handleStartBoth}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: theme.palette.success.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}>
                <Assessment sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Complete Assessment
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Take both PHQ-9 and GAD-7 assessments for a comprehensive mental health screening
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                ~8 minutes • Recommended
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<History />}
            onClick={handleViewHistory}
            sx={{ py: 2, borderRadius: 2 }}
          >
            View Assessment History
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<TrendingUp />}
            onClick={() => navigate('/student/progress')}
            sx={{ py: 2, borderRadius: 2 }}
          >
            Track Your Progress
          </Button>
        </Grid>
      </Grid>

      {/* Information Card */}
      <Paper sx={{ p: 3, mt: 4, borderRadius: 3, bgcolor: theme.palette.grey[50] }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          About These Assessments
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>PHQ-9 (Patient Health Questionnaire-9)</strong> is a widely used screening tool 
              for depression. It asks about symptoms you may have experienced over the past 2 weeks.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>GAD-7 (Generalized Anxiety Disorder-7)</strong> is a validated screening tool 
              for anxiety disorders, focusing on symptoms over the past 2 weeks.
            </Typography>
          </Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary">
          <strong>Important:</strong> These assessments are screening tools, not diagnostic instruments. 
          Results should be discussed with a qualified mental health professional for proper evaluation and treatment planning.
        </Typography>
      </Paper>
    </Container>
  )
}