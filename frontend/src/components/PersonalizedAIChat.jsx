import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Fab,
} from '@mui/material'
import {
  Send,
  Psychology,
  Person,
  Close,
  Refresh,
  Warning,
  Info,
  CheckCircle,
  Phone,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { AIPersonalityEngine } from '../services/aiPersonalityEngine'

export default function PersonalizedAIChat({ open, onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [assessmentData, setAssessmentData] = useState(null)
  const [aiPersonality, setAiPersonality] = useState(null)
  const [conversationHistory, setConversationHistory] = useState([])
  const [emergencyDetected, setEmergencyDetected] = useState(false)
  const messagesEndRef = useRef(null)

  const aiEngine = new AIPersonalityEngine()

  // Load user's assessment data and initialize AI personality
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      try {
        // Load assessment data
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          if (userData.lastAssessment) {
            setAssessmentData(userData.lastAssessment)
            const personality = aiEngine.getPersonality(userData.lastAssessment)
            setAiPersonality(personality)
            
            // Initialize conversation with personalized greeting
            const greeting = aiEngine.getConversationStarter(userData.lastAssessment)
            setMessages([{
              id: 1,
              text: greeting,
              sender: 'ai',
              timestamp: new Date(),
              personality: personality.tone
            }])
          } else {
            // No assessment - encourage taking one
            setMessages([{
              id: 1,
              text: "Hi there! 😊 I'm your AI counselor. I notice you haven't taken a wellness assessment yet. Taking one would help me provide much better, personalized support for you. Would you like to take the assessment first, or shall we start chatting?",
              sender: 'ai',
              timestamp: new Date(),
              personality: 'supportive'
            }])
          }
        }

        // Load recent conversation history
        const historyQuery = query(
          collection(db, 'conversations', user.uid, 'messages'),
          orderBy('timestamp', 'desc'),
          limit(10)
        )
        const historySnapshot = await getDocs(historyQuery)
        const history = historySnapshot.docs.map(doc => doc.data())
        setConversationHistory(history.reverse())

      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    if (open) {
      loadUserData()
    }
  }, [open, user])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const detectEmergency = (text) => {
    const emergencyKeywords = [
      'hurt myself', 'kill myself', 'suicide', 'end it all', 'can\'t go on',
      'want to die', 'better off dead', 'self harm', 'cut myself'
    ]
    
    const lowerText = text.toLowerCase()
    return emergencyKeywords.some(keyword => lowerText.includes(keyword))
  }

  const getAIResponse = async (userMessage) => {
    // This is where you'd integrate with your AI service
    // For now, I'll show you how to structure the prompt based on assessment data
    
    const adaptedContext = aiEngine.adaptResponse(userMessage, assessmentData, conversationHistory)
    
    // Emergency check
    if (detectEmergency(userMessage)) {
      setEmergencyDetected(true)
      return {
        text: "I'm very concerned about what you're sharing. Your safety is the most important thing right now. Please consider contacting:\n\n🆘 National Suicide Prevention Lifeline: 988\n📱 Crisis Text Line: Text HOME to 741741\n🚨 Emergency Services: 911\n\nI'm here to support you, but professional help is crucial right now. Are you in a safe place?",
        personality: 'crisis',
        requiresImmediateHelp: true
      }
    }

    // Simulate AI response based on personality
    const responses = generatePersonalizedResponse(userMessage, adaptedContext)
    
    return {
      text: responses.text,
      personality: adaptedContext.personality.tone,
      suggestions: adaptedContext.followUpSuggestions
    }
  }

  const generatePersonalizedResponse = (userMessage, context) => {
    const { personality } = context
    const userLower = userMessage.toLowerCase()

    // Response templates based on personality
    if (personality.tone === 'encouraging') {
      if (userLower.includes('good') || userLower.includes('great')) {
        return {
          text: "That's wonderful to hear! 🌟 It sounds like you're doing amazing. What's been contributing to these positive feelings? I'd love to hear more about what's working well for you!"
        }
      } else if (userLower.includes('worried') || userLower.includes('anxious')) {
        return {
          text: "I understand you're feeling worried, and that's completely normal. 💙 Remember, you've shown such strength before! What strategies have helped you feel more confident in the past? Let's build on those successes together."
        }
      }
    } else if (personality.tone === 'gentle') {
      if (userLower.includes('sad') || userLower.includes('down')) {
        return {
          text: "I hear that you're feeling sad right now, and I want you to know that those feelings are valid. 💙 It takes courage to share that with me. Would you like to talk about what's been weighing on your heart? We can take this one step at a time."
        }
      } else if (userLower.includes('tired') || userLower.includes('exhausted')) {
        return {
          text: "Feeling tired can be really overwhelming. 🤗 Your body and mind might be telling you they need some gentle care. What would feel like the most nurturing thing you could do for yourself today, even something small?"
        }
      }
    } else if (personality.tone === 'caring') {
      if (userLower.includes('hopeless') || userLower.includes('can\'t')) {
        return {
          text: "I can hear how much pain you're in right now, and I want you to know that you're not alone in this. 🤗 These feelings are incredibly difficult, but they don't define your future. Have you been able to connect with a professional counselor? I really think that could help provide the support you deserve."
        }
      }
    }

    // Default supportive response
    return {
      text: `I hear you, and thank you for sharing that with me. ${personality.vocabulary[0]} that you're reaching out. Can you tell me a bit more about what's on your mind? I'm here to ${personality.vocabulary[1]} you through this.`
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Save user message to conversation history
      await addDoc(collection(db, 'conversations', user.uid, 'messages'), {
        ...userMessage,
        userId: user.uid
      })

      // Get AI response
      const aiResponse = await getAIResponse(userMessage.text)
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse.text,
        sender: 'ai',
        timestamp: new Date(),
        personality: aiResponse.personality,
        suggestions: aiResponse.suggestions,
        requiresImmediateHelp: aiResponse.requiresImmediateHelp
      }

      setMessages(prev => [...prev, aiMessage])

      // Save AI message to conversation history
      await addDoc(collection(db, 'conversations', user.uid, 'messages'), {
        ...aiMessage,
        userId: user.uid
      })

      // Update conversation history for context
      setConversationHistory(prev => [...prev, userMessage, aiMessage].slice(-20))

    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble responding right now. Please try again or contact a human counselor if you need immediate support.",
        sender: 'ai',
        timestamp: new Date(),
        error: true
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleTakeAssessment = () => {
    onClose()
    window.location.href = '/student/assessment'
  }

  const getPersonalityColor = (personality) => {
    switch (personality) {
      case 'encouraging': return 'success.main'
      case 'supportive': return 'info.main'
      case 'gentle': return 'primary.main'
      case 'caring': return 'warning.main'
      case 'crisis': return 'error.main'
      default: return 'info.main'
    }
  }

  const getPersonalityIcon = (personality) => {
    switch (personality) {
      case 'encouraging': return <CheckCircle />
      case 'supportive': return <Info />
      case 'gentle': return <Psychology />
      case 'caring': return <Warning />
      case 'crisis': return <Phone />
      default: return <Psychology />
    }
  }

  if (!open) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
        p: 2
      }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 600,
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: aiPersonality ? getPersonalityColor(aiPersonality.tone) : 'primary.main' }}>
              {aiPersonality ? getPersonalityIcon(aiPersonality.tone) : <Psychology />}
            </Avatar>
            <Box>
              <Typography variant="h6">
                AI Counselor
              </Typography>
              {assessmentData && (
                <Chip 
                  size="small"
                  label={`${aiPersonality?.tone || 'supportive'} mode`}
                  color={getSeverityColor(assessmentData.severity)}
                />
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Assessment Status */}
        {!assessmentData && (
          <Alert 
            severity="info"
            action={
              <Button color="inherit" size="small" onClick={handleTakeAssessment}>
                Take Assessment
              </Button>
            }
            sx={{ m: 2 }}
          >
            Taking a wellness assessment will help me provide much better, personalized support!
          </Alert>
        )}

        {/* Emergency Alert */}
        {emergencyDetected && (
          <Alert severity="error" sx={{ m: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Crisis Resources Available 24/7:
            </Typography>
            <Typography variant="body2">
              • National Suicide Prevention Lifeline: 988<br/>
              • Crisis Text Line: Text HOME to 741741<br/>
              • Emergency Services: 911
            </Typography>
          </Alert>
        )}

        {/* Messages */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Box sx={{ maxWidth: '80%' }}>
                {message.sender === 'ai' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ 
                      width: 24, 
                      height: 24,
                      bgcolor: getPersonalityColor(message.personality)
                    }}>
                      {getPersonalityIcon(message.personality)}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      AI Counselor ({message.personality || 'supportive'})
                    </Typography>
                  </Box>
                )}
                
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: message.sender === 'user' ? 'primary.main' : 
                             message.error ? 'error.light' :
                             message.requiresImmediateHelp ? 'error.main' : 'grey.100',
                    color: message.sender === 'user' ? 'white' : 
                           message.requiresImmediateHelp ? 'white' : 'text.primary'
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.text}
                  </Typography>
                  
                  {message.suggestions && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Suggested topics:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {message.suggestions.slice(0, 2).map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={suggestion}
                            size="small"
                            onClick={() => setInput(suggestion)}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Paper>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24 }}>
                  <Psychology />
                </Avatar>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  AI is thinking...
                </Typography>
              </Box>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={assessmentData ? 
                "Share what's on your mind..." : 
                "Tell me what's bothering you (assessment recommended for better support)..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              multiline
              maxRows={3}
              disabled={loading}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              sx={{ minWidth: 48 }}
            >
              <Send />
            </Button>
          </Box>
          
          {assessmentData && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              AI adapted for {assessmentData.severity} support level • Last assessment: {new Date(assessmentData.completedAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  )

  function getSeverityColor(severity) {
    switch (severity) {
      case 'minimal': return 'success'
      case 'mild': return 'info'
      case 'moderate': return 'warning'
      case 'moderately_severe': return 'error'
      case 'severe': return 'error'
      default: return 'info'
    }
  }
}