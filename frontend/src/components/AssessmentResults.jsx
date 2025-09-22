import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  Paper,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Divider
} from '@mui/material'
import {
  Psychology,
  TrendingUp,
  Warning,
  CheckCircle,
  Info,
  LocalHospital,
  Phone,
  Chat,
  MenuBook
} from '@mui/icons-material'

export default function AssessmentResults({ results, onRetakeAssessment, onViewHistory, onBookCounselor, onAICounselor }) {
  const theme = useTheme()
  const [showCrisisResources, setShowCrisisResources] = useState(false)

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'severe': return theme.palette.error.main
      case 'moderately_severe': return theme.palette.error.main
      case 'moderate': return theme.palette.warning.main
      case 'mild': return theme.palette.warning.main
      case 'minimal': return theme.palette.success.main
      default: return theme.palette.grey[500]
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'severe':
      case 'moderately_severe':
        return <Warning />
      case 'moderate':
      case 'mild':
        return <Info />
      case 'minimal':
        return <CheckCircle />
      default:
        return <Info />
    }
  }

  const getRiskLevel = () => {
    if (!results) return 'low'
    
    const phq9Score = results.phq9?.score || 0
    const gad7Score = results.gad7?.score || 0
    
    // Check for crisis indicators (question 9 of PHQ-9 about self-harm thoughts)
    if (results.phq9?.responses?.[8] > 0) return 'crisis'
    
    if (phq9Score >= 20 || gad7Score >= 15) return 'high'
    if (phq9Score >= 15 || gad7Score >= 10) return 'moderate'
    if (phq9Score >= 10 || gad7Score >= 5) return 'mild'
    return 'low'
  }

  const riskLevel = getRiskLevel()

  const crisisResources = [
    {
      name: "National Suicide Prevention Lifeline",
      phone: "988",
      description: "24/7 crisis support"
    },
    {
      name: "Crisis Text Line",
      phone: "Text HOME to 741741",
      description: "24/7 text-based crisis support"
    },
    {
      name: "Emergency Services",
      phone: "911",
      description: "For immediate emergency assistance"
    }
  ]

  if (!results) {
    return (
      <Alert severity="error">
        No assessment results available. Please complete an assessment first.
      </Alert>
    )
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Crisis Alert */}
      {riskLevel === 'crisis' && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => setShowCrisisResources(!showCrisisResources)}
            >
              {showCrisisResources ? 'Hide' : 'Show'} Resources
            </Button>
          }
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Immediate Support Needed
          </Typography>
          <Typography variant="body2">
            Your responses indicate you may be experiencing thoughts of self-harm. Please reach out for immediate support.
          </Typography>
        </Alert>
      )}

      {/* Crisis Resources */}
      {showCrisisResources && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.05) }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.error.main }}>
            Crisis Support Resources
          </Typography>
          <Grid container spacing={2}>
            {crisisResources.map((resource, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%', borderLeft: `4px solid ${theme.palette.error.main}` }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {resource.name}
                    </Typography>
                    <Typography variant="h6" sx={{ color: theme.palette.error.main, mb: 1 }}>
                      {resource.phone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {resource.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Results Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Psychology sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Your Mental Health Assessment Results
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Completed on {new Date(results.completedAt).toLocaleDateString()}
        </Typography>
      </Paper>

      {/* Assessment Scores */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {results.phq9 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {getSeverityIcon(results.phq9.severity)}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    PHQ-9 Depression Scale
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: getSeverityColor(results.phq9.severity) }}>
                    {results.phq9.score}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Score out of 27
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(results.phq9.score / 27) * 100}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: alpha(getSeverityColor(results.phq9.severity), 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: getSeverityColor(results.phq9.severity)
                        }
                      }}
                    />
                  </Box>
                </Box>
                
                <Chip 
                  label={results.phq9.severity.replace('_', ' ').toUpperCase()}
                  sx={{
                    bgcolor: alpha(getSeverityColor(results.phq9.severity), 0.1),
                    color: getSeverityColor(results.phq9.severity),
                    fontWeight: 600
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {results.gad7 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {getSeverityIcon(results.gad7.severity)}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    GAD-7 Anxiety Scale
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: getSeverityColor(results.gad7.severity) }}>
                    {results.gad7.score}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Score out of 21
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(results.gad7.score / 21) * 100}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: alpha(getSeverityColor(results.gad7.severity), 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: getSeverityColor(results.gad7.severity)
                        }
                      }}
                    />
                  </Box>
                </Box>
                
                <Chip 
                  label={results.gad7.severity.toUpperCase()}
                  sx={{
                    bgcolor: alpha(getSeverityColor(results.gad7.severity), 0.1),
                    color: getSeverityColor(results.gad7.severity),
                    fontWeight: 600
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Recommendations */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Personalized Recommendations
          </Typography>
          
          <Grid container spacing={2}>
            {(results.phq9?.recommendations || results.gad7?.recommendations || []).map((recommendation, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}>
                  <Typography variant="body2">
                    • {recommendation}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Chat />}
            onClick={onAICounselor}
            sx={{ 
              py: 2, 
              borderRadius: 2,
              bgcolor: theme.palette.info.main,
              '&:hover': { bgcolor: theme.palette.info.dark }
            }}
          >
            AI Counselor
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Psychology />}
            onClick={onBookCounselor}
            sx={{ 
              py: 2, 
              borderRadius: 2,
              bgcolor: theme.palette.secondary.main,
              '&:hover': { bgcolor: theme.palette.secondary.dark }
            }}
          >
            Book Counselor
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<TrendingUp />}
            onClick={onViewHistory}
            sx={{ py: 2, borderRadius: 2 }}
          >
            View History
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Psychology />}
            onClick={onRetakeAssessment}
            sx={{ py: 2, borderRadius: 2 }}
          >
            Retake Assessment
          </Button>
        </Grid>
      </Grid>

      {/* Understanding Your Scores */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Understanding Your Scores
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                PHQ-9 Depression Scale
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • 0-4: Minimal depression
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • 5-9: Mild depression
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • 10-14: Moderate depression
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • 15-19: Moderately severe depression
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 20-27: Severe depression
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                GAD-7 Anxiety Scale
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • 0-4: Minimal anxiety
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • 5-9: Mild anxiety
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • 10-14: Moderate anxiety
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 15-21: Severe anxiety
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Important:</strong> These assessments are screening tools and not diagnostic instruments. 
              If you're experiencing significant distress, please consult with a mental health professional 
              for a comprehensive evaluation.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  )
}