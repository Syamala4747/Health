/**
 * AI Personality Engine
 * Adapts AI counselor behavior based on student's assessment results
 */

export class AIPersonalityEngine {
  constructor() {
    this.personalities = {
      encouraging: {
        tone: 'upbeat',
        greeting: "Hi there! 🌟 You're doing amazing! How can I help brighten your day even more?",
        responseStyle: 'positive reinforcement',
        topics: ['achievements', 'goals', 'positive activities', 'gratitude'],
        vocabulary: ['wonderful', 'fantastic', 'amazing', 'brilliant', 'excellent'],
        empathy: 'celebratory',
        suggestions: 'growth-oriented'
      },
      supportive: {
        tone: 'warm',
        greeting: "Hello! 😊 I'm here to support you. What's on your mind today?",
        responseStyle: 'gentle guidance',
        topics: ['daily life', 'mild concerns', 'stress management', 'routine'],
        vocabulary: ['understand', 'support', 'helpful', 'together', 'care'],
        empathy: 'understanding',
        suggestions: 'practical'
      },
      gentle: {
        tone: 'soft',
        greeting: "Hi, I'm glad you're here. 💙 Take your time - what would you like to talk about?",
        responseStyle: 'patient listening',
        topics: ['feelings', 'challenges', 'coping strategies', 'small steps'],
        vocabulary: ['gentle', 'patience', 'understand', 'feelings', 'step by step'],
        empathy: 'validating',
        suggestions: 'manageable'
      },
      caring: {
        tone: 'compassionate',
        greeting: "I'm really glad you're reaching out. 🤗 You're not alone - let's talk through this together.",
        responseStyle: 'deep empathy',
        topics: ['emotional support', 'difficult feelings', 'professional help', 'safety'],
        vocabulary: ['care deeply', 'understand', 'valid', 'strength', 'support'],
        empathy: 'deep',
        suggestions: 'professional-guided'
      },
      crisis: {
        tone: 'urgent-care',
        greeting: "I'm very concerned about you and want to help. 🆘 Let's focus on getting you the support you need right now.",
        responseStyle: 'crisis intervention',
        topics: ['immediate safety', 'professional resources', 'emergency contacts', 'crisis support'],
        vocabulary: ['immediate', 'safety', 'help available', 'crisis line', 'professional'],
        empathy: 'crisis-aware',
        suggestions: 'emergency-focused'
      }
    }
  }

  getPersonality(assessmentData) {
    if (!assessmentData || !assessmentData.aiPersonality) {
      return this.personalities.supportive // Default
    }
    
    return this.personalities[assessmentData.aiPersonality] || this.personalities.supportive
  }

  adaptResponse(userInput, assessmentData, conversationHistory = []) {
    const personality = this.getPersonality(assessmentData)
    const context = this.analyzeContext(userInput, conversationHistory)
    
    return {
      personality: personality,
      adaptedPrompt: this.buildAdaptedPrompt(userInput, personality, context, assessmentData),
      responseGuidelines: this.getResponseGuidelines(personality),
      safetyChecks: this.getSafetyChecks(assessmentData),
      followUpSuggestions: this.getFollowUpSuggestions(personality, context)
    }
  }

  analyzeContext(userInput, conversationHistory) {
    const input = userInput.toLowerCase()
    
    const emotionalCues = {
      positive: ['happy', 'excited', 'good', 'great', 'wonderful', 'love', 'amazing'],
      neutral: ['okay', 'fine', 'normal', 'alright', 'usual'],
      concerned: ['worried', 'anxious', 'stressed', 'tired', 'overwhelmed', 'difficult'],
      negative: ['sad', 'depressed', 'hopeless', 'angry', 'frustrated', 'terrible'],
      crisis: ['hurt myself', 'end it', 'can\'t go on', 'suicide', 'die', 'kill']
    }

    let detectedMood = 'neutral'
    let intensity = 0

    for (const [mood, keywords] of Object.entries(emotionalCues)) {
      const matches = keywords.filter(keyword => input.includes(keyword))
      if (matches.length > intensity) {
        detectedMood = mood
        intensity = matches.length
      }
    }

    return {
      detectedMood,
      intensity,
      topics: this.extractTopics(input),
      urgency: this.assessUrgency(input),
      conversationLength: conversationHistory.length
    }
  }

  buildAdaptedPrompt(userInput, personality, context, assessmentData) {
    const basePrompt = `You are an AI mental health counselor with a ${personality.tone} personality. 
    
Student's Assessment Info:
- Wellness Score: ${assessmentData?.percentage || 'Unknown'}%
- Severity Level: ${assessmentData?.severity || 'Unknown'}
- Recent Assessment: ${assessmentData?.completedAt ? new Date(assessmentData.completedAt).toDateString() : 'No recent assessment'}

Personality Guidelines:
- Tone: ${personality.tone}
- Response Style: ${personality.responseStyle}
- Empathy Level: ${personality.empathy}
- Suggestion Type: ${personality.suggestions}

Current Context:
- User's Mood: ${context.detectedMood}
- Urgency Level: ${context.urgency}
- Conversation Stage: ${context.conversationLength < 3 ? 'Beginning' : 'Ongoing'}

User's Message: "${userInput}"

Instructions:
1. Respond with ${personality.responseStyle}
2. Use ${personality.empathy} empathy
3. Include vocabulary like: ${personality.vocabulary.join(', ')}
4. Focus on topics: ${personality.topics.join(', ')}
5. Provide ${personality.suggestions} suggestions
6. Keep response under 150 words unless crisis situation
7. Always prioritize safety and encourage professional help if needed

${context.urgency === 'high' ? 'URGENT: This appears to be a high-urgency situation. Prioritize safety and professional resources.' : ''}
${assessmentData?.severity === 'severe' ? 'ALERT: User has severe assessment results. Monitor for crisis indicators.' : ''}`

    return basePrompt
  }

