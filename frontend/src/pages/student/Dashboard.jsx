import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  LinearProgress,
  Chip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Psychology,
  VideoCall,
  MenuBook,
  TrendingUp,
  Schedule,
  School,
  Person,
  Mood,
  Assignment,
  Warning,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAssignedCounsellor } from '../../hooks/useAssignedCounsellor.js'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import CounsellorsList from '../../components/CounsellorsList.jsx'
import AIChatbot from '../../components/AIChatbot.jsx'
import AssessmentForm from '../../components/AssessmentForm.jsx'
import LanguageSelector from '../../components/LanguageSelector.jsx'

const FeatureCard = ({ title, description, icon, color, action, onClick }) => (
  <Card className="dashboard-card" sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: color, mr: 2 }}>
          {icon}
        </Avatar>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
    </CardContent>
    <CardActions>
      <Button size="small" variant="contained" sx={{ bgcolor: color }} onClick={onClick}>
        {action}
      </Button>
    </CardActions>
  </Card>
)

export default function StudentDashboard() {
  const { user } = useAuth()
  const { counsellor, loading: counsellorLoading, error: counsellorError } = useAssignedCounsellor()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [showCounsellorsList, setShowCounsellorsList] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showAssessmentForm, setShowAssessmentForm] = useState(false)
  const [latestAssessmentResults, setLatestAssessmentResults] = useState(null)
  const [assessmentData, setAssessmentData] = useState(null)
  const [loadingAssessment, setLoadingAssessment] = useState(true)

  // Load user's latest assessment data
  useEffect(() => {
    const loadAssessmentData = async () => {
      if (!user) return
      
      try {
        setLoadingAssessment(true)
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          if (userData.lastAssessment) {
            setAssessmentData(userData.lastAssessment)
          }
        }
      } catch (error) {
        console.error('Error loading assessment data:', error)
      } finally {
        setLoadingAssessment(false)
      }
    }

    loadAssessmentData()
  }, [user])

  // Clear assessment data (for debugging/testing)
  const clearAssessmentData = async () => {
    if (!user) return
    
    try {
      setLoadingAssessment(true)
      // Clear from user document
      await updateDoc(doc(db, 'users', user.uid), {
        lastAssessment: null
      })
      // Clear from state
      setAssessmentData(null)
      setLatestAssessmentResults(null)
      console.log('Assessment data cleared successfully')
    } catch (error) {
      console.error('Error clearing assessment data:', error)
    } finally {
      setLoadingAssessment(false)
    }
  }

  // Calculate wellness score
  const getWellnessScore = () => {
    if (assessmentData && assessmentData.percentage !== undefined) {
      return assessmentData.percentage
    }
    return null // No assessment taken
  }

  const getWellnessMessage = () => {
    const score = getWellnessScore()
    if (score === null) {
      return "Take an assessment to analyze your mental health"
    }
    
    if (assessmentData?.severity === 'minimal') {
      return "Excellent mental wellness! Keep up the great work."
    } else if (assessmentData?.severity === 'mild') {
      return "Good mental wellness with some areas to focus on."
    } else if (assessmentData?.severity === 'moderate') {
      return "Moderate wellness - consider reaching out for support."
    } else if (assessmentData?.severity === 'moderately_severe') {
      return "Significant concerns detected - professional support recommended."
    } else if (assessmentData?.severity === 'severe') {
      return "Serious concerns - please seek immediate professional help."
    }
    
    return "Based on your recent assessments and activity"
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

  // Handle assessment completion
  const handleAssessmentComplete = (results) => {
    console.log('📊 Assessment completed, updating dashboard:', results);
    setLatestAssessmentResults(results)
    setAssessmentData({
      percentage: results.wellnessScore || results.percentage,
      severity: results.phq9Severity,
      moodPercentages: results.moodPercentages,
      completedAt: new Date().toISOString(),
      phq9Score: results.phq9Score,
      gad7Score: results.gad7Score,
      lastAssessmentDate: new Date().toLocaleDateString()
    })
    setShowAssessmentForm(false)
    // Force reload of assessment data
    setLoadingAssessment(false)
  }

  // Handle starting AI chat from assessment
  const handleStartAIFromAssessment = (results) => {
    setLatestAssessmentResults(results)
    setShowAssessmentForm(false)
    setShowAIChat(true)
  }

  const features = [
    {
      title: t('testEmotion'),
      description: t('testEmotionDesc'),
      icon: <Mood />,
      color: '#8b5cf6',
      action: t('takeAssessment'),
      onClick: () => setShowAssessmentForm(true)
    },
    {
      title: t('aiCounsellor'),
      description: t('aiCounsellorDesc'),
      icon: <Psychology />,
      color: '#06b6d4',
      action: t('startChat'),
      onClick: () => setShowAIChat(true)
    },
    {
      title: t('humanCounsellor'),
      description: t('humanCounsellorDesc'),
      icon: <VideoCall />,
      color: '#10b981',
      action: t('bookSession'),
      onClick: () => setShowCounsellorsList(true)
    },
    {
      title: t('resourceHub'),
      description: t('resourceHubDesc'),
      icon: <MenuBook />,
      color: '#f59e0b',
      action: t('exploreResources'),
      onClick: () => navigate('/student/resources')
    },
  ]

  const wellnessScore = getWellnessScore()

  return (
    <Box>
      {/* Language Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <LanguageSelector />
      </Box>
      
      <Typography variant="h4" gutterBottom>
        {t('welcomeMessage')}
      </Typography>
      
      {/* Wellness Score */}
      <Paper sx={{ p: 3, mb: 4 }}>
        {loadingAssessment ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Loading your wellness data...</Typography>
          </Box>
        ) : wellnessScore === null ? (
          // No assessment taken
          <Alert 
            severity="info" 
            action={
              <Button 
                color="inherit" 
                size="small" 
                startIcon={<Assignment />}
                onClick={() => setShowAssessmentForm(true)}
              >
                Take Assessment
              </Button>
            }
          >
            <Typography variant="h6" gutterBottom>
              Ready to analyze your mental health?
            </Typography>
            <Typography variant="body2">
              Take our quick PHQ-9 assessment to get personalized AI support and track your wellness journey.
            </Typography>
          </Alert>
        ) : (
          // Assessment completed
          <Grid container alignItems="center" spacing={3}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">
                  Your Wellness Score
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="error"
                  onClick={clearAssessmentData}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Clear Data
                </Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={wellnessScore} 
                  sx={{ 
                    flexGrow: 1, 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: wellnessScore >= 80 ? 'success.main' : 
                              wellnessScore >= 60 ? 'info.main' :
                              wellnessScore >= 40 ? 'warning.main' : 'error.main'
                    }
                  }}
                />
                <Typography variant="h6" color="primary">
                  {wellnessScore}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {getWellnessMessage()}
                </Typography>
                {assessmentData?.severity && (
                  <Chip 
                    size="small"
                    label={assessmentData.severity.replace('_', ' ').toUpperCase()}
                    color={getSeverityColor(assessmentData.severity)}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Last updated: {assessmentData?.completedAt ? new Date(assessmentData.completedAt).toLocaleDateString() : 'Unknown'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Avatar sx={{ 
                bgcolor: wellnessScore >= 70 ? 'success.main' : 
                        wellnessScore >= 50 ? 'warning.main' : 'error.main', 
                width: 60, 
                height: 60, 
                mx: 'auto', 
                mb: 1 
              }}>
                {wellnessScore >= 70 ? <TrendingUp sx={{ fontSize: 30 }} /> : 
                 wellnessScore >= 50 ? <Warning sx={{ fontSize: 30 }} /> : 
                 <Assignment sx={{ fontSize: 30 }} />}
              </Avatar>
              <Typography variant="body2" color={
                wellnessScore >= 70 ? 'success.main' : 
                wellnessScore >= 50 ? 'warning.main' : 'error.main'
              }>
                {wellnessScore >= 70 ? 'Doing Great!' : 
                 wellnessScore >= 50 ? 'Need Support' : 'Seek Help'}
              </Typography>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Feature Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <FeatureCard {...feature} />
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Assigned Counsellor
            </Typography>
            
            {counsellorLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
              </Box>
            ) : counsellorError ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {counsellorError}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Counsellors from your college will appear here once they register.
                </Typography>
              </Box>
            ) : counsellor ? (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {counsellor.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {counsellor.specialization}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {counsellor.college}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${counsellor.experience} experience`} 
                    size="small" 
                    variant="outlined" 
                  />
                  {counsellor.languages?.slice(0, 2).map((lang, index) => (
                    <Chip 
                      key={index} 
                      label={lang} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No counsellors available from your college yet.
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<VideoCall />}
                onClick={() => setShowCounsellorsList(true)}
              >
                Browse Counsellors
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                disabled={!counsellor}
                onClick={() => setShowCounsellorsList(true)}
              >
                Send Message
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('quickTips')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              "Take a few minutes each day for mindfulness. Even 5 minutes of deep breathing can help reduce stress and improve focus."
            </Typography>
            <Button variant="outlined" size="small">
              More Tips
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Counsellors List Modal */}
      <CounsellorsList 
        open={showCounsellorsList} 
        onClose={() => setShowCounsellorsList(false)} 
      />

      {/* Assessment Form Modal */}
      <AssessmentForm 
        open={showAssessmentForm} 
        onClose={() => setShowAssessmentForm(false)}
        onComplete={handleAssessmentComplete}
        onStartAIChat={handleStartAIFromAssessment}
      />

      {/* AI Chatbot Modal */}
      <AIChatbot 
        open={showAIChat} 
        onClose={() => setShowAIChat(false)}
      />
    </Box>
  )
}