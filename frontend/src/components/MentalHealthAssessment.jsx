import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Chip,
  Avatar,
  Divider,
  Alert
} from '@mui/material'
import {
  Close,
  Psychology,
  Send,
  AutoAwesome,
  HealthAndSafety,
  TrendingUp,
  Warning,
  CheckCircle
} from '@mui/icons-material'

const MentalHealthAssessment = ({ open, onClose }) => {
  const [currentStep, setCurrentStep] = useState('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const messagesEndRef = useRef(null)

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

  // Mood-based options for initial assessment
  const moodOptions = [
    { value: 'great', label: "😊 Great - I'm feeling really positive!", emotion: 'positive' },
    { value: 'good', label: "🙂 Good - Generally doing well", emotion: 'positive' },
    { value: 'okay', label: "😐 Okay - Just getting by", emotion: 'neutral' },
    { value: 'stressed', label: "😰 Stressed - Feeling overwhelmed", emotion: 'negative' },
    { value: 'sad', label: "😢 Sad - Feeling down lately", emotion: 'negative' },
    { value: 'anxious', label: "😟 Anxious - Worried about things", emotion: 'negative' },
    { value: 'tired', label: "😴 Tired - Emotionally drained", emotion: 'negative' }
  ]

  const answerOptions = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" }
  ]

  // Generate dynamic questions based on mood and previous answers
  const generateDynamicQuestions = (mood, prevAnswers = {}) => {
    let questions = []
    
    if (mood === 'great' || mood === 'good') {
      questions = [
        {
          id: 'positive_1',
          text: "That's wonderful to hear! What's been going well for you lately?",
          type: 'open',
          options: [
            { value: 'studies', label: "📚 My studies are going well" },
            { value: 'relationships', label: "❤️ Good relationships with friends/family" },
            { value: 'health', label: "💪 Taking care of my physical health" },
            { value: 'hobbies', label: "🎨 Enjoying my hobbies and interests" }
          ]
        },
        {
          id: 'positive_2',
          text: "How do you usually handle stress when it comes up?",
          type: 'coping',
          options: [
            { value: 'exercise', label: "🏃‍♀️ Exercise or physical activity" },
            { value: 'friends', label: "👥 Talk to friends or family" },
            { value: 'hobbies', label: "🎯 Focus on hobbies" },
            { value: 'rest', label: "😌 Take time to rest and relax" }
          ]
        }
      ]
    } else if (mood === 'okay') {
      questions = [
        {
          id: 'neutral_1',
          text: "I understand you're feeling just okay. What's making it feel like you're just getting by?",
          type: 'concern',
          options: [
            { value: 'workload', label: "📚 Heavy academic workload" },
            { value: 'uncertain', label: "🤔 Uncertain about the future" },
            { value: 'routine', label: "🔄 Stuck in routine, feeling unmotivated" },
            { value: 'social', label: "👥 Social challenges or loneliness" }
          ]
        },
        {
          id: 'sleep_check',
          text: "How has your sleep been lately?",
          type: 'phq',
          category: 'PHQ-9'
        }
      ]
    } else if (mood === 'stressed') {
      questions = [
        {
          id: 'stress_source',
          text: "I hear that you're feeling overwhelmed. What's the main source of your stress right now?",
          type: 'stress',
          options: [
            { value: 'exams', label: "📝 Upcoming exams or assignments" },
            { value: 'career', label: "💼 Career and future planning" },
            { value: 'finance', label: "💰 Financial pressures" },
            { value: 'relationships', label: "💔 Relationship issues" },
            { value: 'family', label: "🏠 Family expectations or problems" }
          ]
        },
        {
          id: 'gad1',
          text: "Over the past 2 weeks, how often have you felt nervous, anxious, or on edge?",
          type: 'gad',
          category: 'GAD-7'
        }
      ]
    } else if (mood === 'sad') {
      questions = [
        {
          id: 'sadness_trigger',
          text: "I'm sorry you're feeling down. Can you tell me what's been contributing to these sad feelings?",
          type: 'depression',
          options: [
            { value: 'loss', label: "💔 Loss or disappointment" },
            { value: 'isolation', label: "😞 Feeling isolated or lonely" },
            { value: 'failure', label: "📉 Academic struggles or failures" },
            { value: 'unclear', label: "🤷‍♂️ Not sure, just feeling low" }
          ]
        },
        {
          id: 'phq1',
          text: "Over the past 2 weeks, how often have you had little interest or pleasure in doing things?",
          type: 'phq',
          category: 'PHQ-9'
        }
      ]
    } else if (mood === 'anxious') {
      questions = [
        {
          id: 'anxiety_focus',
          text: "Anxiety can be really challenging. What are you most worried about these days?",
          type: 'anxiety',
          options: [
            { value: 'performance', label: "📊 Academic performance" },
            { value: 'social', label: "👥 Social situations" },
            { value: 'future', label: "🔮 The future and uncertainty" },
            { value: 'health', label: "🏥 Health concerns" },
            { value: 'everything', label: "🌪️ Everything feels overwhelming" }
          ]
        },
        {
          id: 'gad2',
          text: "How often have you found it difficult to stop or control worrying?",
          type: 'gad',
          category: 'GAD-7'
        }
      ]
    } else if (mood === 'tired') {
      questions = [
        {
          id: 'fatigue_source',
          text: "Emotional exhaustion is tough. What do you think is draining your energy the most?",
          type: 'fatigue',
          options: [
            { value: 'overwork', label: "💻 Working or studying too much" },
            { value: 'stress', label: "😰 Constant stress and pressure" },
            { value: 'sleep', label: "😴 Poor sleep quality" },
            { value: 'emotional', label: "💭 Dealing with emotional problems" }
          ]
        },
        {
          id: 'phq4',
          text: "Over the past 2 weeks, how often have you been feeling tired or having little energy?",
          type: 'phq',
          category: 'PHQ-9'
        }
      ]
    }

    return questions
  }

  // Add additional clinical questions based on the conversation so far
  const addDynamicClinicalQuestions = () => {
    const emotion = moodOptions.find(m => m.value === currentMood)?.emotion
    let additionalQuestions = []

    if (emotion === 'negative') {
      // Add key PHQ-9 and GAD-7 questions
      additionalQuestions = [
        {
          id: 'phq2',
          text: "Over the past 2 weeks, how often have you been feeling down, depressed, or hopeless?",
          type: 'phq',
          category: 'PHQ-9'
        },
        {
          id: 'gad3',
          text: "How often have you been worrying too much about different things?",
          type: 'gad', 
          category: 'GAD-7'
        },
        {
          id: 'phq3',
          text: "How often have you had trouble falling or staying asleep, or sleeping too much?",
          type: 'phq',
          category: 'PHQ-9'
        }
      ]
    } else if (emotion === 'neutral') {
      additionalQuestions = [
        {
          id: 'phq1',
          text: "Over the past 2 weeks, how often have you had little interest or pleasure in doing things?",
          type: 'phq',
          category: 'PHQ-9'
        },
        {
          id: 'gad4',
          text: "How often have you had trouble relaxing?",
          type: 'gad',
          category: 'GAD-7'
        }
      ]
    } else {
      // For positive moods, ask about maintaining wellbeing
      additionalQuestions = [
        {
          id: 'wellbeing_1',
          text: "Since you're feeling good, how do you maintain your positive mental health?",
          type: 'wellbeing',
          options: [
            { value: 'exercise', label: "🏃‍♀️ Regular exercise" },
            { value: 'social', label: "👥 Strong social connections" },
            { value: 'sleep', label: "😴 Good sleep habits" },
            { value: 'mindfulness', label: "🧘‍♀️ Mindfulness or meditation" }
          ]
        }
      ]
    }

    if (additionalQuestions.length > 0) {
      addMessage("Now, let me ask a few more specific questions to get a complete picture.", true)
      setDynamicQuestions(prev => [...prev, ...additionalQuestions])
      setCurrentQuestionIndex(dynamicQuestions.length)
      
      setTimeout(() => {
        addMessage(additionalQuestions[0].text, true)
      }, 2000)
    } else {
      finishConversation()
    }
  }

  const finishConversation = () => {
    addMessage("🎉 Thank you for this thoughtful conversation!", true)
    addMessage("Let me provide you with personalized insights based on our discussion...", true, 1500)
    
    setTimeout(() => {
      finishAssessment(answers)
    }, 3000)
  }

  // Start AI Guidance based on assessment results
  const startAIGuidance = (results) => {
    setAiGuidanceStep(true)
    setCurrentStep('guidance')
    setGuidanceChatMessages([])
    
    // Personalized greeting based on results
    addGuidanceMessage("👋 Hello! I'm your personalized AI Wellness Coach.", true)
    addGuidanceMessage("I've reviewed your assessment results and I'm here to provide ongoing support.", true, 1500)
    
    // Personalized approach based on scores
    const { depression, anxiety, mood } = results
    
    if (depression.severity === 'severe' || anxiety.severity === 'high') {
      addGuidanceMessage("I notice you're going through a particularly challenging time right now. 💙", true, 3000)
      addGuidanceMessage("My priority is to help you find immediate support and coping strategies.", true, 4500)
      addGuidanceMessage("Would you like me to help you with:\n\n🚨 Finding immediate professional support\n🧘 Immediate coping techniques\n📞 Crisis resources\n💬 Just someone to talk to", true, 6000)
    } else if (depression.severity === 'moderate' || anxiety.severity === 'moderate') {
      addGuidanceMessage("I can see you're dealing with some significant challenges. You're not alone in this. 🤗", true, 3000)
      addGuidanceMessage("I'm here to help you develop strategies and connect you with resources.", true, 4500)
      addGuidanceMessage("What would be most helpful for you right now?\n\n📚 Study stress management\n💤 Better sleep strategies\n🏃‍♀️ Mood-boosting activities\n👥 Connecting with counselors\n💭 Processing your feelings", true, 6000)
    } else if (depression.severity === 'mild' || anxiety.severity === 'mild') {
      addGuidanceMessage("It looks like you're managing pretty well overall, with some areas we can work on together. 😊", true, 3000)
      addGuidanceMessage("I'd love to help you build resilience and maintain your mental wellness.", true, 4500)
      addGuidanceMessage("What interests you most?\n\n📈 Building mental resilience\n⚖️ Work-life balance tips\n🎯 Academic stress management\n🌱 Personal growth activities\n🤝 Social connection strategies", true, 6000)
    } else {
      addGuidanceMessage("It's wonderful that you're feeling positive! I'm here to help you maintain and enhance your wellbeing. 🌟", true, 3000)
      addGuidanceMessage("Prevention and maintenance are just as important as treatment.", true, 4500)
      addGuidanceMessage("How can I support your continued wellness?\n\n💪 Maintaining positive habits\n🎯 Goal setting and achievement\n🧠 Building mental strength\n✨ Maximizing your potential\n🌈 Spreading positivity to others", true, 6000)
    }
  }

  // Handle AI guidance responses
  const handleGuidanceInput = (userInput) => {
    addGuidanceMessage(userInput, false)
    
    // AI generates contextual responses based on assessment results and user input
    setTimeout(() => {
      generateGuidanceResponse(userInput)
    }, 1500)
  }

  const generateGuidanceResponse = (userInput) => {
    const { depression, anxiety, mood } = assessmentResults
    
    // Context-aware responses based on assessment results
    if (userInput.includes('immediate support') || userInput.includes('crisis')) {
      addGuidanceMessage("I understand you need immediate support. Here's what I recommend right now:", true)
      addGuidanceMessage("🚨 **Immediate Resources:**\n• Your college counseling center (available today)\n• National Crisis Helpline: 988\n• Campus emergency services\n• Trusted friend or family member\n\nYou don't have to face this alone. Would you like me to help you prepare what to say when you call?", true, 2000)
    } else if (userInput.includes('coping techniques')) {
      addGuidanceMessage("Let me share some evidence-based coping techniques that can help right now:", true)
      addGuidanceMessage("🧘 **Quick Relief Techniques:**\n\n**5-4-3-2-1 Grounding:**\n• 5 things you can see\n• 4 things you can touch\n• 3 things you can hear\n• 2 things you can smell\n• 1 thing you can taste\n\n**Box Breathing:**\n• Breathe in for 4 counts\n• Hold for 4 counts\n• Exhale for 4 counts\n• Hold for 4 counts\n\nTry this now for 2 minutes. How does it feel?", true, 2000)
    } else if (userInput.includes('study stress') || userInput.includes('academic')) {
      addGuidanceMessage("Academic stress is so common among students. Let me help you with practical strategies:", true)
      addGuidanceMessage("📚 **Smart Study Strategies:**\n\n**Time Management:**\n• Pomodoro Technique (25 min focused work + 5 min break)\n• Break large tasks into smaller chunks\n• Prioritize using urgent/important matrix\n\n**Stress Reduction:**\n• Study in 90-minute blocks max\n• Take regular movement breaks\n• Create a dedicated study space\n• Practice 'good enough' vs perfectionism\n\nWhich area feels most challenging for you right now?", true, 2000)
    } else if (userInput.includes('sleep')) {
      addGuidanceMessage("Sleep is crucial for mental health. Based on your assessment, let's create a personalized sleep plan:", true)
      addGuidanceMessage("💤 **Your Personalized Sleep Strategy:**\n\n**Sleep Hygiene:**\n• Consistent bedtime (even weekends)\n• No screens 1 hour before bed\n• Cool, dark room (65-68°F)\n• No caffeine after 2 PM\n\n**Wind-Down Routine:**\n• 30 min before bed: dim lights\n• Try reading or gentle stretching\n• Journal 3 things you're grateful for\n• Progressive muscle relaxation\n\nWhat's your current bedtime routine like?", true, 2000)
    } else if (userInput.includes('activities') || userInput.includes('mood-boosting')) {
      addGuidanceMessage("Great choice! Activities can be powerful mood boosters. Let me suggest some based on your assessment:", true)
      
      if (depression.severity !== 'low') {
        addGuidanceMessage("🌈 **Gentle Mood Lifters:**\n\n**Start Small:**\n• 5-minute walk outside\n• Listen to 1 favorite song\n• Text a friend 'thinking of you'\n• Make your bed\n• Water a plant or tend to something living\n\n**Build Up:**\n• 15-minute nature walk\n• Cook a simple favorite meal\n• Watch funny videos\n• Do something creative (draw, write, craft)\n\nWhich one feels most doable for you today?", true, 2000)
      } else {
        addGuidanceMessage("🚀 **Energy-Boosting Activities:**\n\n**Physical:**\n• Dancing to music\n• Quick workout or yoga\n• Sports with friends\n• Bike ride or hike\n\n**Social:**\n• Plan coffee with a friend\n• Join a club or activity\n• Volunteer for a cause you care about\n• Study groups\n\n**Creative:**\n• Try a new hobby\n• Photography walk\n• Creative writing\n• Learn something new online\n\nWhat type of activity appeals to you most?", true, 2000)
      }
    } else if (userInput.includes('counselor') || userInput.includes('professional')) {
      addGuidanceMessage("Connecting with a counselor is a great step! Let me help you prepare:", true)
      addGuidanceMessage("👥 **Preparing for Counseling:**\n\n**What to Expect:**\n• Initial assessment session\n• Confidential and non-judgmental space\n• Collaborative treatment planning\n• Regular check-ins and adjustments\n\n**How to Prepare:**\n• Write down main concerns\n• Note when symptoms are worst/best\n• List current stressors\n• Think about your goals\n\n**At Your College:**\nMost colleges offer free counseling services. Would you like me to help you draft what to say when you call to make an appointment?", true, 2000)
    } else {
      // General supportive response
      addGuidanceMessage("I hear you. Let me provide some personalized support based on what you've shared:", true)
      addGuidanceMessage("Remember, healing isn't linear and it's okay to have difficult days. What you're feeling is valid.\n\nBased on our conversation, here are some gentle next steps:\n\n• Focus on one small self-care action today\n• Reach out to one supportive person\n• Be patient and kind with yourself\n• Remember that seeking help shows strength\n\nWhat feels most important to you right now?", true, 2000)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, guidanceChatMessages, isTyping])

  const addMessage = (text, isBot = false, delay = 0) => {
    setTimeout(() => {
      if (isBot) {
        setIsTyping(true)
        setTimeout(() => {
          setIsTyping(false)
          setChatMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text,
            isBot,
            timestamp: new Date()
          }])
        }, 1200) // Typing delay
      } else {
        setChatMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          text,
          isBot,
          timestamp: new Date()
        }])
      }
    }, delay)
  }

  const addGuidanceMessage = (text, isBot = false, delay = 0) => {
    setTimeout(() => {
      if (isBot) {
        setIsTyping(true)
        setTimeout(() => {
          setIsTyping(false)
          setGuidanceChatMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text,
            isBot,
            timestamp: new Date()
          }])
        }, 1200)
      } else {
        setGuidanceChatMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          text,
          isBot,
          timestamp: new Date()
        }])
      }
    }, delay)
  }

  const startAssessment = () => {
    setCurrentStep('assessment')
    setChatMessages([])
    setCurrentQuestionIndex(0)
    setAnswers({})
    
    addMessage("👋 Hello! I'm Dr. ZenBot, your AI mental health assistant.", true)
    addMessage("I'll guide you through a personalized mental health conversation today.", true, 1500)
    addMessage("Instead of a rigid questionnaire, I'll ask questions based on how you're feeling.", true, 3000)
    addMessage("This approach helps me understand your unique situation better.", true, 4500)
    addMessage("Let's start with something simple - how are you feeling today?", true, 6000)
    
    setTimeout(() => {
      addMessage("Please tell me about your current mood:", true)
    }, 7500)
  }

  const handleAnswer = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)

    // Handle mood selection
    if (conversationFlow === 'mood') {
      const selectedMood = moodOptions.find(opt => opt.value === value)
      addMessage(`My current mood: "${selectedMood.label}"`, false)
      setCurrentMood(value)
      
      // Generate personalized response based on mood
      const moodResponses = {
        great: "That's fantastic! It's wonderful to hear you're feeling so positive. 😊",
        good: "I'm glad to hear you're doing well! That's a great foundation. 👍",
        okay: "I understand. Sometimes we all have those 'just getting by' days. Let's explore this a bit more.",
        stressed: "I can hear that you're going through a challenging time. Stress can be really overwhelming. 💙",
        sad: "I'm sorry you're feeling down. Thank you for sharing that with me - it takes courage. 🤗",
        anxious: "Anxiety can be really difficult to deal with. You're not alone in feeling this way. 💜",
        tired: "Emotional exhaustion is very real. It sounds like you've been carrying a lot. 💛"
      }
      
      addMessage(moodResponses[value], true, 1000)
      addMessage("Let me ask you some questions to better understand your situation.", true, 2500)
      
      // Generate dynamic questions based on mood
      const questions = generateDynamicQuestions(value)
      setDynamicQuestions(questions)
      setConversationFlow('dynamic')
      setCurrentQuestionIndex(0)
      
      setTimeout(() => {
        if (questions.length > 0) {
          addMessage(questions[0].text, true)
        }
      }, 4000)
      
      return
    }

    // Handle dynamic questions
    if (conversationFlow === 'dynamic') {
      const currentQ = dynamicQuestions[currentQuestionIndex]
      
      if (currentQ.type === 'open' || currentQ.type === 'concern' || currentQ.type === 'stress' || 
          currentQ.type === 'depression' || currentQ.type === 'anxiety' || currentQ.type === 'fatigue') {
        // Handle multiple choice dynamic questions
        const selectedOption = currentQ.options.find(opt => opt.value === value)
        addMessage(`My answer: "${selectedOption.label}"`, false)
        
        const encouragements = [
          "Thank you for sharing that with me.",
          "I appreciate your honesty.",
          "That helps me understand your situation better.",
          "Thank you for being open about this."
        ]
        const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)]
        addMessage(randomEncouragement, true, 1000)
        
      } else if (currentQ.type === 'phq' || currentQ.type === 'gad') {
        // Handle clinical scale questions
        const selectedOption = answerOptions.find(opt => opt.value === value)
        addMessage(`My answer: "${selectedOption.label}"`, false)
        
        const acknowledgments = [
          "Thank you for that response.",
          "I've noted that down.",
          "Thank you for being honest."
        ]
        const randomAck = acknowledgments[Math.floor(Math.random() * acknowledgments.length)]
        addMessage(randomAck, true, 1000)
      }

      // Move to next question or finish
      if (currentQuestionIndex < dynamicQuestions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1)
          const nextQuestion = dynamicQuestions[currentQuestionIndex + 1]
          addMessage(nextQuestion.text, true)
        }, 2500)
      } else {
        // Add a few more clinical questions based on mood
        setTimeout(() => {
          addDynamicClinicalQuestions()
        }, 2500)
      }
      
      return
    }

    // Handle remaining clinical questions
    const selectedOption = answerOptions.find(opt => opt.value === value)
    addMessage(`My answer: "${selectedOption.label}"`, false)

    const acknowledgments = [
      "Thank you for that honest response.",
      "I appreciate your openness.",
      "Your answer has been recorded."
    ]
    const randomAck = acknowledgments[Math.floor(Math.random() * acknowledgments.length)]
    addMessage(randomAck, true, 1000)

    if (currentQuestionIndex < allQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1)
        const nextQuestion = allQuestions[currentQuestionIndex + 1]
        addMessage(`Over the last 2 weeks, how often have you been bothered by:\n\n"${nextQuestion.text}"`, true)
      }, 2500)
    } else {
      setTimeout(() => {
        addMessage("🎉 Thank you for completing our conversation!", true)
        addMessage("Let me analyze everything you've shared and provide personalized insights...", true, 1500)
        
        setTimeout(() => {
          finishAssessment(newAnswers)
        }, 3000)
      }, 2000)
    }
  }

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

  const generateAIResponse = (phq9Score, gad7Score) => {
    const depression = getDepressionLevel(phq9Score)
    const anxiety = getAnxietyLevel(gad7Score)

    let response = "Based on your responses, here's what I found:\n\n"
    
    // Depression analysis
    response += `**Depression Assessment (PHQ-9):**\n`
    response += `Your score: ${phq9Score}/27 - ${depression.level} depression symptoms\n\n`
    
    // Anxiety analysis  
    response += `**Anxiety Assessment (GAD-7):**\n`
    response += `Your score: ${gad7Score}/21 - ${anxiety.level} anxiety symptoms\n\n`

    // Personalized recommendations
    response += `**Personalized Recommendations:**\n\n`

    if (depression.severity === 'low' && anxiety.severity === 'low') {
      response += `🎉 Great news! Your mental health appears to be in a good place right now. Here are some ways to maintain your wellbeing:\n\n`
      response += `• Continue with regular exercise and good sleep habits\n`
      response += `• Practice gratitude and mindfulness daily\n`
      response += `• Maintain strong social connections\n`
      response += `• Consider our stress management resources for academic pressures\n`
    } else if (depression.severity === 'mild' || anxiety.severity === 'mild') {
      response += `💙 You're experiencing some mild symptoms, which is quite common among students. Here's what can help:\n\n`
      response += `• Try our 5-minute daily breathing exercises\n`
      response += `• Establish a consistent sleep schedule\n`
      response += `• Consider connecting with a counselor from your college\n`
      response += `• Use our mood tracking tools to identify patterns\n`
      response += `• Engage in regular physical activity\n`
    } else if (depression.severity === 'moderate' || anxiety.severity === 'moderate') {
      response += `🧡 You're dealing with moderate symptoms that deserve attention. I recommend:\n\n`
      response += `• Speaking with a mental health professional soon\n`
      response += `• Using our guided meditation resources daily\n`
      response += `• Connecting with counselors from your college\n`
      response += `• Consider counseling or therapy services\n`
      response += `• Reach out to trusted friends or family\n`
      response += `• Practice self-care and stress management techniques\n`
    } else {
      response += `❤️ Your responses indicate you're going through a difficult time. Please know that help is available:\n\n`
      response += `• **Immediate action recommended:** Please speak with a mental health professional\n`
      response += `• Contact your college counseling center today\n`
      response += `• Consider calling a mental health helpline\n`
      response += `• Reach out to trusted friends, family, or mentors\n`
      response += `• Remember: seeking help is a sign of strength\n\n`
      
      if (phq9Score >= 20 || answers['phq9'] >= 1) {
        response += `🚨 **Important:** If you're having thoughts of self-harm, please reach out immediately:\n`
        response += `• Emergency: Call emergency services\n`
        response += `• Crisis Helpline: Call a mental health crisis line\n`
        response += `• Campus Security: Contact your college's emergency services\n\n`
      }
    }

    response += `**Next Steps:**\n`
    response += `• Explore our Resource Hub for helpful content\n`
    response += `• Consider booking a session with a counselor\n`
    response += `• Use our daily mood tracking tools\n`
    response += `• Practice the breathing exercises in our app\n\n`
    
    response += `Remember, this assessment is not a diagnostic tool. For professional evaluation and treatment, please consult with a qualified mental health provider.`

    return response
  }

  const finishAssessment = (finalAnswers) => {
    const { phq9Score, gad7Score } = calculateScores(finalAnswers)
    
    // Store assessment results
    const results = {
      phq9Score,
      gad7Score,
      mood: currentMood,
      depression: getDepressionLevel(phq9Score),
      anxiety: getAnxietyLevel(gad7Score),
      answers: finalAnswers
    }
    setAssessmentResults(results)
    
    setTimeout(() => {
      const aiResponse = generateAIResponse(phq9Score, gad7Score)
      addMessage(aiResponse, true)
      setShowResults(true)
      
      // Transition to AI guidance after showing results
      setTimeout(() => {
        addMessage("🤖 Now, let me connect you with your personalized AI wellness coach...", true)
        addMessage("✨ Transitioning to guided support based on your assessment results.", true, 1500)
        
        setTimeout(() => {
          startAIGuidance(results)
        }, 3000)
      }, 2000)
    }, 1000)
  }

  const currentQuestion = conversationFlow === 'mood' ? 
    { text: "Please tell me about your current mood:", options: moodOptions } :
    conversationFlow === 'dynamic' ? dynamicQuestions[currentQuestionIndex] :
    allQuestions[currentQuestionIndex]

  const getCurrentOptions = () => {
    if (conversationFlow === 'mood') {
      return moodOptions
    } else if (conversationFlow === 'dynamic' && currentQuestion) {
      if (currentQuestion.options) {
        return currentQuestion.options
      } else if (currentQuestion.type === 'phq' || currentQuestion.type === 'gad') {
        return answerOptions
      }
    }
    return answerOptions
  }

  // Typing indicator component
  const TypingIndicator = () => (
    <Box sx={{
      display: 'flex',
      justifyContent: 'flex-start',
      mb: 2
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'flex-start',
        maxWidth: '80%',
        flexDirection: 'row'
      }}>
        <Avatar sx={{ 
          bgcolor: 'primary.main', 
          mr: 1, 
          mt: 0.5,
          width: 36,
          height: 36,
          fontSize: '14px'
        }}>
          🤖
        </Avatar>
        <Paper sx={{
          p: 2,
          bgcolor: 'grey.100',
          color: 'text.primary',
          borderRadius: '18px 18px 18px 4px',
          boxShadow: 1
        }}>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Dr. ZenBot is typing
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.2 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    animation: 'pulse 1.5s infinite',
                    animationDelay: `${i * 0.3}s`,
                    '@keyframes pulse': {
                      '0%, 60%, 100%': {
                        opacity: 0.3,
                        transform: 'scale(1)'
                      },
                      '30%': {
                        opacity: 1,
                        transform: 'scale(1.2)'
                      }
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  )

  const ChatMessage = ({ message }) => (
    <Box sx={{
      display: 'flex',
      justifyContent: message.isBot ? 'flex-start' : 'flex-end',
      mb: 2
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'flex-start',
        maxWidth: '85%',
        flexDirection: message.isBot ? 'row' : 'row-reverse'
      }}>
        {message.isBot && (
          <Avatar sx={{ 
            bgcolor: aiGuidanceStep ? 'secondary.main' : 'primary.main', 
            mr: 1, 
            mt: 0.5,
            width: 36,
            height: 36,
            fontSize: '14px'
          }}>
            {aiGuidanceStep ? '🧠' : '🤖'}
          </Avatar>
        )}
        {!message.isBot && (
          <Avatar sx={{ 
            bgcolor: 'info.main', 
            ml: 1, 
            mt: 0.5,
            width: 36,
            height: 36,
            fontSize: '14px'
          }}>
            👤
          </Avatar>
        )}
        <Paper sx={{
          p: 2,
          bgcolor: message.isBot ? 'grey.100' : aiGuidanceStep ? 'info.main' : 'primary.main',
          color: message.isBot ? 'text.primary' : 'white',
          whiteSpace: 'pre-line',
          borderRadius: message.isBot ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
          boxShadow: 1
        }}>
          <Typography 
            variant="body1"
            sx={{ 
              lineHeight: 1.5,
              fontSize: '0.95rem'
            }}
          >
            {message.text}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              mt: 0.5,
              opacity: 0.7,
              fontSize: '0.75rem'
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Typography>
        </Paper>
      </Box>
    </Box>
  )

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {currentStep === 'guidance' ? (
              <>
                <Psychology sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">AI Wellness Coach</Typography>
              </>
            ) : (
              <>
                <HealthAndSafety sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Mental Health Assessment</Typography>
              </>
            )}
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {currentStep === 'intro' && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
              <Psychology sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Typography variant="h5" gutterBottom>
              Know Your Mental Health
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              Take a comprehensive mental health assessment using standardized PHQ-9 and GAD-7 questionnaires.
            </Typography>

            <Box sx={{ my: 3 }}>
              <Alert severity="info" sx={{ textAlign: 'left', mb: 2 }}>
                <Typography variant="body2">
                  <strong>What you'll get:</strong>
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                  • Depression screening (PHQ-9)<br/>
                  • Anxiety screening (GAD-7)<br/>
                  • Personalized AI insights<br/>
                  • Tailored recommendations<br/>
                  • Resource suggestions
                </Typography>
              </Alert>

              <Alert severity="warning" sx={{ textAlign: 'left' }}>
                <Typography variant="body2">
                  This assessment is for educational purposes and doesn't replace professional medical advice.
                </Typography>
              </Alert>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={startAssessment}
              startIcon={<AutoAwesome />}
              sx={{ mt: 2 }}
            >
              Start Assessment
            </Button>
          </Box>
        )}

        {currentStep === 'assessment' && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Progress Bar */}
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {conversationFlow === 'mood' ? 'Getting to know you' : 
                   conversationFlow === 'dynamic' ? `Question ${currentQuestionIndex + 1} of ${dynamicQuestions.length}` :
                   `Assessment Question ${currentQuestionIndex + 1}`}
                </Typography>
                <Chip 
                  label={
                    conversationFlow === 'mood' ? 'Mood Check' :
                    currentQuestion?.category || 'Personalized'
                  } 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
              <LinearProgress 
                variant={conversationFlow === 'mood' ? 'indeterminate' : 'determinate'}
                value={
                  conversationFlow === 'dynamic' ? 
                    ((currentQuestionIndex + 1) / Math.max(dynamicQuestions.length, 1)) * 100 :
                    ((currentQuestionIndex + 1) / allQuestions.length) * 100
                } 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {/* Chat Messages */}
            <Box sx={{ 
              flexGrow: 1, 
              p: 2, 
              overflow: 'auto', 
              minHeight: 400,
              bgcolor: '#f8f9fa',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
            }}>
              {chatMessages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              
              {isTyping && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Answer Options - Fixed at bottom */}
            {currentQuestion && !showResults && !isTyping && (
              <Box sx={{ 
                p: 3, 
                bgcolor: 'white',
                borderTop: '1px solid #e0e0e0',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                  Please select your answer:
                </Typography>
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  {getCurrentOptions().map((option, index) => (
                    <Button
                      key={option.value}
                      variant="outlined"
                      size="large"
                      onClick={() => handleAnswer(
                        conversationFlow === 'mood' ? 'mood' : 
                        currentQuestion.id, 
                        option.value
                      )}
                      sx={{ 
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        py: 2,
                        px: 3,
                        bgcolor: 'white',
                        border: '2px solid #e0e0e0',
                        borderRadius: 2,
                        '&:hover': { 
                          bgcolor: 'primary.main',
                          color: 'white',
                          borderColor: 'primary.main',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                      startIcon={
                        <Box sx={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: '50%', 
                          border: '2px solid currentColor',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 'bold'
                        }}>
                          {index}
                        </Box>
                      }
                    >
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {option.label}
                      </Typography>
                    </Button>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {currentStep === 'guidance' && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* AI Guidance Header */}
            <Box sx={{ p: 2, bgcolor: 'secondary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'white', color: 'secondary.main', mr: 2 }}>
                  🧠
                </Avatar>
                <Box>
                  <Typography variant="h6">AI Wellness Coach</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Personalized guidance based on your assessment
                  </Typography>
                </Box>
              </Box>
              {assessmentResults && (
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Chip 
                    label={`Depression: ${assessmentResults.depression.level}`}
                    size="small"
                    sx={{ 
                      bgcolor: 'white', 
                      color: 'secondary.main',
                      fontWeight: 'bold'
                    }}
                  />
                  <Chip 
                    label={`Anxiety: ${assessmentResults.anxiety.level}`}
                    size="small"
                    sx={{ 
                      bgcolor: 'white', 
                      color: 'secondary.main',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Guidance Chat Messages */}
            <Box sx={{ 
              flexGrow: 1, 
              p: 2, 
              overflow: 'auto', 
              minHeight: 400,
              bgcolor: '#f0f8ff',
              background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)'
            }}>
              {guidanceChatMessages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              
              {isTyping && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Text Input for Free-form Conversation */}
            <Box sx={{ 
              p: 3, 
              bgcolor: 'white',
              borderTop: '1px solid #e0e0e0',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                Share your thoughts or ask me anything:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => handleGuidanceInput("I need immediate support")}
                  sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                >
                  🚨 Need Support
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleGuidanceInput("Tell me about coping techniques")}
                  sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                >
                  🧘 Coping Tips
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleGuidanceInput("Help with study stress")}
                  sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                >
                  📚 Study Help
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleGuidanceInput("I want to talk to a counselor")}
                  sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                >
                  👥 Find Counselor
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default MentalHealthAssessment