  getResponseGuidelines(personality) {
    return {
      maxLength: personality.tone === 'crisis' ? 200 : 150,
      shouldIncludeResources: ['caring', 'crisis'].includes(personality.tone),
      shouldValidateEmotions: true,
      shouldOfferNextSteps: true,
      urgentLanguage: personality.tone === 'crisis'
    }
  }

  getSafetyChecks(assessmentData) {
    const checks = {
      suicidalRisk: assessmentData?.severity === 'severe',
      immediateIntervention: assessmentData?.aiPersonality === 'crisis',
      professionalReferral: ['moderately_severe', 'severe'].includes(assessmentData?.severity),
      crisisResources: assessmentData?.severity && assessmentData.severity !== 'minimal'
    }

    if (checks.suicidalRisk) {
      checks.crisisHotlines = [
        'National Suicide Prevention Lifeline: 988',
        'Crisis Text Line: Text HOME to 741741',
        'Emergency Services: 911'
      ]
    }

    return checks
  }

  getFollowUpSuggestions(personality, context) {
    const suggestions = []

    if (personality.tone === 'encouraging') {
      suggestions.push(
        'What achievement are you most proud of this week?',
        'What positive goal would you like to work on?',
        'Tell me about something that made you smile recently'
      )
    } else if (personality.tone === 'supportive') {
      suggestions.push(
        'How has your daily routine been lately?',
        'What strategies have you found helpful for managing stress?',
        'Is there a specific area where you\'d like more support?'
      )
    } else if (personality.tone === 'gentle') {
      suggestions.push(
        'Would you like to talk about how you\'re feeling right now?',
        'What small step could we focus on today?',
        'How can I best support you in this moment?'
      )
    } else if (personality.tone === 'caring') {
      suggestions.push(
        'Have you been able to connect with any professional support?',
        'What coping strategies have you been using?',
        'Would you like help creating a safety plan?'
      )
    } else if (personality.tone === 'crisis') {
      suggestions.push(
        'Are you in a safe place right now?',
        'Do you have emergency contacts available?',
        'Would you like me to provide crisis hotline numbers?'
      )
    }

    return suggestions.slice(0, 3) // Return max 3 suggestions
  }

  extractTopics(input) {
    const topicMap = {
      academic: ['school', 'study', 'exam', 'grade', 'homework', 'class', 'professor'],
      social: ['friends', 'family', 'relationship', 'people', 'social', 'alone', 'lonely'],
      anxiety: ['anxious', 'worry', 'nervous', 'panic', 'stress', 'overwhelmed'],
      depression: ['sad', 'depressed', 'hopeless', 'empty', 'worthless', 'tired'],
      sleep: ['sleep', 'insomnia', 'tired', 'exhausted', 'rest', 'awake'],
      eating: ['eat', 'food', 'appetite', 'weight', 'hungry', 'diet']
    }

    const detectedTopics = []
    const input_lower = input.toLowerCase()

    for (const [topic, keywords] of Object.entries(topicMap)) {
      if (keywords.some(keyword => input_lower.includes(keyword))) {
        detectedTopics.push(topic)
      }
    }

    return detectedTopics
  }

  assessUrgency(input) {
    const urgentKeywords = [
      'help', 'emergency', 'crisis', 'hurt myself', 'can\'t go on', 
      'end it all', 'suicide', 'kill myself', 'die', 'hopeless',
      'can\'t take it', 'give up'
    ]

    const input_lower = input.toLowerCase()
    const hasUrgentKeywords = urgentKeywords.some(keyword => input_lower.includes(keyword))

    if (hasUrgentKeywords) return 'high'
    if (input_lower.includes('worried') || input_lower.includes('scared')) return 'medium'
    return 'low'
  }

  // Method to get conversation starter based on personality
  getConversationStarter(assessmentData) {
    const personality = this.getPersonality(assessmentData)
    return personality.greeting
  }

  // Method to provide session recommendations
  getSessionRecommendations(assessmentData, conversationHistory) {
    const recommendations = []
    
    if (!assessmentData) {
      recommendations.push({
        type: 'assessment',
        message: 'Consider taking our wellness assessment to get personalized support',
        action: 'Take Assessment',
        priority: 'high'
      })
    }

    if (assessmentData?.severity === 'moderate' || assessmentData?.severity === 'moderately_severe') {
      recommendations.push({
        type: 'professional',
        message: 'Based on your assessment, speaking with a professional counselor could be very helpful',
        action: 'Find Counselor',
        priority: 'high'
      })
    }

    if (conversationHistory.length > 10) {
      recommendations.push({
        type: 'summary',
        message: 'Would you like me to summarize our conversation and suggest next steps?',
        action: 'Get Summary',
        priority: 'medium'
      })
    }

    return recommendations
  }
}