import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Paper,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Container,
  useTheme,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Psychology,
  Send,
  SmartToy,
  Person,
  Warning,
  Info,
  Refresh,
  History,
  Phone
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase.js'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function AICounselor() {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const messagesEndRef = useRef(null)
  
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [assessmentContext, setAssessmentContext] = useState(null)
  const [crisisDetected, setCrisisDetected] = useState(false)

  useEffect(() => {
    // Get assessment results from navigation state
    if (location.state?.assessmentResults) {
      setAssessmentContext(location.state.assessmentResults)
    }
    
    // Initialize AI session
    initializeSession()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeSession = async () => {
    try {
      // Create a new AI counseling session
      const sessionDoc = await addDoc(collection(db, 'ai_sessions'), {
        userId: user.uid,
        startedAt: serverTimestamp(),
        status: 'active',
        messageCount: 0
      })
      
      setSessionId(sessionDoc.id)
      
      // Send initial greeting based on assessment results
      const greeting = getInitialGreeting()
      setMessages([{
        id: 1,
        type: 'ai',
        content: greeting,
        timestamp: new Date()
      }])
      
    } catch (error) {
      console.error('Error initializing AI session:', error)
      toast.error('Failed to start AI counselor session')
    }
  }

  const getInitialGreeting = () => {
    if (assessmentContext) {
      const phq9Score = assessmentContext.phq9?.score || 0
      const gad7Score = assessmentContext.gad7?.score || 0
      
      if (phq9Score >= 15 || gad7Score >= 10) {
        return "Hello! I've reviewed your recent assessment results and I can see you're going through a challenging time. I'm here to provide support and guidance. How are you feeling right now, and what would you like to talk about?"
      } else if (phq9Score >= 10 || gad7Score >= 5) {
        return "Hi there! I see you've completed a mental health assessment recently. I'm here to help you process your results and provide support. What's on your mind today?"
      }
    }
    
    return "Hello! I'm your AI mental health counselor. I'm here to provide support, guidance, and a safe space to talk about whatever is on your mind. How are you feeling today?"
  }

  const detectCrisis = (message) => {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead',
      'hurt myself', 'self harm', 'cutting', 'overdose', 'jump off'
    ]
    
    const messageLower = message.toLowerCase()
    return crisisKeywords.some(keyword => messageLower.includes(keyword))
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    // Check for crisis indicators
    if (detectCrisis(userMessage.content)) {
      setCrisisDetected(true)
      // Add crisis response immediately
      const crisisResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm very concerned about what you've shared. Your safety is the most important thing right now. Please consider reaching out to a crisis helpline immediately: National Suicide Prevention Lifeline (988) or text HOME to 741741. Would you like me to help you find local emergency resources?",
        timestamp: new Date(),
        isCrisis: true
      }
      setMessages(prev => [...prev, crisisResponse])
      setLoading(false)
      return
    }

    try {
      // Prepare context for AI
      const context = {
        assessmentResults: assessmentContext,
        recentMessages: messages.slice(-10), // Last 10 messages for context
        userMessage: userMessage.content
      }

      // Call AI service
      const response = await axios.post('/api/ai-counselor/chat', {
        message: userMessage.content,
        context: context,
        sessionId: sessionId
      })

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response,
        timestamp: new Date(),
        confidence: response.data.confidence
      }

      setMessages(prev => [...prev, aiResponse])

      // Save messages to database
      await Promise.all([
        addDoc(collection(db, 'ai_messages'), {
          sessionId,
          userId: user.uid,
          type: 'user',
          content: userMessage.content,
          timestamp: serverTimestamp()
        }),
        addDoc(collection(db, 'ai_messages'), {
          sessionId,
          userId: user.uid,
          type: 'ai',
          content: aiResponse.content,
          timestamp: serverTimestamp(),
          confidence: aiResponse.confidence
        })
      ])

    } catch (error) {
      console.error('Error sending message to AI:', error)
      
      // Fallback response
      const fallbackResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I apologize, but I'm having trouble processing your message right now. This might be a good time to consider speaking with a human counselor who can provide more personalized support. Would you like me to help you find counseling resources?",
        timestamp: new Date(),
        isError: true
      }
      
      setMessages(prev => [...prev, fallbackResponse])
      toast.error('AI counselor is temporarily unavailable')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmergencyContact = () => {
    window.open('tel:988', '_self')
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 2, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SmartToy sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                AI Mental Health Counselor
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Available 24/7 • Confidential Support
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Emergency Hotline">
              <IconButton 
                onClick={handleEmergencyContact}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                <Phone />
              </IconButton>
            </Tooltip>
            <Tooltip title="Human Counselor">
              <IconButton 
                onClick={() => navigate('/student/counselor-booking')}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                <Psychology />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Crisis Alert */}
      {crisisDetected && (
        <Alert 
          severity="error" 
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={handleEmergencyContact}
            >
              Call 988
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Crisis Support Available: If you're in immediate danger, please call 988 (Suicide & Crisis Lifeline) or 911.
          </Typography>
        </Alert>
      )}

      {/* Assessment Context */}
      {assessmentContext && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Info color="info" />
            <Typography variant="body2">
              I have access to your recent assessment results to provide personalized support.
            </Typography>
            {assessmentContext.phq9 && (
              <Chip 
                label={`PHQ-9: ${assessmentContext.phq9.score}`} 
                size="small" 
                color="info" 
                variant="outlined" 
              />
            )}
            {assessmentContext.gad7 && (
              <Chip 
                label={`GAD-7: ${assessmentContext.gad7.score}`} 
                size="small" 
                color="info" 
                variant="outlined" 
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Chat Messages */}
      <Paper 
        sx={{ 
          flex: 1, 
          p: 2, 
          borderRadius: 3, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  maxWidth: '70%',
                  flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.type === 'user' ? theme.palette.primary.main : theme.palette.secondary.main,
                    width: 32,
                    height: 32
                  }}
                >
                  {message.type === 'user' ? <Person /> : <SmartToy />}
                </Avatar>
                
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: message.type === 'user' 
                      ? theme.palette.primary.main 
                      : message.isCrisis 
                        ? alpha(theme.palette.error.main, 0.1)
                        : message.isError
                          ? alpha(theme.palette.warning.main, 0.1)
                          : alpha(theme.palette.secondary.main, 0.1),
                    color: message.type === 'user' ? 'white' : 'inherit',
                    border: message.isCrisis ? `2px solid ${theme.palette.error.main}` : 'none'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      mt: 1, 
                      opacity: 0.7,
                      textAlign: message.type === 'user' ? 'right' : 'left'
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ))}
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 32, height: 32 }}>
                  <SmartToy />
                </Avatar>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      AI is thinking...
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Message Input */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
            sx={{ 
              minWidth: 56, 
              height: 56, 
              borderRadius: 3,
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark }
            }}
          >
            <Send />
          </Button>
        </Box>
      </Paper>

      {/* Footer Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Psychology />}
          onClick={() => navigate('/student/counselor-booking')}
          sx={{ borderRadius: 2 }}
        >
          Talk to Human Counselor
        </Button>
        <Button
          variant="outlined"
          startIcon={<History />}
          onClick={() => navigate('/student/ai-history')}
          sx={{ borderRadius: 2 }}
        >
          Chat History
        </Button>
      </Box>
    </Container>
  )
}