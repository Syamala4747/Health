import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  CircularProgress,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider
} from '@mui/material'
import {
  Psychology,
  Close,
  Send,
  Help,
  Lightbulb,
  School,
  Mood,
  Assignment,
  VideoCall,
  MenuBook,
  ArrowForward,
  CheckCircle,
  Info,
  Warning,
  Phone,
  Support,
  QuestionAnswer
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export default function AIStudentGuide() {
  const { user } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [showFullGuide, setShowFullGuide] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [userMessage, setUserMessage] = useState('')
  const [conversation, setConversation] = useState([])
  const [loading, setLoading] = useState(false)
  const [assessmentData, setAssessmentData] = useState(null)
  const [guideMode, setGuideMode] = useState('chat') // 'chat', 'onboarding', 'contextual', 'crisis'

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setAssessmentData(userData.lastAssessment || null)
          
          // Check if user is new (no assessment) and show onboarding
          if (!userData.lastAssessment && !userData.hasCompletedOnboarding) {
            setGuideMode('onboarding')
            setShowFullGuide(true)
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [user])

  // Contextual help based on current page
  useEffect(() => {
    const getContextualHelp = () => {
      const path = location.pathname
      let contextualMessage = ""

      if (path.includes('/student/assessment')) {
        contextualMessage = "I see you're taking an assessment! This helps me understand how to best support you. Take your time and answer honestly."
      } else if (path.includes('/student/chat')) {
        contextualMessage = "Great choice starting a chat! I'm here to listen and provide support based on your wellness level."
      } else if (path.includes('/student/resources')) {
        contextualMessage = "Exploring resources is a wonderful step! I can help you find exactly what you need."
      } else if (path === '/student' || path === '/student/') {
        contextualMessage = "Welcome to your dashboard! I can help you navigate and explain any features you'd like to learn about."
      }

      if (contextualMessage && conversation.length === 0) {
        setConversation([{
          type: 'ai',
          message: contextualMessage,
          timestamp: new Date()
        }])
      }
    }

    getContextualHelp()
  }, [location.pathname])

  const onboardingSteps = [
    {
      label: 'Welcome to ZenCare',
      content: {
        title: 'Your Mental Wellness Journey Starts Here! 🌟',
        description: 'I\'m your AI guide, and I\'m here to help you navigate this platform and support your mental wellness.',
        tips: [
          'Everything here is confidential and secure',
          'I adapt my responses based on your needs',
          'You can talk to me anytime for guidance'
        ]
      }
    },
    {
      label: 'Take Your First Assessment',
      content: {
        title: 'Let\'s Understand Your Wellness Level 📊',
        description: 'Taking an assessment helps me personalize your experience and provide better support.',
        tips: [
          'It takes just 5-10 minutes',
          'Your answers help me understand how to talk with you',
          'Results are private and only used to help you'
        ],
        action: {
          text: 'Take Assessment Now',
          onClick: () => window.location.href = '/student/assessment'
        }
      }
    },
    {
      label: 'Explore Your Options',
      content: {
        title: 'Multiple Ways to Get Support 💙',
        description: 'You have several options for getting help and support.',
        options: [
          { icon: <Psychology />, title: 'AI Counselor', desc: 'Chat with me anytime for immediate support' },
          { icon: <VideoCall />, title: 'Human Counselor', desc: 'Book sessions with professional counselors' },
          { icon: <MenuBook />, title: 'Resources', desc: 'Access articles, videos, and tools' }
        ]
      }
    },
    {
      label: 'You\'re All Set!',
      content: {
        title: 'Ready to Begin Your Wellness Journey! 🚀',
        description: 'You now know how to use the platform. Remember, I\'m always here if you need help!',
        tips: [
          'Click the AI Guide button anytime for help',
          'I\'ll provide contextual assistance as you navigate',
          'Your privacy and wellbeing are my top priorities'
        ]
      }
    }
  ]

  const getAIPersonality = () => {
    if (!assessmentData) {
      return {
        tone: 'welcoming',
        greeting: "Hi! I'm your AI guide 🤖 I'm here to help you navigate ZenCare and support your wellness journey. What can I help you with?",
        style: 'encouraging'
      }
    }

    const severity = assessmentData.severity
    switch (severity) {
      case 'minimal':
        return {
          tone: 'enthusiastic',
          greeting: "Hello there! 🌟 You're doing great with your wellness! I'm here to help you explore everything ZenCare offers.",
          style: 'celebratory'
        }
      case 'mild':
        return {
          tone: 'supportive',
          greeting: "Hi! 😊 I'm your AI guide and I'm here to support you. How can I help you today?",
          style: 'encouraging'
        }
      case 'moderate':
        return {
          tone: 'gentle',
          greeting: "Hello, I'm glad you're here. 💙 I'm your AI guide and I want to help you feel supported. What would you like to know?",
          style: 'caring'
        }
      case 'moderately_severe':
        return {
          tone: 'caring',
          greeting: "Hi, I'm really glad you're reaching out. 🤗 I'm here to help guide you to the right support. How can I assist you?",
          style: 'compassionate'
        }
      case 'severe':
        return {
          tone: 'crisis-aware',
          greeting: "Hello, I'm your AI guide and I want to help you find the support you need. 🆘 Let's work together to get you connected with the right resources.",
          style: 'urgent-care'
        }
      default:
        return {
          tone: 'supportive',
          greeting: "Hi! I'm your AI guide. How can I help you today?",
          style: 'neutral'
        }
    }
  }

  const getGuidanceTopics = () => {
    const topics = [
      { id: 'navigation', title: 'How to Navigate the Platform', icon: <School /> },
      { id: 'assessment', title: 'Understanding Assessments', icon: <Assignment /> },
      { id: 'chat', title: 'Using AI Counselor', icon: <Psychology /> },
      { id: 'counselor', title: 'Booking Human Counselors', icon: <VideoCall /> },
      { id: 'resources', title: 'Finding Resources', icon: <MenuBook /> },
      { id: 'wellness', title: 'Understanding Wellness Scores', icon: <Mood /> },
      { id: 'privacy', title: 'Privacy & Confidentiality', icon: <Info /> },
    ]

    // Add crisis topic if assessment shows concerning results
    if (assessmentData?.severity === 'severe' || assessmentData?.severity === 'moderately_severe') {
      topics.unshift({
        id: 'crisis',
        title: 'Getting Immediate Help',
        icon: <Phone />,
        urgent: true
      })
    }

    return topics
  }

  const handleTopicClick = (topicId) => {
    const responses = {
      navigation: "The platform has several main sections:\n\n🏠 **Dashboard** - Your home with wellness score and quick actions\n📊 **Assessment** - Take mental health screenings\n🤖 **AI Counselor** - Chat with me for support\n👥 **Human Counselor** - Book professional sessions\n📚 **Resources** - Articles, videos, and tools\n\nWhere would you like to start?",
      
      assessment: "Assessments help me understand how to best support you:\n\n📝 **PHQ-9** - Measures depression symptoms\n😰 **GAD-7** - Measures anxiety symptoms\n📊 **Wellness Score** - Overall mental health percentage\n\nYour results help me:\n✓ Adapt my conversation style\n✓ Suggest relevant resources\n✓ Know when to recommend professional help\n\nWould you like to take an assessment now?",
      
      chat: "I'm your AI counselor and I adapt to your needs:\n\n🎯 **Personalized** - I adjust based on your assessment results\n🔒 **Confidential** - Our conversations are private\n⏰ **24/7 Available** - I'm here whenever you need support\n💡 **Resource Suggestions** - I can recommend helpful materials\n\nTry asking me about feelings, stress, goals, or anything on your mind!",
      
      counselor: "Human counselors provide professional support:\n\n👨‍⚕️ **Licensed Professionals** - Trained mental health experts\n📅 **Easy Booking** - Schedule sessions that fit your schedule\n💬 **Video/Voice Sessions** - Choose your comfort level\n🎯 **Specialized Care** - Counselors with different expertise\n\nShall I help you find and book a counselor?",
      
      resources: "Our resource library has everything you need:\n\n📖 **Articles** - Mental health education and tips\n🎥 **Videos** - Guided meditations and exercises\n🛠️ **Tools** - Mood trackers, breathing exercises\n📱 **Apps** - Recommended mental health apps\n\nWhat type of resource interests you most?",
      
      wellness: "Your wellness score shows your mental health status:\n\n🟢 **80-100%** - Excellent wellness\n🔵 **60-79%** - Good with some areas to watch\n🟡 **40-59%** - Moderate concerns\n🟠 **20-39%** - Significant concerns\n🔴 **0-19%** - Serious concerns, seek help\n\nYour score helps me understand how to support you better!",
      
      privacy: "Your privacy is completely protected:\n\n🔒 **Encrypted Data** - All information is secure\n👤 **Anonymous Options** - You control what you share\n🚫 **No Sharing** - We never share your personal data\n📱 **Your Control** - You can delete data anytime\n\nYou're safe to share openly with me!",
      
      crisis: "🆘 **If you're in immediate danger, please contact:**\n\n📞 **Emergency Services**: 911\n☎️ **Crisis Hotline**: 988 (Suicide & Crisis Lifeline)\n💬 **Crisis Text**: Text HOME to 741741\n🏥 **Emergency Room**: Go to nearest hospital\n\nI'm here to support you, but please reach out to professionals for immediate help. Would you like me to help you find local resources?"
    }

    const response = responses[topicId] || "I can help you with that! What specific questions do you have?"
    
    setConversation(prev => [...prev, {
      type: 'ai',
      message: response,
      timestamp: new Date()
    }])
  }

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return

    const newMessage = {
      type: 'user',
      message: userMessage,
      timestamp: new Date()
    }

    setConversation(prev => [...prev, newMessage])
    setUserMessage('')
    setLoading(true)

    // Simulate AI response (in real app, this would call your AI service)
    setTimeout(() => {
      const aiPersonality = getAIPersonality()
      let response = ""

      // Simple keyword-based responses (you can enhance this with your AI service)
      const message = userMessage.toLowerCase()
      
      if (message.includes('help') || message.includes('stuck')) {
        response = `${aiPersonality.greeting}\n\nI'm here to help! You can:\n• Ask me about any platform features\n• Get guidance on assessments\n• Learn about wellness resources\n• Just chat about how you're feeling\n\nWhat would you like to know more about?`
      } else if (message.includes('assessment') || message.includes('test')) {
        response = "Assessments are a great way to understand your mental wellness! They help me provide better support tailored to your needs. Would you like me to guide you through taking one?"
      } else if (message.includes('counselor') || message.includes('therapist')) {
        response = "Both AI and human counselors can help! I'm available 24/7 for immediate support, while human counselors provide professional therapy sessions. Which would you prefer to learn about?"
      } else if (message.includes('sad') || message.includes('depressed') || message.includes('down')) {
        if (assessmentData?.severity === 'severe') {
          response = "I'm really concerned about how you're feeling. It's important to get professional help. Would you like me to help you find crisis resources or connect with a counselor immediately?"
        } else {
          response = "I hear that you're going through a difficult time. It's brave of you to reach out. Would you like to talk about what's making you feel this way, or would you prefer me to suggest some resources that might help?"
        }
      } else if (message.includes('anxious') || message.includes('worried') || message.includes('stress')) {
        response = "Anxiety and stress are very common, and there are many ways to manage them. Would you like me to guide you through some breathing exercises, suggest resources, or help you understand more about anxiety?"
      } else {
        response = `I understand you're saying: "${userMessage}"\n\nI'm here to support you in any way I can. Whether you need help navigating the platform, want to talk about feelings, or need resources - just let me know what would be most helpful right now.`
      }

      setConversation(prev => [...prev, {
        type: 'ai',
        message: response,
        timestamp: new Date()
      }])
      setLoading(false)
    }, 1500)
  }

  const renderOnboardingGuide = () => (
    <Dialog
      open={showFullGuide}
      onClose={() => setShowFullGuide(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology color="primary" />
        AI Student Guide
        <IconButton
          onClick={() => setShowFullGuide(false)}
          sx={{ ml: 'auto' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {onboardingSteps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <Typography variant="h6" gutterBottom>
                  {step.content.title}
                </Typography>
                <Typography variant="body1" paragraph>
                  {step.content.description}
                </Typography>
                
                {step.content.tips && (
                  <List dense>
                    {step.content.tips.map((tip, tipIndex) => (
                      <ListItem key={tipIndex}>
                        <ListItemIcon>
                          <CheckCircle color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={tip} />
                      </ListItem>
                    ))}
                  </List>
                )}

                {step.content.options && (
                  <Box sx={{ my: 2 }}>
                    {step.content.options.map((option, optIndex) => (
                      <Card key={optIndex} sx={{ mb: 1 }}>
                        <CardContent sx={{ py: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {option.icon}
                            <Box>
                              <Typography variant="subtitle2">{option.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {option.desc}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}

                <Box sx={{ mb: 2 }}>
                  <div>
                    {step.content.action && (
                      <Button
                        variant="contained"
                        onClick={step.content.action.onClick}
                        sx={{ mr: 1, mb: 1 }}
                      >
                        {step.content.action.text}
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(activeStep + 1)}
                      disabled={activeStep === onboardingSteps.length - 1}
                      sx={{ mr: 1, mb: 1 }}
                    >
                      {activeStep === onboardingSteps.length - 1 ? 'Finish' : 'Next'}
                    </Button>
                    <Button
                      disabled={activeStep === 0}
                      onClick={() => setActiveStep(activeStep - 1)}
                      sx={{ mb: 1 }}
                    >
                      Back
                    </Button>
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
    </Dialog>
  )

  const renderChatInterface = () => (
    <Collapse in={isOpen}>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 100,
          right: 20,
          width: 400,
          maxHeight: 600,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1300
        }}
      >
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <Psychology />
              </Avatar>
              <Box>
                <Typography variant="h6">AI Student Guide</Typography>
                <Typography variant="caption">
                  {assessmentData ? `Wellness: ${assessmentData.percentage}%` : 'Ready to help!'}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Quick Action Topics */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>Quick Help Topics:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {getGuidanceTopics().slice(0, 4).map((topic) => (
              <Chip
                key={topic.id}
                icon={topic.icon}
                label={topic.title}
                onClick={() => handleTopicClick(topic.id)}
                size="small"
                color={topic.urgent ? 'error' : 'primary'}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* Conversation */}
        <Box sx={{ 
          flexGrow: 1, 
          maxHeight: 300, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          {conversation.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
              <Psychology sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2">
                {getAIPersonality().greeting}
              </Typography>
            </Box>
          )}
          
          {conversation.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: '80%',
                  bgcolor: msg.type === 'user' ? 'primary.main' : 'grey.100',
                  color: msg.type === 'user' ? 'white' : 'text.primary'
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {msg.message}
                </Typography>
              </Paper>
            </Box>
          ))}
          
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'grey.200', width: 32, height: 32 }}>
                <Psychology fontSize="small" />
              </Avatar>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                AI is thinking...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Ask me anything about ZenCare..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              size="small"
            />
            <IconButton 
              onClick={handleSendMessage}
              disabled={!userMessage.trim() || loading}
              color="primary"
            >
              <Send />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Collapse>
  )

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1300
        }}
      >
        {isOpen ? <Close /> : <Psychology />}
      </Fab>

      {/* Chat Interface */}
      {renderChatInterface()}

      {/* Onboarding Guide */}
      {renderOnboardingGuide()}

      {/* Emergency Alert for Crisis Situations */}
      {assessmentData?.severity === 'severe' && (
        <Alert 
          severity="error" 
          sx={{ 
            position: 'fixed', 
            top: 20, 
            left: 20, 
            right: 20, 
            zIndex: 1300,
            maxWidth: 600,
            mx: 'auto'
          }}
          action={
            <Button color="inherit" size="small" onClick={() => handleTopicClick('crisis')}>
              Get Help Now
            </Button>
          }
        >
          <strong>Emergency Support Available:</strong> If you're in crisis, immediate help is available 24/7.
        </Alert>
      )}
    </>
  )
}