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
  CardContent
} from '@mui/material'
import {
  Close,
  Psychology,
  AutoAwesome,
  HealthAndSafety,
  CheckCircle
} from '@mui/icons-material'

const SimpleMentalHealthAssessment = ({ open, onClose, onAssessmentComplete }) => {
  const [currentStep, setCurrentStep] = useState('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)

  // PHQ-9 Questions for Depression
  const phq9Questions = [
    {
      id: 'phq1',
      text: "Little interest or pleasure in doing things",
      category: 'PHQ-9'
    },
    {
      id: 'phq2', 
      text: "Feeling down, depressed, or hopeless",
      category: 'PHQ-9'
    },
    {
      id: 'phq3',
      text: "Trouble falling or staying asleep, or sleeping too much",
      category: 'PHQ-9'
    },
    {
      id: 'phq4',
      text: "Feeling tired or having little energy",
      category: 'PHQ-9'
    },
    {
      id: 'phq5',
      text: "Poor appetite or overeating",
      category: 'PHQ-9'
    },
    {
      id: 'phq6',
      text: "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
      category: 'PHQ-9'
    },
    {
      id: 'phq7',
      text: "Trouble concentrating on things, such as reading the newspaper or watching television",
      category: 'PHQ-9'
    },
    {
      id: 'phq8',
      text: "Moving or speaking so slowly that other people could have noticed, or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
      category: 'PHQ-9'
    },
    {
      id: 'phq9',
      text: "Thoughts that you would be better off dead, or of hurting yourself",
      category: 'PHQ-9'
    }
  ]

  // GAD-7 Questions for Anxiety
  const gad7Questions = [
    {
      id: 'gad1',
      text: "Feeling nervous, anxious, or on edge",
      category: 'GAD-7'
    },
    {
      id: 'gad2',
      text: "Not being able to stop or control worrying",
      category: 'GAD-7'
    },
    {
      id: 'gad3',
      text: "Worrying too much about different things",
      category: 'GAD-7'
    },
    {
      id: 'gad4',
      text: "Trouble relaxing",
      category: 'GAD-7'
    },
    {
      id: 'gad5',
      text: "Being so restless that it is hard to sit still",
      category: 'GAD-7'
    },
    {
      id: 'gad6',
      text: "Becoming easily annoyed or irritable",
      category: 'GAD-7'
    },
    {
      id: 'gad7',
      text: "Feeling afraid, as if something awful might happen",
      category: 'GAD-7'
    }
  ]

  const allQuestions = [...phq9Questions, ...gad7Questions]

  const answerOptions = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" }
  ]

  const startAssessment = () => {
    setCurrentStep('assessment')
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResults(false)
    
    // Track assessment start time for completion analysis
    window.assessmentStartTime = Date.now()
  }

  const handleAnswer = (value) => {
    const currentQuestion = allQuestions[currentQuestionIndex]
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Assessment complete, show results
      finishAssessment(newAnswers)
    }
  }

  // Add keyboard navigation support
  const handleKeyPress = (event, value) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleAnswer(value)
    }
  }

  // Allow number key selection (0-3)
  useEffect(() => {
    const handleNumberKeyPress = (event) => {
      if (currentStep === 'assessment' && !showResults) {
        const key = event.key
        if (['0', '1', '2', '3'].includes(key)) {
          const value = parseInt(key)
          if (value < answerOptions.length) {
            handleAnswer(value)
          }
        }
      }
    }

    window.addEventListener('keydown', handleNumberKeyPress)
    return () => window.removeEventListener('keydown', handleNumberKeyPress)
  }, [currentStep, showResults, currentQuestionIndex])

  const calculateScores = (answers) => {
    let phq9Score = 0
    let gad7Score = 0

    phq9Questions.forEach(q => {
      phq9Score += answers[q.id] || 0
    })

    gad7Questions.forEach(q => {
      gad7Score += answers[q.id] || 0
    })

    return { phq9Score, gad7Score }
  }

  const getDepressionLevel = (score) => {
    if (score <= 4) return { level: "Minimal", color: "success", severity: "low" }
    if (score <= 9) return { level: "Mild", color: "info", severity: "mild" }
    if (score <= 14) return { level: "Moderate", color: "warning", severity: "moderate" }
    if (score <= 19) return { level: "Moderately Severe", color: "error", severity: "high" }
    return { level: "Severe", color: "error", severity: "severe" }
  }

  const getAnxietyLevel = (score) => {
    if (score <= 4) return { level: "Minimal", color: "success", severity: "low" }
    if (score <= 9) return { level: "Mild", color: "info", severity: "mild" }
    if (score <= 14) return { level: "Moderate", color: "warning", severity: "moderate" }
    return { level: "Severe", color: "error", severity: "high" }
  }

  // Enhanced helper functions for AI context
  const determineOverallRisk = (phq9Score, gad7Score) => {
    const totalScore = phq9Score + gad7Score
    if (totalScore >= 30 || phq9Score >= 20 || gad7Score >= 15) return 'high'
    if (totalScore >= 20 || phq9Score >= 15 || gad7Score >= 10) return 'moderate'
    if (totalScore >= 10 || phq9Score >= 5 || gad7Score >= 5) return 'mild'
    return 'low'
  }

  const identifyKeySymptoms = (answers) => {
    const symptoms = []
    
    // Analyze high-scoring items for key symptoms
    Object.entries(answers).forEach(([questionId, score]) => {
      if (score >= 2) { // "More than half the days" or "Nearly every day"
        const question = allQuestions.find(q => q.id === questionId)
        if (question) {
          symptoms.push({
            symptom: question.text,
            severity: score,
            category: question.category
          })
        }
      }
    })
    
    return symptoms
  }

  const identifyStrengthAreas = (answers) => {
    const strengths = []
    
    // Identify areas with low scores (potential strengths)
    Object.entries(answers).forEach(([questionId, score]) => {
      if (score <= 1) { // "Not at all" or "Several days"
        const question = allQuestions.find(q => q.id === questionId)
        if (question) {
          strengths.push({
            area: question.text,
            category: question.category
          })
        }
      }
    })
    
    return strengths
  }

  const getRecommendedFocus = (depression, anxiety) => {
    const focus = []
    
    if (depression.severity === 'high' || depression.severity === 'severe') {
      focus.push('depression_management', 'behavioral_activation', 'professional_support')
    } else if (depression.severity === 'moderate') {
      focus.push('mood_improvement', 'activity_scheduling', 'social_connection')
    }
    
    if (anxiety.severity === 'high' || anxiety.severity === 'severe') {
      focus.push('anxiety_management', 'relaxation_techniques', 'stress_reduction')
    } else if (anxiety.severity === 'moderate') {
      focus.push('coping_strategies', 'mindfulness', 'worry_management')
    }
    
    if (focus.length === 0) {
      focus.push('wellness_maintenance', 'stress_prevention', 'self_care')
    }
    
    return focus
  }

  const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  const finishAssessment = (finalAnswers) => {
    const { phq9Score, gad7Score } = calculateScores(finalAnswers)
    const depression = getDepressionLevel(phq9Score)
    const anxiety = getAnxietyLevel(gad7Score)
    
    // Enhanced results with emotional context for AI
    const results = {
      // Basic scores
      phq9Score,
      gad7Score,
      depression,
      anxiety,
      answers: finalAnswers,
      timestamp: new Date(),
      
      // Enhanced emotional context for AI
      emotionalProfile: {
        depressionSeverity: depression.severity,
        anxietySeverity: anxiety.severity,
        overallRiskLevel: determineOverallRisk(phq9Score, gad7Score),
        keySymptoms: identifyKeySymptoms(finalAnswers),
        strengthAreas: identifyStrengthAreas(finalAnswers),
        recommendedFocus: getRecommendedFocus(depression, anxiety)
      },
      
      // Metadata for AI processing
      metadata: {
        totalQuestions: allQuestions.length,
        completionTime: Date.now() - (window.assessmentStartTime || Date.now()),
        sessionId: generateSessionId(),
        version: '2.0'
      }
    }

    setShowResults(true)
    
    // Pass enhanced results to parent component for AI chatbot
    if (onAssessmentComplete) {
      onAssessmentComplete(results)
    }
  }

  const currentQuestion = allQuestions[currentQuestionIndex]

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: translateX(-50%) scale(1);
              opacity: 1;
            }
            50% {
              transform: translateX(-50%) scale(1.05);
              opacity: 0.7;
            }
            100% {
              transform: translateX(-50%) scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
      
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ 
          sx: { 
            height: '95vh',
            borderRadius: 3,
            overflow: 'hidden'
          } 
        }}
      >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HealthAndSafety sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Mental Health Assessment</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {currentStep === 'intro' && (
          <Box sx={{ 
            p: 4, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ 
              position: 'relative',
              mb: 4
            }}>
              <Avatar sx={{ 
                bgcolor: 'primary.main', 
                width: 100, 
                height: 100, 
                mx: 'auto', 
                mb: 3,
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <Psychology sx={{ fontSize: 50 }} />
              </Avatar>
              
              <Box sx={{
                position: 'absolute',
                top: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 140,
                height: 140,
                border: '2px dashed rgba(102, 126, 234, 0.3)',
                borderRadius: '50%',
                zIndex: -1
              }} />
            </Box>
            
            <Typography variant="h3" gutterBottom sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}>
              Know Your Mental Health
            </Typography>
            
            <Typography variant="h6" color="text.secondary" paragraph sx={{ 
              maxWidth: 600, 
              mx: 'auto',
              lineHeight: 1.6,
              mb: 4
            }}>
              Take a comprehensive mental health assessment using clinically validated PHQ-9 and GAD-7 questionnaires to understand your well-being.
            </Typography>

            <Box sx={{ my: 4, maxWidth: 800, mx: 'auto' }}>
              <Alert 
                severity="info" 
                sx={{ 
                  textAlign: 'left', 
                  mb: 3,
                  borderRadius: 2,
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  '& .MuiAlert-icon': {
                    color: 'primary.main'
                  }
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  What you'll receive:
                </Typography>
                <Box component="div" sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 1
                }}>
                  <Typography variant="body2">• Depression screening (PHQ-9)</Typography>
                  <Typography variant="body2">• Anxiety screening (GAD-7)</Typography>
                  <Typography variant="body2">• Detailed results and analysis</Typography>
                  <Typography variant="body2">• AI-powered guidance recommendations</Typography>
                </Box>
              </Alert>

              <Alert 
                severity="warning" 
                sx={{ 
                  textAlign: 'left',
                  borderRadius: 2,
                  border: '1px solid rgba(245, 158, 11, 0.2)'
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  <strong>Important:</strong> This assessment is for educational and self-awareness purposes only. It does not replace professional medical diagnosis or treatment. If you're experiencing severe symptoms, please consult a healthcare professional.
                </Typography>
              </Alert>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={startAssessment}
                startIcon={<AutoAwesome />}
                sx={{ 
                  mt: 2,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Begin Assessment
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Takes approximately 3-5 minutes to complete
              </Typography>
            </Box>
          </Box>
        )}

        {currentStep === 'assessment' && !showResults && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
            {/* Enhanced Progress Header */}
            <Box sx={{ 
              p: 4, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      Question {currentQuestionIndex + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {allQuestions.length} total questions • {Math.round(((currentQuestionIndex + 1) / allQuestions.length) * 100)}% complete
                    </Typography>
                  </Box>
                  <Chip 
                    label={currentQuestion?.category} 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                </Box>
                
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    height: 6, 
                    bgcolor: 'rgba(255,255,255,0.3)', 
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      height: '100%',
                      width: `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%`,
                      background: 'linear-gradient(90deg, #4ade80, #22c55e)',
                      borderRadius: 3,
                      transition: 'width 0.5s ease',
                      boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
                    }} />
                  </Box>
                </Box>
              </Box>
              
              {/* Background decoration */}
              <Box sx={{ 
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.1)',
                zIndex: 1
              }} />
            </Box>

            {/* Enhanced Question Section */}
            <Box sx={{ flexGrow: 1, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {currentQuestion && (
                <>
                  {/* Question Card */}
                  <Card sx={{ 
                    mb: 4, 
                    borderRadius: 3,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      p: 4,
                      textAlign: 'center',
                      position: 'relative'
                    }}>
                      <Avatar sx={{ 
                        bgcolor: 'primary.main', 
                        width: 60, 
                        height: 60, 
                        mx: 'auto', 
                        mb: 2,
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                      }}>
                        <Psychology sx={{ fontSize: 30 }} />
                      </Avatar>
                      
                      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                        Over the last 2 weeks, how often have you been bothered by:
                      </Typography>
                      
                      <Typography variant="h4" sx={{ 
                        fontWeight: 600, 
                        color: 'primary.dark',
                        mt: 2,
                        lineHeight: 1.3,
                        maxWidth: '90%',
                        mx: 'auto'
                      }}>
                        {currentQuestion.text}
                      </Typography>
                    </Box>
                  </Card>
                  
                  {/* Enhanced Answer Options */}
                  <Box sx={{ maxWidth: 700, mx: 'auto', width: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
                      Select your response:
                    </Typography>
                    
                    <Typography variant="body2" sx={{ 
                      mb: 3, 
                      textAlign: 'center', 
                      color: 'text.secondary',
                      fontStyle: 'italic'
                    }}>
                      Click an option below or press the number keys (0-3) on your keyboard
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {answerOptions.map((option, index) => (
                        <Button
                          key={option.value}
                          variant="outlined"
                          onClick={() => handleAnswer(option.value)}
                          onKeyDown={(e) => handleKeyPress(e, option.value)}
                          tabIndex={0}
                          sx={{
                            p: 3,
                            borderRadius: 3,
                            border: '2px solid #e5e7eb',
                            backgroundColor: 'white',
                            textAlign: 'left',
                            justifyContent: 'flex-start',
                            minHeight: 80,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: index === 0 ? '#22c55e' : index === 1 ? '#f59e0b' : index === 2 ? '#f97316' : '#ef4444',
                              backgroundColor: `${index === 0 ? '#22c55e' : index === 1 ? '#f59e0b' : index === 2 ? '#f97316' : '#ef4444'}08`,
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                            },
                            '&:focus': {
                              borderColor: index === 0 ? '#22c55e' : index === 1 ? '#f59e0b' : index === 2 ? '#f97316' : '#ef4444',
                              backgroundColor: `${index === 0 ? '#22c55e' : index === 1 ? '#f59e0b' : index === 2 ? '#f97316' : '#ef4444'}08`,
                              outline: 'none',
                              boxShadow: `0 0 0 3px ${index === 0 ? '#22c55e' : index === 1 ? '#f59e0b' : index === 2 ? '#f97316' : '#ef4444'}40`
                            },
                            '&:active': {
                              transform: 'translateY(0px)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            {/* Option Number Circle */}
                            <Box sx={{
                              width: 45,
                              height: 45,
                              borderRadius: '50%',
                              bgcolor: index === 0 ? '#22c55e' : index === 1 ? '#f59e0b' : index === 2 ? '#f97316' : '#ef4444',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '1.2rem',
                              mr: 3,
                              flexShrink: 0
                            }}>
                              {index}
                            </Box>
                            
                            {/* Option Content */}
                            <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 600,
                                color: 'text.primary',
                                mb: 0.5,
                                fontSize: '1.1rem'
                              }}>
                                {option.label}
                              </Typography>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                                {index === 0 && "No days in the past 2 weeks"}
                                {index === 1 && "1-6 days in the past 2 weeks"}  
                                {index === 2 && "7-11 days in the past 2 weeks"}
                                {index === 3 && "12-14 days in the past 2 weeks"}
                              </Typography>
                            </Box>
                            
                            {/* Radio Button Indicator */}
                            <Box sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              border: '2px solid #d1d5db',
                              flexShrink: 0,
                              ml: 2
                            }} />
                          </Box>
                        </Button>
                      ))}
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        )}

        {showResults && (
          <Box sx={{ 
            p: 4, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ position: 'relative', mb: 4 }}>
              <Avatar sx={{ 
                bgcolor: 'success.main', 
                width: 100, 
                height: 100, 
                mx: 'auto', 
                mb: 3,
                boxShadow: '0 10px 40px rgba(34, 197, 94, 0.3)',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
              }}>
                <CheckCircle sx={{ fontSize: 50 }} />
              </Avatar>
              
              {/* Animated success rings */}
              <Box sx={{
                position: 'absolute',
                top: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 120,
                height: 120,
                border: '3px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
              <Box sx={{
                position: 'absolute',
                top: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 140,
                height: 140,
                border: '2px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '50%',
                animation: 'pulse 2s infinite 0.5s'
              }} />
            </Box>
            
            <Typography variant="h3" gutterBottom sx={{ 
              fontWeight: 700,
              color: 'success.dark',
              mb: 2
            }}>
              Assessment Complete! 🎉
            </Typography>
            
            <Typography variant="h6" color="text.secondary" paragraph sx={{ 
              maxWidth: 600, 
              mx: 'auto',
              lineHeight: 1.6,
              mb: 4
            }}>
              Your mental health assessment has been completed successfully. Your results have been analyzed and are ready for AI-powered guidance.
            </Typography>

            <Box sx={{ my: 4, maxWidth: 700, mx: 'auto' }}>
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white',
                  p: 3
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    What happens next?
                  </Typography>
                </Box>
                
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                        <Assessment sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Typography variant="body1">Your responses have been analyzed using clinical standards</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                        <Psychology sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Typography variant="body1">AI recommendations are being prepared based on your results</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                        <AutoAwesome sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Typography variant="body1">Get personalized guidance and coping strategies</Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => {
                  onClose()
                  // This will be handled by parent to open AI chat
                }}
                startIcon={<Psychology />}
                sx={{ 
                  minWidth: 200,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Talk to AI Coach
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                onClick={onClose}
                sx={{ 
                  minWidth: 150,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Close Assessment
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, fontStyle: 'italic' }}>
              Remember: This assessment is a tool for self-awareness. For clinical concerns, please consult a healthcare professional.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}

export default SimpleMentalHealthAssessment