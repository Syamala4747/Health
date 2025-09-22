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
  Avatar,
  TextField,
  Chip,
  Alert,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Fade,
  Collapse
} from '@mui/material'
import {
  Close,
  Psychology,
  Send,
  SmartToy,
  Person,
  Assessment,
  Lightbulb,
  Favorite,
  SelfImprovement,
  Warning,
  LocalHospital,
  TrendingUp,
  Mood
} from '@mui/icons-material'
import ChatGPTCounselor from './ChatGPTCounselor'

const AIChatbot = ({ open, onClose, assessmentResults }) => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [emotionAnalysis, setEmotionAnalysis] = useState(null)
  const [showEmotionInsights, setShowEmotionInsights] = useState(false)
  const [conversationContext, setConversationContext] = useState({
    sessionId: null,
    emotionHistory: [],
    riskLevel: 'low',
    focusAreas: [],
    assessmentData: null
  })
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const messagesEndRef = useRef(null)

  // Initialize ChatGPT Counselor (will prompt for API key if needed)
  const counselor = useRef(null)

  // AI API endpoint - for fallback to API if needed
  const AI_API_URL = 'http://localhost:5000'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (open && assessmentResults) {
      // Initialize conversation with assessment results
      initializeWithAssessment()
    } else if (open) {
      // Initialize general conversation
      initializeGeneral()
    }
  }, [open, assessmentResults])

  // AI-powered emotion detection
  const detectEmotion = async (text) => {
    try {
      const response = await fetch(`${AI_API_URL}/emotion-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text })
      })
      
      if (response.ok) {
        const result = await response.json()
        return {
          emotion: result.detected_emotion,
          confidence: result.confidence || 0.8
        }
      } else {
        console.warn('AI emotion detection unavailable, using fallback')
        return getFallbackEmotion(text)
      }
    } catch (error) {
      console.warn('AI emotion detection error:', error)
      return getFallbackEmotion(text)
    }
  }

  const getFallbackEmotion = (text) => {
    // Simple keyword-based fallback
    const textLower = text.toLowerCase()
    
    if (textLower.includes('anxious') || textLower.includes('worried') || textLower.includes('nervous')) {
      return { emotion: 'anxiety', confidence: 0.7 }
    } else if (textLower.includes('sad') || textLower.includes('depressed') || textLower.includes('down')) {
      return { emotion: 'sadness', confidence: 0.7 }
    } else if (textLower.includes('angry') || textLower.includes('frustrated') || textLower.includes('mad')) {
      return { emotion: 'anger', confidence: 0.7 }
    } else if (textLower.includes('happy') || textLower.includes('joy') || textLower.includes('excited')) {
      return { emotion: 'joy', confidence: 0.7 }
    } else {
      return { emotion: 'neutral', confidence: 0.6 }
    }
  }

  const getPersonalizedGuidance = async (message, emotionResult) => {
    try {
      const response = await fetch(`${AI_API_URL}/coping-strategies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotion: emotionResult.emotion,
          count: 3,
          context: {
            message,
            assessment_results: conversationContext.assessmentData || assessmentResults
          }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        return {
          response: `I understand you're feeling ${emotionResult.emotion}. Here are some strategies that might help.`,
          techniques: result.strategies || [],
          immediate_action: result.strategies?.[0] || "Take a deep breath and remember you're not alone"
        }
      }
    } catch (error) {
      console.warn('AI guidance API error:', error)
    }
    
    // Fallback guidance
    return generateFallbackGuidance(emotionResult, assessmentResults)
  }

  const generateFallbackGuidance = (emotionResult, assessmentData) => {
    const { emotion } = emotionResult
    
    const guidanceMap = {
      anxiety: {
        response: "I can sense you're feeling anxious. Let's work through this together.",
        techniques: ["Try deep breathing: inhale for 4, hold for 7, exhale for 8", "Use the 5-4-3-2-1 grounding technique", "Practice progressive muscle relaxation"],
        immediate_action: "Focus on your breathing and remember you're safe"
      },
      sadness: {
        response: "I hear that you're going through a difficult time. Your feelings are valid.",
        techniques: ["Allow yourself to feel these emotions", "Reach out to someone you trust", "Try gentle movement or a warm bath"],
        immediate_action: "Be gentle with yourself today"
      },
      anger: {
        response: "I can sense your frustration. Let's find healthy ways to process this.",
        techniques: ["Take 10 deep breaths before responding", "Try physical exercise", "Write down your thoughts"],
        immediate_action: "Step away from the trigger if possible"
      },
      joy: {
        response: "It's wonderful to hear positive emotions from you!",
        techniques: ["Savor this moment", "Share your joy with others", "Keep a gratitude journal"],
        immediate_action: "Enjoy this positive feeling"
      },
      neutral: {
        response: "Thank you for sharing with me. How can I best support you?",
        techniques: ["Practice mindfulness", "Check in with your feelings", "Set small achievable goals"],
        immediate_action: "Take a moment to reflect"
      }
    }
    
    return guidanceMap[emotion] || guidanceMap.neutral
  }

  const initializeWithAssessment = () => {
    console.log('🔄 Initializing AI chat with assessment results:', assessmentResults)
    
    // Store assessment data in context
    setConversationContext(prev => ({
      ...prev,
      sessionId: generateSessionId(),
      assessmentData: assessmentResults,
      riskLevel: determineRiskLevel(assessmentResults),
      focusAreas: determineFocusAreas(assessmentResults)
    }))

    const welcomeMessage = {
      id: Date.now(),
      text: generateAssessmentWelcomeMessage(assessmentResults),
      sender: 'ai',
      timestamp: new Date(),
      type: 'assessment_welcome',
      assessmentContext: assessmentResults
    }

    setMessages([welcomeMessage])
  }

  const generateAssessmentWelcomeMessage = (results) => {
    const { phq9Score, gad7Score, phq9Severity, gad7Severity } = results
    
    let message = `Hello! I've reviewed your mental health assessment and I'm here to provide personalized support.\n\n`
    
    message += `**Your Assessment Summary:**\n`
    message += `• Depression (PHQ-9): ${phq9Score}/27 - ${phq9Severity} level\n`
    message += `• Anxiety (GAD-7): ${gad7Score}/21 - ${gad7Severity} level\n\n`
    
    // Personalized message based on severity
    if (phq9Score >= 15 || gad7Score >= 15) {
      message += `I understand you're going through a very challenging time. I want you to know that you're not alone, and seeking help shows incredible strength.\n\n`
      message += `I'm trained in evidence-based therapeutic techniques and can provide immediate support. However, I also encourage you to consider speaking with a mental health professional for comprehensive care.\n\n`
    } else if (phq9Score >= 10 || gad7Score >= 10) {
      message += `I see you're dealing with some significant challenges. These feelings are completely valid, and I'm here to help you work through them.\n\n`
      message += `Together, we can explore coping strategies and techniques that can help improve your mental wellbeing.\n\n`
    } else if (phq9Score >= 5 || gad7Score >= 5) {
      message += `I notice you're experiencing some mild symptoms. It's great that you're being proactive about your mental health!\n\n`
      message += `I can help you build resilience and develop healthy coping strategies to maintain your wellbeing.\n\n`
    } else {
      message += `Your assessment shows you're managing well overall. I'm here to help you maintain good mental health and build even stronger coping skills.\n\n`
    }
    
    message += `**I can help with:**\n`
    message += `• Coping strategies for stress and anxiety\n`
    message += `• Mood regulation techniques\n`
    message += `• Mindfulness and relaxation exercises\n`
    message += `• Problem-solving support\n`
    message += `• Crisis support and resources\n\n`
    
    message += `How are you feeling right now? What would you like to work on today?`
    
    return message
  }

  const determineRiskLevel = (results) => {
    const { phq9Score, gad7Score } = results
    if (phq9Score >= 20 || gad7Score >= 15) return 'high'
    if (phq9Score >= 15 || gad7Score >= 10) return 'moderate'
    if (phq9Score >= 10 || gad7Score >= 5) return 'mild'
    return 'low'
  }

  const determineFocusAreas = (results) => {
    const areas = []
    const { phq9Score, gad7Score, moodPercentages } = results
    
    if (gad7Score >= 10) areas.push('anxiety_management')
    if (phq9Score >= 10) areas.push('depression_support')
    if (moodPercentages?.stressed > 60) areas.push('stress_reduction')
    if (moodPercentages?.sad > 50) areas.push('mood_improvement')
    
    return areas
  }

  const initializeGeneral = () => {
    setConversationContext(prev => ({
      ...prev,
      sessionId: generateSessionId()
    }))

    const welcomeMessage = {
      id: Date.now(),
      text: `Hello! I'm your AI mental health companion, trained to provide personalized emotional support and guidance.

I can help you with:
• Understanding and managing emotions
• Stress and anxiety coping strategies  
• Depression support and mood improvement
• Academic and social pressures
• Building resilience and self-care practices
• Connecting with professional resources when needed

I use evidence-based therapeutic approaches and adapt my responses to your specific needs and emotional state.

How are you feeling today? What brings you here, and how can I support you?`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'general_welcome'
    }

    setMessages([welcomeMessage])
  }

  // Call AI service for real-time guidance
  const generateAIGuidance = async (userMessage) => {
    try {
      setIsAnalyzing(true)
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ai-guidance/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming JWT auth
        },
        body: JSON.stringify({
          message: userMessage,
          assessmentResults,
          conversationHistory: messages.slice(-5) // Last 5 messages for context
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI guidance')
      }

      const data = await response.json()
      
      // Update emotion analysis
      setEmotionAnalysis(data.data.emotionAnalysis)
      
      // Update conversation context
      setConversationContext(prev => ({
        ...prev,
        emotionHistory: [...prev.emotionHistory, {
          emotion: data.data.emotionAnalysis.primaryEmotion,
          intensity: data.data.emotionAnalysis.intensity,
          timestamp: new Date()
        }].slice(-10), // Keep last 10 emotions
        riskLevel: data.data.riskAssessment.riskLevel
      }))

      return {
        id: Date.now(),
        text: data.data.guidance,
        sender: 'ai',
        timestamp: new Date(),
        metadata: {
          emotionAnalysis: data.data.emotionAnalysis,
          techniques: data.data.recommendedTechniques,
          followUpQuestions: data.data.followUpQuestions,
          riskAssessment: data.data.riskAssessment
        }
      }
    } catch (error) {
      console.error('AI Guidance Error:', error)
      return getFallbackResponse(userMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getFallbackResponse = (userMessage) => {
    return {
      id: Date.now(),
      text: `I understand you're reaching out, and I want to help. While I'm having some technical difficulties connecting to my advanced guidance system right now, I'm still here to listen and support you.

Based on what you've shared, it sounds like you're going through something challenging. Here are some immediate things that might help:

• Take a few deep breaths and ground yourself in the present moment
• Remember that difficult feelings are temporary and will pass
• Consider reaching out to someone you trust - a friend, family member, or counselor
• Practice self-compassion and treat yourself with kindness

Would you like to tell me more about what you're experiencing? Sometimes just talking through things can be helpful.`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'fallback'
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    // Check if we need API key
    if (!counselor.current) {
      setShowApiKeyDialog(true)
      return
    }

    const messageText = inputMessage.trim()
    
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)
    setIsAnalyzing(true)

    try {
      console.log('📝 User message:', messageText)
      console.log('🔍 Processing with ChatGPT Counselor...')
      
      // Use ChatGPT Counselor - intelligent responses based on OpenAI
      const aiResult = await counselor.current.getCounselingResponse(
        messageText, 
        conversationContext.assessmentData || assessmentResults
      )
      
      console.log('✅ ChatGPT Result:', aiResult)
      
      // Update risk level
      setConversationContext(prev => ({
        ...prev,
        riskLevel: aiResult.riskLevel,
        assessmentData: conversationContext.assessmentData || assessmentResults
      }))
      
      // Create AI response message
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResult.response,
        sender: 'ai',
        timestamp: new Date(),
        riskLevel: aiResult.riskLevel,
        copingStrategies: aiResult.copingStrategies,
        tokensUsed: aiResult.tokensUsed,
        isFallback: aiResult.isFallback
      }

      setMessages(prev => [...prev, aiMessage])
      
      // Show coping strategies if available
      if (aiResult.copingStrategies && aiResult.copingStrategies.length > 0) {
        setTimeout(() => {
          const strategiesMessage = {
            id: Date.now() + 2,
            text: `Here are some coping strategies that might help:\n\n${aiResult.copingStrategies.map((strategy, index) => `${index + 1}. ${strategy}`).join('\n\n')}`,
            sender: 'ai',
            timestamp: new Date(),
            type: 'strategies'
          }
          setMessages(prev => [...prev, strategiesMessage])
        }, 1500)
      }

    } catch (error) {
      console.error('❌ ChatGPT API Error:', error)
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now, but I want you to know that your feelings are valid and you deserve support. If you're in crisis, please contact a counselor or call 988 for immediate help.",
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      setIsAnalyzing(false)
    }
  }

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      counselor.current = new ChatGPTCounselor(apiKey.trim())
      setShowApiKeyDialog(false)
      // Now try sending the message again
      if (inputMessage.trim()) {
        handleSendMessage()
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuickAction = (actionText) => {
    setInputMessage(actionText)
    // Auto-send the message
    setTimeout(() => handleSendMessage(), 100)
  }

  const generateSessionId = () => {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  return (
    <>
      {/* API Key Dialog */}
      <Dialog 
        open={showApiKeyDialog} 
        onClose={() => setShowApiKeyDialog(false)}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Psychology sx={{ mr: 1, color: 'primary.main' }} />
            ChatGPT API Key Required
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            To use ChatGPT-powered counseling, please enter your OpenAI API key. 
            You can get one from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI's website</a>.
          </Alert>
          <TextField
            fullWidth
            label="OpenAI API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowApiKeyDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleApiKeySubmit}
              disabled={!apiKey.trim()}
            >
              Connect
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(0.8);
            }
          }
        `}
      </style>
      
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { height: '80vh' } }}
      >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToy sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">AI Mental Health Coach</Typography>
            {assessmentResults && (
              <Chip 
                label="Assessment-Guided" 
                size="small" 
                color="primary" 
                sx={{ ml: 2 }} 
              />
            )}
            {emotionAnalysis && (
              <Chip 
                icon={<Mood />}
                label={`${emotionAnalysis.primaryEmotion} (${emotionAnalysis.intensity}/10)`}
                size="small" 
                color={emotionAnalysis.intensity > 7 ? 'error' : emotionAnalysis.intensity > 4 ? 'warning' : 'success'}
                sx={{ ml: 1 }} 
                onClick={() => setShowEmotionInsights(!showEmotionInsights)}
                clickable
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {conversationContext.riskLevel !== 'low' && (
              <Chip 
                icon={conversationContext.riskLevel === 'crisis' ? <LocalHospital /> : <Warning />}
                label={`${conversationContext.riskLevel} risk`}
                size="small" 
                color={conversationContext.riskLevel === 'crisis' ? 'error' : 'warning'}
              />
            )}
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
        
        {/* Emotion Insights Panel */}
        <Collapse in={showEmotionInsights}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            {emotionAnalysis && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Current Emotional State Analysis
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {emotionAnalysis.secondaryEmotions?.map((emotion, index) => (
                    <Chip key={index} label={emotion} size="small" variant="outlined" />
                  ))}
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={emotionAnalysis.intensity * 10} 
                  sx={{ mb: 1 }}
                  color={emotionAnalysis.intensity > 7 ? 'error' : emotionAnalysis.intensity > 4 ? 'warning' : 'success'}
                />
                <Typography variant="caption" color="text.secondary">
                  Intensity: {emotionAnalysis.intensity}/10
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0 }}>
        {/* Assessment Results Summary */}
        {assessmentResults && (
          <Paper sx={{ m: 2, p: 2, bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Assessment sx={{ mr: 1, fontSize: 16 }} />
              Assessment Results
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`Depression: ${assessmentResults.depression.level}`} 
                size="small" 
                sx={{ bgcolor: 'white', color: 'primary.main' }}
              />
              <Chip 
                label={`Anxiety: ${assessmentResults.anxiety.level}`} 
                size="small" 
                sx={{ bgcolor: 'white', color: 'primary.main' }}
              />
            </Box>
          </Paper>
        )}

        {/* Messages Container */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {messages.map((message) => (
            <Box key={message.id} sx={{ mb: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: 1
              }}>
                {message.sender === 'ai' && (
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <Psychology sx={{ fontSize: 18 }} />
                  </Avatar>
                )}
                
                <Paper sx={{ 
                  maxWidth: '70%',
                  p: 2,
                  bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                  color: message.sender === 'user' ? 'white' : 'text.primary'
                }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.text}
                  </Typography>
                  
                  {/* Display emotion detected with confidence */}
                  {message.emotion && message.sender === 'ai' && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`😊 Emotion: ${message.emotion}`}
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                        color="primary"
                      />
                      {message.emotionConfidence && (
                        <Chip 
                          label={`Confidence: ${(message.emotionConfidence * 100).toFixed(0)}%`}
                          size="small"
                          sx={{ fontSize: '0.7rem' }}
                          variant="outlined"
                        />
                      )}
                      {message.topics && message.topics.length > 0 && (
                        <Chip 
                          label={`📚 Topics: ${message.topics.join(', ')}`}
                          size="small"
                          sx={{ fontSize: '0.7rem' }}
                          color="secondary"
                        />
                      )}
                    </Box>
                  )}
                  
                  {/* Display coping strategies */}
                  {message.type === 'coping_strategies' && message.strategies && (
                    <Box sx={{ mt: 2 }}>
                      {message.strategies.map((strategy, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'start', gap: 1, mb: 1 }}>
                          <Lightbulb sx={{ fontSize: 16, color: 'warning.main', mt: 0.2 }} />
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {strategy}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  {/* Display coping strategies inline for AI messages */}
                  {message.copingStrategies && message.copingStrategies.length > 0 && message.type !== 'coping_strategies' && (
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                        💡 Quick Coping Tips:
                      </Typography>
                      {message.copingStrategies.slice(0, 2).map((strategy, index) => (
                        <Typography key={index} variant="caption" sx={{ display: 'block', mb: 0.5, fontSize: '0.75rem' }}>
                          • {strategy}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  
                  {/* Display risk level and resources */}
                  {message.type === 'risk_resources' && message.resources && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: message.riskLevel === 'high' ? 'error.main' : 'warning.main' }}>
                        🚨 Important Resources:
                      </Typography>
                      {message.resources.map((resource, index) => (
                        <Typography key={index} variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                          • {resource}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  
                  {/* Risk level indicator */}
                  {message.riskLevel && message.riskLevel !== 'low' && message.type !== 'risk_resources' && (
                    <Alert 
                      severity={message.riskLevel === 'high' ? 'error' : 'warning'} 
                      sx={{ mt: 1, fontSize: '0.75rem' }}
                    >
                      {message.riskLevel === 'high' 
                        ? 'Please consider reaching out to a counselor or mental health professional'
                        : 'Your wellbeing is important - consider talking to someone you trust'
                      }
                    </Alert>
                  )}
                  
                  <Typography variant="caption" sx={{ 
                    opacity: 0.7, 
                    display: 'block', 
                    mt: 1,
                    fontSize: '0.7rem'
                  }}>
                    {message.timestamp.toLocaleTimeString()}
                    {message.type === 'ai_direct_universal' && ' • 🧠 Smart AI (Mood-Based)'}
                    {message.type === 'ai_universal' && ' • 🧠 Universal AI'}
                    {message.type === 'ai_generated' && ' • AI Generated'}
                    {message.type === 'fallback' && ' • Fallback Response'}
                    {message.type === 'coping_strategies' && ' • 💡 Strategies'}
                    {message.type === 'risk_resources' && ' • ⚠️ Resources'}
                  </Typography>
                </Paper>

                {message.sender === 'user' && (
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                    <Person sx={{ fontSize: 18 }} />
                  </Avatar>
                )}
              </Box>
            </Box>
          ))}

          {/* Typing/Analysis Indicators */}
          {(isTyping || isAnalyzing) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                <Psychology sx={{ fontSize: 18 }} />
              </Avatar>
              <Paper sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', animation: 'pulse 1.5s infinite' }} />
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', animation: 'pulse 1.5s infinite 0.2s' }} />
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', animation: 'pulse 1.5s infinite 0.4s' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {isAnalyzing ? 'Analyzing your emotions...' : 'AI is thinking...'}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Type your message here..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              <Send />
            </Button>
          </Box>
          
          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            {/* Emotion-based suggestions */}
            {emotionAnalysis?.primaryEmotion === 'anxiety' && (
              <>
                <Chip 
                  icon={<SelfImprovement />}
                  label="Breathing Exercise" 
                  size="small" 
                  onClick={() => handleQuickAction("Can you guide me through a breathing exercise? I'm feeling anxious.")}
                  clickable
                  color="primary"
                />
                <Chip 
                  icon={<Lightbulb />}
                  label="Grounding Techniques" 
                  size="small" 
                  onClick={() => handleQuickAction("I need help with grounding techniques for my anxiety.")}
                  clickable
                />
              </>
            )}
            
            {emotionAnalysis?.primaryEmotion === 'sadness' && (
              <>
                <Chip 
                  icon={<TrendingUp />}
                  label="Mood Boosters" 
                  size="small" 
                  onClick={() => handleQuickAction("What are some activities that might help improve my mood?")}
                  clickable
                  color="success"
                />
                <Chip 
                  icon={<Favorite />}
                  label="Self-Care Ideas" 
                  size="small" 
                  onClick={() => handleQuickAction("Can you suggest some self-care activities for when I'm feeling down?")}
                  clickable
                />
              </>
            )}
            
            {emotionAnalysis?.primaryEmotion === 'stress' && (
              <>
                <Chip 
                  icon={<SelfImprovement />}
                  label="Stress Relief" 
                  size="small" 
                  onClick={() => handleQuickAction("I'm feeling overwhelmed. What stress relief techniques can help?")}
                  clickable
                  color="warning"
                />
                <Chip 
                  icon={<Lightbulb />}
                  label="Time Management" 
                  size="small" 
                  onClick={() => handleQuickAction("Can you help me manage my time better to reduce stress?")}
                  clickable
                />
              </>
            )}
            
            {/* General suggestions */}
            {!emotionAnalysis && (
              <>
                <Chip 
                  icon={<Lightbulb />}
                  label="Coping Strategies" 
                  size="small" 
                  onClick={() => handleQuickAction("Can you suggest some coping strategies?")}
                  clickable
                />
                <Chip 
                  icon={<SelfImprovement />}
                  label="Relaxation Techniques" 
                  size="small" 
                  onClick={() => handleQuickAction("I need help with relaxation techniques")}
                  clickable
                />
                <Chip 
                  icon={<Favorite />}
                  label="Self-Care Tips" 
                  size="small" 
                  onClick={() => handleQuickAction("What are some self-care activities I can try?")}
                  clickable
                />
              </>
            )}
            
            {/* Assessment-based suggestions */}
            {assessmentResults && conversationContext.focusAreas.includes('depression_management') && (
              <Chip 
                icon={<TrendingUp />}
                label="Depression Support" 
                size="small" 
                onClick={() => handleQuickAction("I'd like some guidance for managing depression symptoms.")}
                clickable
                color="info"
              />
            )}
            
            {assessmentResults && conversationContext.focusAreas.includes('anxiety_management') && (
              <Chip 
                icon={<SelfImprovement />}
                label="Anxiety Management" 
                size="small" 
                onClick={() => handleQuickAction("Can you help me with strategies for managing anxiety?")}
                clickable
                color="info"
              />
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default AIChatbot