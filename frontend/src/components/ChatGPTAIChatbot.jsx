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
  const [conversationContext, setConversationContext] = useState({
    sessionId: null,
    riskLevel: 'low',
    assessmentData: null
  })
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const messagesEndRef = useRef(null)

  // Initialize ChatGPT Counselor (will prompt for API key if needed)
  const counselor = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (open && assessmentResults) {
      setConversationContext(prev => ({
        ...prev,
        assessmentData: assessmentResults,
        sessionId: generateSessionId()
      }))
      
      // Add welcome message with assessment context
      const welcomeMessage = {
        id: Date.now(),
        text: `Hello! I'm here to provide personalized mental health support. I see you've completed an assessment - let's work together to address your needs. How are you feeling right now?`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'welcome'
      }
      setMessages([welcomeMessage])
    } else if (open) {
      // Regular welcome without assessment
      const welcomeMessage = {
        id: Date.now(),
        text: "Hi there! I'm your AI mental health counselor. I'm here to listen, support, and help you work through whatever you're experiencing. How are you feeling today?",
        sender: 'ai',
        timestamp: new Date(),
        type: 'welcome'
      }
      setMessages([welcomeMessage])
    }
  }, [open, assessmentResults])

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

  const renderMessage = (message) => {
    const isUser = message.sender === 'user'
    
    return (
      <Fade in={true} key={message.id} timeout={500}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            mb: 2,
            mx: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', maxWidth: '80%' }}>
            {!isUser && (
              <Avatar 
                sx={{ 
                  bgcolor: message.type === 'welcome' ? 'success.main' : 'primary.main',
                  mr: 1,
                  width: 32,
                  height: 32
                }}
              >
                {message.type === 'strategies' ? <Lightbulb /> : <Psychology />}
              </Avatar>
            )}
            
            <Paper
              elevation={1}
              sx={{
                p: 2,
                backgroundColor: isUser ? 'primary.main' : 'grey.100',
                color: isUser ? 'white' : 'text.primary',
                borderRadius: 2,
                maxWidth: '100%'
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.text}
              </Typography>
              
              {/* Show risk level indicator */}
              {!isUser && message.riskLevel && message.riskLevel !== 'low' && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    icon={<Warning />}
                    label={`${message.riskLevel} risk detected`}
                    color={message.riskLevel === 'high' ? 'error' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              )}
              
              {/* Show fallback indicator */}
              {!isUser && message.isFallback && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    label="Offline mode"
                    color="info"
                    variant="outlined"
                  />
                </Box>
              )}
              
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mt: 1, 
                  color: isUser ? 'rgba(255,255,255,0.7)' : 'text.secondary' 
                }}
              >
                {message.timestamp.toLocaleTimeString()}
              </Typography>
            </Paper>
            
            {isUser && (
              <Avatar 
                sx={{ 
                  bgcolor: 'secondary.main',
                  ml: 1,
                  width: 32,
                  height: 32
                }}
              >
                <Person />
              </Avatar>
            )}
          </Box>
        </Box>
      </Fade>
    )
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
              <Typography variant="h6">AI Mental Health Counselor</Typography>
              <Chip 
                label="ChatGPT Powered" 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ ml: 2 }}
              />
            </Box>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0 }}>
          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              py: 2,
              minHeight: '400px'
            }}
          >
            {messages.map(renderMessage)}
            
            {/* Typing Indicator */}
            {isTyping && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mx: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 1, width: 32, height: 32 }}>
                    <Psychology />
                  </Avatar>
                  <Paper elevation={1} sx={{ p: 2, backgroundColor: 'grey.100' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[0, 1, 2].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main',
                            animation: 'pulse 1.5s infinite',
                            animationDelay: `${i * 0.3}s`
                          }}
                        />
                      ))}
                    </Box>
                  </Paper>
                </Box>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <Box sx={{ px: 2, pb: 1 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Analyzing your message with ChatGPT...
              </Typography>
            </Box>
          )}

          <Divider />

          {/* Input Area */}
          <Box sx={{ p: 2 }}>
            {/* Quick Actions */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<Mood />}
                label="How am I feeling?" 
                size="small" 
                onClick={() => handleQuickAction("I'm not sure how I'm feeling right now. Can you help me understand my emotions?")}
                clickable
                color="primary"
                variant="outlined"
              />
              <Chip 
                icon={<Assessment />}
                label="Coping Strategies" 
                size="small" 
                onClick={() => handleQuickAction("What are some effective coping strategies I can use when I'm feeling overwhelmed?")}
                clickable
                color="secondary"
                variant="outlined"
              />
              {conversationContext.riskLevel !== 'low' && (
                <Chip 
                  icon={<SelfImprovement />}
                  label="Immediate Support" 
                  size="small" 
                  onClick={() => handleQuickAction("I need immediate support and coping techniques for how I'm feeling right now.")}
                  clickable
                  color="warning"
                />
              )}
            </Box>

            {/* Message Input */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind..."
                variant="outlined"
                disabled={isTyping}
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

            {/* Crisis Resources */}
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                <Typography variant="caption">
                  🆘 <strong>Crisis Resources:</strong> National Suicide Prevention Lifeline: 988 | Crisis Text Line: Text HOME to 741741
                </Typography>
              </Alert>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AIChatbot