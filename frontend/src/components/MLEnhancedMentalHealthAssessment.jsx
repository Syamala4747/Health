import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel
} from '@mui/material'
import {
  Close,
  Psychology,
  AutoAwesome,
  HealthAndSafety,
  CheckCircle,
  Warning,
  LocalHospital,
  Schedule,
  TrendingUp,
  Lightbulb,
  ExpandMore,
  Science,
  Psychology as PsychIcon
} from '@mui/icons-material'

const MLEnhancedMentalHealthAssessment = ({ open, onClose, onAssessmentComplete }) => {
  const [currentStep, setCurrentStep] = useState('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [mlAnalysis, setMlAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)
  const [sessionId, setSessionId] = useState(null)

  // Initialize session
  useEffect(() => {
    if (open && !sessionId) {
      setSessionId(`ml_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [open])

  // PHQ-9 Questions for Depression
  const phq9Questions = [
    {
      id: 'phq1',
      text: "Little interest or pleasure in doing things",
      category: 'PHQ-9',
      domain: 'anhedonia'
    },
    {
      id: 'phq2', 
      text: "Feeling down, depressed, or hopeless",
      category: 'PHQ-9',
      domain: 'mood'
    },
    {
      id: 'phq3',
      text: "Trouble falling or staying asleep, or sleeping too much",
      category: 'PHQ-9',
      domain: 'sleep'
    },
    {
      id: 'phq4',
      text: "Feeling tired or having little energy",
      category: 'PHQ-9',
      domain: 'energy'
    },
    {
      id: 'phq5',
      text: "Poor appetite or overeating",
      category: 'PHQ-9',
      domain: 'appetite'
    },
    {
      id: 'phq6',
      text: "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
      category: 'PHQ-9',
      domain: 'self_worth'
    },
    {
      id: 'phq7',
      text: "Trouble concentrating on things, such as reading the newspaper or watching television",
      category: 'PHQ-9',
      domain: 'concentration'
    },
    {
      id: 'phq8',
      text: "Moving or speaking so slowly that other people could have noticed, or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
      category: 'PHQ-9',
      domain: 'psychomotor'
    },
    {
      id: 'phq9',
      text: "Thoughts that you would be better off dead, or of hurting yourself",
      category: 'PHQ-9',
      domain: 'suicidal_ideation'
    }
  ]

  // GAD-7 Questions for Anxiety
  const gad7Questions = [
    {
      id: 'gad1',
      text: "Feeling nervous, anxious, or on edge",
      category: 'GAD-7',
      domain: 'nervousness'
    },
    {
      id: 'gad2',
      text: "Not being able to stop or control worrying",
      category: 'GAD-7',
      domain: 'worry_control'
    },
    {
      id: 'gad3',
      text: "Worrying too much about different things",
      category: 'GAD-7',
      domain: 'excessive_worry'
    },
    {
      id: 'gad4',
      text: "Trouble relaxing",
      category: 'GAD-7',
      domain: 'relaxation'
    },
    {
      id: 'gad5',
      text: "Being so restless that it is hard to sit still",
      category: 'GAD-7',
      domain: 'restlessness'
    },
    {
      id: 'gad6',
      text: "Becoming easily annoyed or irritable",
      category: 'GAD-7',
      domain: 'irritability'
    },
    {
      id: 'gad7',
      text: "Feeling afraid, as if something awful might happen",
      category: 'GAD-7',
      domain: 'catastrophic_thinking'
    }
  ]

  const allQuestions = [...phq9Questions, ...gad7Questions]

  const responseOptions = [
    { value: 0, label: 'Not at all', color: '#4CAF50', emoji: '😌' },
    { value: 1, label: 'Several days', color: '#FF9800', emoji: '😐' },
    { value: 2, label: 'More than half the days', color: '#FF5722', emoji: '😟' },
    { value: 3, label: 'Nearly every day', color: '#F44336', emoji: '😰' }
  ]

  const handleOptionSelect = (value) => {
    const questionId = allQuestions[currentQuestionIndex].id
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    
    setTimeout(() => {
      if (currentQuestionIndex < allQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        completeAssessment()
      }
    }, 300)
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else {
      setCurrentStep('intro')
    }
  }

  const completeAssessment = async () => {
    const startTime = Date.now()
    setCurrentStep('analyzing')
    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      // Prepare assessment data for ML analysis
      const assessmentData = {
        answers,
        metadata: {
          sessionId,
          completionTime: startTime - (window.assessmentStartTime || startTime),
          totalQuestions: allQuestions.length,
          version: '2.0_ml_enhanced',
          timestamp: new Date().toISOString(),
          culturalPreferences: {
            language: 'en',
            background: 'western' // This could be user-configurable
          }
        }
      }

      // Call ML analysis service
      const response = await fetch('/api/ml/analyze-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming JWT auth
        },
        body: JSON.stringify(assessmentData)
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }

      setMlAnalysis(result)
      setShowResults(true)
      setCurrentStep('results')
      
      // Pass results to parent component
      if (onAssessmentComplete) {
        onAssessmentComplete({
          ...result,
          sessionId,
          rawAnswers: answers
        })
      }

    } catch (error) {
      console.error('ML Analysis failed:', error)
      setAnalysisError(error.message)
      
      // Fallback to basic analysis
      const basicResults = generateBasicResults()
      setMlAnalysis({ analysis: basicResults, service_info: { ml_service_used: false } })
      setShowResults(true)
      setCurrentStep('results')
      
      if (onAssessmentComplete) {
        onAssessmentComplete({
          analysis: basicResults,
          sessionId,
          rawAnswers: answers,
          service_info: { ml_service_used: false, error: error.message }
        })
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateBasicResults = () => {
    // Basic fallback analysis
    const phq9Score = phq9Questions.reduce((sum, q) => sum + (answers[q.id] || 0), 0)
    const gad7Score = gad7Questions.reduce((sum, q) => sum + (answers[q.id] || 0), 0)
    
    return {
      clinical_scores: {
        phq9_score: phq9Score,
        gad7_score: gad7Score,
        depression_level: phq9Score >= 15 ? 'severe' : phq9Score >= 10 ? 'moderate' : phq9Score >= 5 ? 'mild' : 'minimal',
        anxiety_level: gad7Score >= 15 ? 'severe' : gad7Score >= 10 ? 'moderate' : gad7Score >= 5 ? 'mild' : 'minimal'
      },
      crisis_assessment: {
        risk_level: answers.phq9 >= 2 ? 'high' : 'low',
        immediate_action_required: answers.phq9 >= 2
      },
      personalized_feedback: "Thank you for completing this assessment. Consider speaking with a mental health professional for personalized guidance.",
      intervention_recommendations: [],
      next_steps: [{
        priority: 'medium',
        action: 'Seek professional guidance',
        timeframe: 'Soon'
      }]
    }
  }

  const renderIntroStep = () => (
    <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
      <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
        <Science sx={{ fontSize: 40 }} />
      </Avatar>
      
      <Typography variant="h4" gutterBottom sx={{ 
        background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold'
      }}>
        AI-Enhanced Mental Health Assessment
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', fontSize: '1.1rem', lineHeight: 1.6 }}>
        This advanced assessment uses machine learning to provide personalized insights and recommendations. 
        Your responses will be analyzed by our AI system to offer tailored guidance for your mental health journey.
      </Typography>

      <Card sx={{ mb: 3, backgroundColor: 'rgba(25, 118, 210, 0.04)' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome color="primary" />
            What Makes This Assessment Special
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon><PsychIcon color="primary" /></ListItemIcon>
              <ListItemText primary="AI-powered analysis beyond standard scoring" />
            </ListItem>
            <ListItem>
              <ListItemIcon><TrendingUp color="primary" /></ListItemIcon>
              <ListItemText primary="Personalized intervention recommendations" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Lightbulb color="primary" /></ListItemIcon>
              <ListItemText primary="Inconsistency detection for more reliable results" />
            </ListItem>
            <ListItem>
              <ListItemIcon><LocalHospital color="primary" /></ListItemIcon>
              <ListItemText primary="Advanced crisis risk assessment" />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
        <Typography variant="body2">
          <strong>Privacy & Confidentiality:</strong> Your responses are processed securely and used only to provide 
          personalized mental health insights. No personal information is shared with third parties.
        </Typography>
      </Alert>

      <Button 
        variant="contained" 
        size="large" 
        onClick={() => {
          setCurrentStep('assessment')
          window.assessmentStartTime = Date.now()
        }}
        sx={{ 
          px: 4, 
          py: 1.5,
          background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1565c0, #1976d2)',
          }
        }}
      >
        Begin AI-Enhanced Assessment
      </Button>
    </Box>
  )

  const renderAnalyzingStep = () => (
    <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
      <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
        <Science sx={{ fontSize: 40 }} />
      </Avatar>
      
      <Typography variant="h4" gutterBottom>
        Analyzing Your Responses
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        Our AI system is processing your responses to provide personalized insights and recommendations.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <CircularProgress size={60} thickness={4} />
      </Box>

      <Stepper activeStep={1} alternativeLabel sx={{ mb: 4 }}>
        <Step completed>
          <StepLabel>Assessment Complete</StepLabel>
        </Step>
        <Step active>
          <StepLabel>AI Analysis</StepLabel>
        </Step>
        <Step>
          <StepLabel>Results & Recommendations</StepLabel>
        </Step>
      </Stepper>

      {analysisError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Advanced AI analysis is temporarily unavailable. 
            We're providing basic analysis with standard clinical scoring.
          </Typography>
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary">
        This may take a few moments as we analyze multiple factors including response patterns, 
        risk indicators, and personalized recommendations...
      </Typography>
    </Box>
  )

  const renderResultsStep = () => {
    if (!mlAnalysis) return null

    const analysis = mlAnalysis.analysis
    const serviceInfo = mlAnalysis.service_info
    
    return (
      <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar sx={{ bgcolor: 'success.main', width: 80, height: 80, mx: 'auto', mb: 2 }}>
            <CheckCircle sx={{ fontSize: 40 }} />
          </Avatar>
          
          <Typography variant="h4" gutterBottom>
            Your Mental Health Analysis
          </Typography>
          
          <Chip 
            label={serviceInfo?.ml_service_used ? "AI-Enhanced Results" : "Standard Analysis"}
            color={serviceInfo?.ml_service_used ? "primary" : "default"}
            icon={serviceInfo?.ml_service_used ? <AutoAwesome /> : <Psychology />}
            sx={{ mb: 2 }}
          />
        </Box>

        {/* Crisis Alert */}
        {analysis.crisis_assessment?.immediate_action_required && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Immediate Support Recommended
            </Typography>
            <Typography variant="body2">
              Your responses indicate you may benefit from immediate professional support. 
              Please consider contacting a crisis helpline or emergency services.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" color="error" size="small" sx={{ mr: 1 }}>
                Crisis Hotline: 988
              </Button>
              <Button variant="outlined" color="error" size="small">
                Emergency: 911
              </Button>
            </Box>
          </Alert>
        )}

        {/* Clinical Scores */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="primary" />
              Clinical Assessment Scores
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">Depression (PHQ-9)</Typography>
                <Typography variant="h4" color="primary">
                  {analysis.clinical_scores?.phq9_score || 0}/27
                </Typography>
                <Chip 
                  label={analysis.clinical_scores?.depression_level || 'minimal'} 
                  size="small"
                  color={getScoreColor(analysis.clinical_scores?.depression_level)}
                />
              </Box>
              
              <Divider orientation="vertical" flexItem />
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">Anxiety (GAD-7)</Typography>
                <Typography variant="h4" color="primary">
                  {analysis.clinical_scores?.gad7_score || 0}/21
                </Typography>
                <Chip 
                  label={analysis.clinical_scores?.anxiety_level || 'minimal'} 
                  size="small"
                  color={getScoreColor(analysis.clinical_scores?.anxiety_level)}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {serviceInfo?.ml_service_used && analysis.ml_interpretation && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome color="primary" />
                AI-Generated Insights
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Advanced machine learning analysis of your response patterns:
              </Typography>
              
              {analysis.ml_interpretation.overall_ml && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  AI Confidence: {(analysis.confidence_scores?.overall_confidence * 100 || 70).toFixed(0)}%
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Personalized Feedback */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology color="primary" />
              Personalized Feedback
            </Typography>
            
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {analysis.personalized_feedback}
            </Typography>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {analysis.intervention_recommendations?.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lightbulb color="primary" />
                Recommended Interventions
              </Typography>
              
              {analysis.intervention_recommendations.map((rec, index) => (
                <Accordion key={index} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="subtitle1">{rec.title}</Typography>
                      <Chip 
                        label={rec.evidence_level || 'B'} 
                        size="small" 
                        color="primary"
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {rec.description}
                    </Typography>
                    {rec.duration && (
                      <Chip label={`Duration: ${rec.duration}`} size="small" variant="outlined" />
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        {analysis.next_steps?.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule color="primary" />
                Recommended Next Steps
              </Typography>
              
              <List>
                {analysis.next_steps.map((step, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Chip 
                        label={step.priority} 
                        size="small"
                        color={step.priority === 'immediate' ? 'error' : 
                               step.priority === 'high' ? 'warning' : 'default'}
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={step.action}
                      secondary={`${step.description} • ${step.timeframe}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Inconsistency Analysis */}
        {serviceInfo?.ml_service_used && analysis.inconsistency_analysis && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HealthAndSafety color="primary" />
                Response Reliability
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Reliability Score: {(analysis.inconsistency_analysis.reliability_score * 100 || 80).toFixed(0)}%
              </Typography>
              
              {analysis.inconsistency_analysis.inconsistencies_found > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Some response patterns were flagged for review. This doesn't invalidate your results, 
                  but you may want to retake the assessment if you feel your responses weren't accurate.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            onClick={() => {
              // Reset for new assessment
              setCurrentStep('intro')
              setCurrentQuestionIndex(0)
              setAnswers({})
              setShowResults(false)
              setMlAnalysis(null)
              setSessionId(null)
            }}
            sx={{ mr: 2 }}
          >
            Take Assessment Again
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={onClose}
          >
            Close
          </Button>
        </Box>
      </Box>
    )
  }

  const getScoreColor = (level) => {
    switch(level) {
      case 'severe': return 'error'
      case 'moderate': return 'warning'
      case 'mild': return 'info'
      default: return 'success'
    }
  }

  const currentQuestion = allQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          minHeight: '70vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: 'white',
        position: 'relative'
      }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
          {currentStep === 'intro' && 'Mental Health Assessment'}
          {currentStep === 'assessment' && `Question ${currentQuestionIndex + 1} of ${allQuestions.length}`}
          {currentStep === 'analyzing' && 'AI Analysis in Progress'}
          {currentStep === 'results' && 'Your Results'}
        </Typography>
        
        {currentStep === 'assessment' && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#fff'
                }
              }}
            />
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {Math.round(progress)}% Complete
            </Typography>
          </Box>
        )}
        
        <IconButton
          onClick={onClose}
          sx={{ 
            position: 'absolute', 
            right: 8, 
            top: 8, 
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, minHeight: '500px' }}>
        {currentStep === 'intro' && renderIntroStep()}
        {currentStep === 'analyzing' && renderAnalyzingStep()}
        {currentStep === 'results' && renderResultsStep()}
        
        {currentStep === 'assessment' && currentQuestion && (
          <Box sx={{ maxWidth: '700px', mx: 'auto' }}>
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
              <CardContent>
                <Chip 
                  label={currentQuestion.category} 
                  color="primary" 
                  size="small" 
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="h6" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
                  {currentQuestion.text}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Over the last 2 weeks, how often have you been bothered by this problem?
                </Typography>
              </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
              {responseOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  variant={answers[currentQuestion.id] === option.value ? "contained" : "outlined"}
                  size="large"
                  sx={{
                    p: 2,
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    backgroundColor: answers[currentQuestion.id] === option.value 
                      ? option.color 
                      : 'transparent',
                    borderColor: option.color,
                    color: answers[currentQuestion.id] === option.value 
                      ? 'white' 
                      : option.color,
                    '&:hover': {
                      backgroundColor: option.color,
                      color: 'white'
                    },
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5">{option.emoji}</Typography>
                    <Typography variant="body1">{option.label}</Typography>
                  </Box>
                </Button>
              ))}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button 
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0 && currentStep === 'assessment'}
                variant="outlined"
              >
                Previous
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                Question {currentQuestionIndex + 1} of {allQuestions.length}
              </Typography>
              
              <Box sx={{ width: 100 }} /> {/* Spacer for symmetry */}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default MLEnhancedMentalHealthAssessment