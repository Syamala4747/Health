import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Send,
  Psychology,
  Person,
  Warning,
  Emergency,
  Phone,
  Close
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext.jsx'
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase.js'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function AICounselorChat({ assessmentResults }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const [crisisDetected, setCrisisDetected] = useState(false)
  const [crisisDialogOpen, setCrisisDialogOpen] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, typing])

  useEffect(() => {
    if (user) {
      loadUserProfile()
      loadChatHistory()
      initializeAIChat()
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        setUserProfile(userDoc.data())
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const loadChatHistory = () => {
    if (!user) return

    const q = query(
      collection(db, 'ai_chat_sessions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = []
      snapshot.forEach((doc) => {
        chatMessages.push({ id: doc.id, ...doc.data() })
      })
      setMessages(chatMessages)
    })

    return unsubscribe
  }

  const initializeAIChat = async () => {
    if (messages.length === 0) {
      const welcomeMessage = generateWelcomeMessage()
      await saveMessage(welcomeMessage, 'ai')
    }
  }

  const generateWelcomeMessage = () => {
    const name = userProfile?.profile?.firstName || 'there'
    
    if (assessmentResults) {
      const { phq9Score, gad7Score, phq9Severity, gad7Severity } = assessmentResults
      
      if (phq9Score >= 15 || gad7Score >= 15) {
        return `Hello ${name}, I'm your AI counselor. I've reviewed your recent assessment results and I can see you're going through a particularly challenging time. I'm here to provide immediate support and help you connect with professional resources. How are you feeling right now?`
      } else if (phq9Score >= 10 || gad7Score >= 10) {
        return `Hi ${name}, I'm your AI counselor. Based on your assessment, I can see you're dealing with some significant challenges. I'm here to help you develop coping strategies and provide emotional support. What's been on your mind lately?`
      } else if (phq9Score >= 5 || gad7Score >= 5) {
        return `Hello ${name}, I'm your AI counselor. Your assessment shows some mild symptoms that we can work on together. I'm here to help you build resilience and manage stress. What would you like to talk about today?`
      } else {
        return `Hi ${name}! I'm your AI counselor. It's great to see you're maintaining good mental health. I'm here to help you continue building positive habits and resilience. How can I support your wellness journey today?`
      }
    }
    
    return `Hello ${name}! I'm your AI counselor, here to provide support and guidance whenever you need it. How are you feeling today?`
  }

  const detectCrisis = (message) => {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'better off dead', 'hurt myself',
      'self harm', 'cutting', 'overdose', 'jump off', 'hang myself',
      'no point living', 'want to die', 'end my life', 'kill me'
    ]
    
    const messageLower = message.toLowerCase()
    return crisisKeywords.some(keyword => messageLower.includes(keyword))
  }

  const handleCrisisIntervention = async () => {
    setCrisisDetected(true)
    setCrisisDialogOpen(true)
    
    // Notify college head and admin
    try {
      await addDoc(collection(db, 'crisis_alerts'), {
        userId: user.uid,
        userEmail: user.email,
        message: inputMessage,
        timestamp: new Date(),
        status: 'active',
        type: 'ai_chat_crisis'
      })
      
      // Send immediate crisis response
      const crisisResponse = `I'm very concerned about what you've shared. Your safety is my top priority. Please know that you're not alone and there is help available. I'm connecting you with immediate resources and notifying your college support team. Would you like to talk to someone right now?`
      
      await saveMessage(crisisResponse, 'ai')
    } catch (error) {
      console.error('Error handling crisis intervention:', error)
    }
  }

  const generateAIResponse = async (userMessage) => {
    try {
      setTyping(true)
      
      const context = {
        userMessage,
        assessmentResults,
        userProfile,
        chatHistory: messages.slice(-5), // Last 5 messages for context
        timestamp: new Date().toISOString()
      }
      
      const response = await axios.post('/api/ai-counselor/chat', context)
      
      if (response.data.success) {
        return response.data.message
      } else {
        throw new Error('Failed to generate AI response')
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
      return "I'm sorry, I'm having trouble responding right now. Please try again in a moment, or consider reaching out to a human counselor if you need immediate support."
    } finally {
      setTyping(false)
    }
  }

  const saveMessage = async (message, sender, metadata = {}) => {
    try {
      await addDoc(collection(db, 'ai_chat_sessions'), {
        userId: user.uid,
        message,
        sender, // 'user' or 'ai'
        timestamp: new Date(),
        metadata,
        sessionId: `${user.uid}_${new Date().toDateString()}`
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    // Save user message
    await saveMessage(userMessage, 'user')

    // Check for crisis indicators
    if (detectCrisis(userMessage)) {
      await handleCrisisIntervention()
      setLoading(false)
      return
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(userMessage)
    await saveMessage(aiResponse, 'ai')
    
    setLoading(false)
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Crisis Alert */}
      {crisisDetected && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" href="tel:988">
              Call 988
            </Button>
          }
        >
          Crisis detected. Immediate help is available. Call 988 for crisis support.
        </Alert>
      )}

      {/* Chat Messages */}
      <Paper 
        sx={{ 
          flex: 1, 
          p: 2, 
          mb: 2, 
          maxHeight: '60vh', 
          overflowY: 'auto',
          backgroundColor: '#f8fafc'
        }}
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 2
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                maxWidth: '70%',
                flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
              }}
            >
              <Avatar
                sx={{
                  bgcolor: msg.sender === 'user' ? 'primary.main' : 'secondary.main',
                  width: 32,
                  height: 32
                }}
              >
                {msg.sender === 'user' ? <Person /> : <Psychology />}
              </Avatar>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: msg.sender === 'user' ? 'primary.main' : 'white',
                  color: msg.sender === 'user' ? 'white' : 'text.primary',
                  borderRadius: 2,
                  maxWidth: '100%'
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.message}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    opacity: 0.7, 
                    display: 'block', 
                    mt: 0.5,
                    fontSize: '0.75rem'
                  }}
                >
                  {msg.timestamp?.toDate().toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          </Box>
        ))}
        
        {typing && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
              <Psychology />
            </Avatar>
            <Paper sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  AI Counselor is typing...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Paper>

      {/* Message Input */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          disabled={loading}
          variant="outlined"
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || loading}
          sx={{ minWidth: 'auto', px: 2 }}
        >
          {loading ? <CircularProgress size={20} /> : <Send />}
        </Button>
      </Box>

      {/* Crisis Intervention Dialog */}
      <Dialog open={crisisDialogOpen} onClose={() => setCrisisDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Immediate Support Available
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            I'm concerned about your safety. Please know that help is available right now.
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Crisis Resources:</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>National Crisis Lifeline:</strong> 988
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Crisis Text Line:</strong> Text HOME to 741741
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Campus Counseling:</strong> Available 24/7
            </Typography>
          </Box>
          
          <Alert severity="info">
            Your college support team has been notified and will reach out to you soon.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCrisisDialogOpen(false)}>
            Continue Chat
          </Button>
          <Button 
            variant="contained" 
            color="error"
            startIcon={<Phone />}
            href="tel:988"
          >
            Call 988 Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}