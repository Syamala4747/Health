import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Slide,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  Divider
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
  Lightbulb,
  Mood
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />
})

export default function AdaptiveAIChat({ open, onClose, assessmentResults, userAssessmentData }) {
  const { user } = useAuth()
  const theme = useTheme()
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [aiPersonality, setAiPersonality] = useState('supportive')
  const messagesEndRef = useRef(null)

  // Initialize AI personality and greeting based on assessment results
  useEffect(() => {
    if (assessmentResults || userAssessmentData) {
      const results = assessmentResults || userAssessmentData
      const personality = determineAIPersonality(results)
      setAiPersonality(personality)
      
      // Set initial greeting based on mood and assessment
      const greeting = generatePersonalizedGreeting(results, personality)
      setMessages([{
        text: greeting,
        sender: 'ai',
        timestamp: new Date(),
        personality: personality,
        mood: results.moodPercentages?.dominantMood?.mood || 'neutral'
      }])
    }
  }, [assessmentResults, userAssessmentData, open])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const determineAIPersonality = (results) => {
    if (!results) return 'supportive'
    
    const wellnessScore = results.wellnessScore || results.percentage || 75
    const dominantMood = results.moodPercentages?.dominantMood?.mood || 'neutral'
    
    // Determine personality based on wellness score and dominant mood
    if (wellnessScore >= 80 && ['happy', 'calm'].includes(dominantMood)) {
      return 'encouraging'
    } else if (wellnessScore >= 60 && !['depressed', 'anxious'].includes(dominantMood)) {
      return 'supportive'
    } else if (wellnessScore >= 40 || ['sad', 'stressed'].includes(dominantMood)) {
      return 'gentle'
    } else if (wellnessScore >= 20 || ['anxious', 'depressed'].includes(dominantMood)) {
      return 'caring'
    } else {
      return 'crisis'
    }
  }

  const generatePersonalizedGreeting = (results, personality) => {
    const dominantMood = results.moodPercentages?.dominantMood?.mood || 'neutral'
    const wellnessScore = results.wellnessScore || results.percentage || 75
    const moodEmoji = getMoodEmoji(dominantMood)
    
    const greetings = {
      encouraging: `Hello! ${moodEmoji} I can see from your assessment that you're in a pretty good place mentally (${wellnessScore}% wellness score)! That's wonderful to see. I'm here to help you maintain and even improve this positive momentum. What would you like to talk about today?`,
      
      supportive: `Hi there! 😊 Thanks for sharing your assessment results with me. I can see you're experiencing some ${dominantMood} feelings, and your wellness score is ${wellnessScore}%. I'm here to provide support and help you work through whatever is on your mind. How are you feeling right now?`,
      
      gentle: `Hello, and thank you for trusting me with your assessment results. 💙 I understand you might be going through some challenging times, especially with feeling ${dominantMood}. Your wellness score of ${wellnessScore}% shows you're dealing with quite a bit. Please know that I'm here to listen and support you at whatever pace feels comfortable. What would you like to share?`,
      
      caring: `Hi there. I'm really glad you're reaching out. 🤗 Your recent assessment shows you're experiencing significant ${dominantMood} feelings, and I can see your wellness score is ${wellnessScore}%. I want you to know that what you're feeling is valid, and you're showing real strength by seeking support. I'm here to help you through this. How can I support you today?`,
      
      crisis: `Hello, I'm very concerned about your wellbeing based on your assessment results. 🆘 Your wellness score of ${wellnessScore}% and the ${dominantMood} feelings you're experiencing indicate you may need immediate support. While I'm here to help, I also want to make sure you have access to professional resources. Are you in a safe place right now?`
    }
    
    return greetings[personality] || greetings.supportive
  }

  const getMoodEmoji = (mood) => {
    const emojis = {
      happy: '😊',
      calm: '😌',
      sad: '😔',
      stressed: '😰', 
      anxious: '😟',
      depressed: '😞',
      neutral: '😐'
    }
    return emojis[mood] || '😊'
  }

  const generateAIResponse = async (userMessage) => {
    const results = assessmentResults || userAssessmentData
    const dominantMood = results?.moodPercentages?.dominantMood?.mood || 'neutral'
    const wellnessScore = results?.wellnessScore || results?.percentage || 75
    
    // Analyze user message for emotional content
    const messageAnalysis = analyzeMessage(userMessage)
    
    // Generate contextual response based on personality and user state
    const response = await generateContextualResponse(
      userMessage, 
      aiPersonality, 
      dominantMood, 
      wellnessScore,
      messageAnalysis,
      messages
    )
    
    return response
  }

  const analyzeMessage = (message) => {
    const lowerMessage = message.toLowerCase()
    
    // Detect emotional keywords
    const emotionalCues = {
      positive: ['happy', 'good', 'great', 'excited', 'wonderful', 'amazing', 'love'],
      negative: ['sad', 'depressed', 'awful', 'terrible', 'hate', 'hopeless', 'worthless'],
      anxious: ['worried', 'anxious', 'nervous', 'scared', 'panic', 'overwhelmed'],
      crisis: ['hurt myself', 'end it', 'can\'t go on', 'suicide', 'die', 'give up']
    }
    
    let detectedMood = 'neutral'
    let urgency = 'low'
    
    for (const [mood, keywords] of Object.entries(emotionalCues)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        detectedMood = mood
        if (mood === 'crisis') urgency = 'high'
        else if (mood === 'negative' || mood === 'anxious') urgency = 'medium'
        break
      }
    }
    
    return { detectedMood, urgency, length: message.length }
  }

  const generateContextualResponse = async (userMessage, personality, dominantMood, wellnessScore, analysis, chatHistory) => {
    // This would typically call an AI API, but for now we'll use rule-based responses
    
    const responses = {
      encouraging: {
        positive: [
          "That's fantastic to hear! 🌟 It sounds like you're maintaining that positive energy from your assessment. What's been helping you stay in such a good headspace?",
          "I love your positive outlook! Your ${wellnessScore}% wellness score really shows in your attitude. Tell me more about what's going well for you.",
          "This is wonderful! It's great to see someone who's thriving. What goals are you working towards?"
        ],
        neutral: [
          "Thanks for sharing that with me. With your ${wellnessScore}% wellness score, you're in a good position to tackle whatever comes your way. What's on your mind?",
          "I appreciate you opening up. How can I help you maintain or build on the positive momentum you've been showing?",
          "What you're sharing resonates with your overall positive assessment results. What would you like to explore further?"
        ],
        negative: [
          "I hear that things aren't feeling as positive right now, even though your overall wellness has been good at ${wellnessScore}%. That's completely normal - we all have ups and downs. What's changed recently?",
          "It sounds like you're experiencing some challenging feelings. Your strong foundation (shown in your ${wellnessScore}% score) will help you work through this. Tell me more.",
          "I appreciate you sharing this with me. Even with your generally positive outlook, it's important to acknowledge when things feel difficult. What support do you need?"
        ]
      },
      
      supportive: {
        positive: [
          "I'm so glad to hear something positive! 😊 Your ${dominantMood} feelings from the assessment suggested you might be working through some things, so it's wonderful to hear about bright spots. What's been helping?",
          "That's really encouraging! Even while dealing with some ${dominantMood} feelings, you're finding positive moments. That shows real resilience.",
          "Thank you for sharing something good with me. How can we build on this positive experience?"
        ],
        neutral: [
          "I understand. With your wellness score at ${wellnessScore}% and some ${dominantMood} feelings, it makes sense that things might feel mixed right now. What's the most important thing on your mind?",
          "Thanks for being open with me. Given what you shared in your assessment about feeling ${dominantMood}, how are you taking care of yourself?",
          "I'm here to listen. Your assessment showed some areas we could work on together. What feels most urgent for you today?"
        ],
        negative: [
          "I can hear that you're struggling right now. Your assessment already showed you were dealing with ${dominantMood} feelings, and it sounds like that's continuing. You're not alone in this. What's been the hardest part?",
          "Thank you for trusting me with this. I know sharing difficult feelings isn't easy, especially when you're already dealing with ${dominantMood} moods. What kind of support would help most right now?",
          "I'm really glad you're reaching out about this. Your ${wellnessScore}% wellness score and ${dominantMood} feelings suggest you could use some extra support. Let's work through this together."
        ]
      },
      
      gentle: {
        positive: [
          "I'm so grateful you shared something positive with me. 💙 Given that your assessment showed you're experiencing ${dominantMood} feelings and a ${wellnessScore}% wellness score, these bright moments are really precious. Tell me more about what brought this good feeling.",
          "This is beautiful to hear. Even when we're going through difficult times (like the ${dominantMood} feelings you mentioned), these positive experiences remind us of our strength. What made this possible?",
          "Thank you for sharing this light with me. How can we nurture more of these positive moments while you're working through the ${dominantMood} feelings?"
        ],
        neutral: [
          "I'm listening, and I want you to know there's no pressure to feel any particular way. Your assessment showed you're dealing with ${dominantMood} feelings at a ${wellnessScore}% wellness level, so wherever you are today is okay. What feels most important to talk about?",
          "Thank you for being here with me. I know it takes courage to reach out, especially when you're experiencing ${dominantMood} feelings. What's on your heart today?",
          "I'm honored that you're sharing your time with me. Given what you're working through (${dominantMood} feelings, ${wellnessScore}% wellness), what would feel most supportive right now?"
        ],
        negative: [
          "I hear you, and I want you to know that what you're feeling is completely valid. Your assessment already showed you were dealing with ${dominantMood} feelings and some challenges (${wellnessScore}% wellness score), so this makes complete sense. You don't have to carry this alone. What's feeling heaviest right now?",
          "Thank you for trusting me with these difficult feelings. I know you're already dealing with a lot (${dominantMood} mood, ${wellnessScore}% wellness), and it takes courage to keep sharing. I'm here with you. What do you need most in this moment?",
          "I'm really glad you're not keeping this inside. The ${dominantMood} feelings and challenges you shared in your assessment are real, and what you're experiencing now matters too. Let's take this one step at a time. What feels most urgent?"
        ]
      },
      
      caring: {
        crisis: [
          "I'm very concerned about what you're sharing, and I want you to know that your safety is the most important thing right now. Given your assessment results showing ${dominantMood} feelings and ${wellnessScore}% wellness, I think you need immediate professional support. Can you please contact:\n\n🆘 National Suicide Prevention Lifeline: 988\n📱 Crisis Text Line: Text HOME to 741741\n🚨 Emergency Services: 911\n\nAre you in a safe place right now?"
        ],
        negative: [
          "I can see you're in significant pain right now. Your assessment already showed you were struggling with ${dominantMood} feelings and a ${wellnessScore}% wellness score, and what you're sharing now shows how much you're hurting. I'm very concerned about you, and I think professional support could be really helpful. Have you considered reaching out to a counselor or therapist?",
          "Thank you for sharing something so difficult with me. The ${dominantMood} feelings and low wellness score (${wellnessScore}%) from your assessment, combined with what you're telling me now, shows you're dealing with a lot of pain. You deserve support beyond what I can provide. Can we talk about professional resources that might help?",
          "I'm really worried about you. Your assessment showed significant ${dominantMood} feelings and challenges (${wellnessScore}% wellness), and what you're sharing now suggests you need more support than I can give. I care about your wellbeing - have you talked to anyone professionally about how you're feeling?"
        ]
      },
      
      crisis: {
        crisis: [
          "🆘 IMMEDIATE HELP NEEDED 🆘\n\nI'm extremely concerned about your safety. Your assessment showed severe concerns (${wellnessScore}% wellness, ${dominantMood} feelings), and what you're sharing now indicates you may be in crisis.\n\nPLEASE CONTACT IMMEDIATELY:\n📞 National Suicide Prevention Lifeline: 988\n📱 Crisis Text Line: Text HOME to 741741\n🚨 Emergency Services: 911\n🏥 Go to nearest emergency room\n\nAre you safe right now? Do you have someone who can be with you?"
        ]
      }
    }
    
    // Select appropriate response based on personality and detected mood
    const personalityResponses = responses[personality] || responses.supportive
    const moodResponses = personalityResponses[analysis.detectedMood] || personalityResponses.neutral || personalityResponses.positive
    
    if (!moodResponses || moodResponses.length === 0) {
      return "I'm here to listen and support you. Can you tell me more about how you're feeling right now?"
    }
    
    // Select random response and replace variables
    const randomResponse = moodResponses[Math.floor(Math.random() * moodResponses.length)]
    return randomResponse
      .replace(/\$\{wellnessScore\}/g, wellnessScore)
      .replace(/\$\{dominantMood\}/g, dominantMood)
  }

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return

    const userMessage = {
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      // Simulate AI thinking time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      const aiResponse = await generateAIResponse(inputValue)
      
      const aiMessage = {
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        personality: aiPersonality
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error generating AI response:', error)
      setMessages(prev => [...prev, {
        text: "I'm sorry, I'm having trouble responding right now. Your feelings are important - please don't hesitate to reach out to a human counselor if you need immediate support.",
        sender: 'ai',
        timestamp: new Date(),
        personality: aiPersonality,
        isError: true
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const getPersonalityColor = (personality) => {
    const colors = {
      encouraging: '#4caf50',
      supportive: '#2196f3',
      gentle: '#9c27b0',
      caring: '#ff9800',
      crisis: '#f44336'
    }
    return colors[personality] || '#2196f3'
  }

  const getPersonalityLabel = (personality) => {
    const labels = {
      encouraging: 'Encouraging Mode',
      supportive: 'Supportive Mode',
      gentle: 'Gentle Mode',
      caring: 'Caring Mode',
      crisis: 'Crisis Support Mode'
    }
    return labels[personality] || 'AI Counselor'
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: { height: '80vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
        background: `linear-gradient(135deg, ${getPersonalityColor(aiPersonality)}15, ${getPersonalityColor(aiPersonality)}05)`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: getPersonalityColor(aiPersonality) }}>
            <Psychology />
          </Avatar>
          <Box>
            <Typography variant="h6">
              AI Mental Health Counselor
            </Typography>
            <Chip 
              label={getPersonalityLabel(aiPersonality)}
              size="small"
              sx={{ 
                backgroundColor: getPersonalityColor(aiPersonality),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>
        </Box>
        
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
        {/* Assessment Summary */}
        {(assessmentResults || userAssessmentData) && (
          <Box sx={{ p: 2, backgroundColor: alpha(getPersonalityColor(aiPersonality), 0.1), borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Session Context: Wellness Score {(assessmentResults || userAssessmentData)?.wellnessScore || (assessmentResults || userAssessmentData)?.percentage}% • 
              Dominant Mood: {(assessmentResults || userAssessmentData)?.moodPercentages?.dominantMood?.mood || 'Unknown'} • 
              AI Mode: {getPersonalityLabel(aiPersonality)}
            </Typography>
          </Box>
        )}

        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  backgroundColor: message.sender === 'user' 
                    ? 'primary.main' 
                    : message.isError 
                      ? 'error.light'
                      : alpha(getPersonalityColor(aiPersonality), 0.1),
                  color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary'
                }}
              >
                {message.sender === 'ai' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Psychology sx={{ fontSize: 16, mr: 1, color: getPersonalityColor(aiPersonality) }} />
                    <Typography variant="caption" sx={{ color: getPersonalityColor(aiPersonality), fontWeight: 'bold' }}>
                      AI Counselor
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.text}
                </Typography>
                
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          ))}
          
          {isTyping && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Paper sx={{ p: 2, backgroundColor: alpha(getPersonalityColor(aiPersonality), 0.1) }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology sx={{ fontSize: 16, color: getPersonalityColor(aiPersonality) }} />
                  <Typography variant="body2">AI is thinking...</Typography>
                  <CircularProgress size={16} />
                </Box>
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              disabled={isTyping}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={isTyping || inputValue.trim() === ''}
              sx={{ 
                minWidth: 'auto',
                backgroundColor: getPersonalityColor(aiPersonality),
                '&:hover': {
                  backgroundColor: alpha(getPersonalityColor(aiPersonality), 0.8)
                }
              }}
            >
              <Send />
            </Button>
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            This AI is trained on your assessment results. For crisis situations, please contact 988 or emergency services.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  )
}