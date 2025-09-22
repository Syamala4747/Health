const OpenAI = require('openai');
const logger = require('../utils/logger');

class EmotionalAIGuidance {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Therapeutic approach database
    this.therapeuticApproaches = {
      depression: {
        minimal: ['behavioral_activation', 'mindfulness', 'self_care'],
        mild: ['cbt_techniques', 'thought_challenging', 'activity_scheduling'],
        moderate: ['structured_cbt', 'problem_solving', 'social_support'],
        severe: ['professional_referral', 'crisis_intervention', 'immediate_support']
      },
      anxiety: {
        minimal: ['breathing_exercises', 'relaxation', 'lifestyle_changes'],
        mild: ['exposure_therapy', 'grounding_techniques', 'stress_management'],
        moderate: ['systematic_desensitization', 'cognitive_restructuring'],
        severe: ['intensive_support', 'professional_referral', 'crisis_management']
      }
    };

    // Emotion detection patterns
    this.emotionPatterns = {
      sadness: ['sad', 'down', 'depressed', 'hopeless', 'empty', 'lonely'],
      anxiety: ['anxious', 'worried', 'nervous', 'scared', 'overwhelmed', 'panic'],
      anger: ['angry', 'frustrated', 'irritated', 'mad', 'furious'],
      stress: ['stressed', 'pressure', 'overwhelmed', 'burnt out', 'exhausted'],
      hope: ['better', 'hopeful', 'positive', 'motivated', 'encouraged'],
      fear: ['afraid', 'terrified', 'scared', 'fearful', 'apprehensive']
    };
  }

  // Analyze student's emotional state from text
  async analyzeEmotion(text) {
    try {
      const prompt = `
        Analyze the emotional state from this text and provide a structured response:
        
        Text: "${text}"
        
        Please identify:
        1. Primary emotions (sadness, anxiety, anger, stress, hope, fear, neutral)
        2. Emotional intensity (1-10 scale)
        3. Key emotional indicators
        4. Underlying concerns
        
        Return as JSON format:
        {
          "primaryEmotion": "emotion_name",
          "intensity": number,
          "secondaryEmotions": ["emotion1", "emotion2"],
          "indicators": ["word1", "word2"],
          "concerns": ["concern1", "concern2"],
          "riskLevel": "low|medium|high"
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('Error analyzing emotion:', error);
      return this.fallbackEmotionAnalysis(text);
    }
  }

  // Fallback emotion analysis using pattern matching
  fallbackEmotionAnalysis(text) {
    const lowerText = text.toLowerCase();
    const detectedEmotions = {};
    
    Object.entries(this.emotionPatterns).forEach(([emotion, patterns]) => {
      const matches = patterns.filter(pattern => lowerText.includes(pattern));
      if (matches.length > 0) {
        detectedEmotions[emotion] = matches.length;
      }
    });

    const primaryEmotion = Object.keys(detectedEmotions).length > 0 
      ? Object.keys(detectedEmotions).reduce((a, b) => 
          detectedEmotions[a] > detectedEmotions[b] ? a : b
        )
      : 'neutral';

    return {
      primaryEmotion,
      intensity: Math.min(detectedEmotions[primaryEmotion] || 1, 10),
      secondaryEmotions: Object.keys(detectedEmotions).slice(1, 3),
      indicators: this.emotionPatterns[primaryEmotion] || [],
      concerns: [],
      riskLevel: 'low'
    };
  }

  // Generate personalized guidance based on assessment and emotions
  async generateGuidance(assessmentResults, emotionAnalysis, conversationHistory = []) {
    try {
      const systemPrompt = this.buildSystemPrompt(assessmentResults, emotionAnalysis);
      const contextPrompt = this.buildContextPrompt(assessmentResults, emotionAnalysis, conversationHistory);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      return {
        guidance: response.choices[0].message.content,
        recommendedTechniques: this.getRecommendedTechniques(assessmentResults, emotionAnalysis),
        followUpQuestions: this.generateFollowUpQuestions(emotionAnalysis),
        riskAssessment: this.assessRisk(assessmentResults, emotionAnalysis)
      };
    } catch (error) {
      logger.error('Error generating guidance:', error);
      return this.getFallbackGuidance(assessmentResults, emotionAnalysis);
    }
  }

  // Build system prompt for AI context
  buildSystemPrompt(assessmentResults, emotionAnalysis) {
    return `
      You are an expert AI mental health companion specializing in emotional support for college students. 
      
      IMPORTANT GUIDELINES:
      - Always maintain a supportive, non-judgmental tone
      - Never provide medical diagnosis or replace professional help
      - Focus on evidence-based coping strategies and emotional validation
      - Be culturally sensitive and age-appropriate for college students
      - Encourage professional help for severe symptoms
      - Use warm, empathetic language while being practical
      
      AVAILABLE TECHNIQUES:
      - Cognitive Behavioral Therapy (CBT) techniques
      - Mindfulness and meditation practices
      - Breathing exercises and grounding techniques
      - Behavioral activation strategies
      - Stress management and time management
      - Social support and communication skills
      - Self-care and lifestyle recommendations
      
      RESPONSE FORMAT:
      - Start with emotional validation
      - Provide 2-3 specific, actionable strategies
      - Include encouragement and hope
      - Suggest when to seek professional help if needed
      - Keep responses concise but warm (150-300 words)
    `;
  }

  // Build context prompt with assessment and emotion data
  buildContextPrompt(assessmentResults, emotionAnalysis, conversationHistory) {
    const { phq9Score, gad7Score, depression, anxiety } = assessmentResults;
    const { primaryEmotion, intensity, concerns } = emotionAnalysis;

    return `
      STUDENT CONTEXT:
      
      Assessment Results:
      - Depression Score (PHQ-9): ${phq9Score}/27 (${depression.level})
      - Anxiety Score (GAD-7): ${gad7Score}/21 (${anxiety.level})
      
      Current Emotional State:
      - Primary Emotion: ${primaryEmotion}
      - Intensity: ${intensity}/10
      - Concerns: ${concerns.join(', ') || 'None specified'}
      
      Recent Conversation:
      ${conversationHistory.slice(-3).map(msg => 
        `${msg.sender}: ${msg.text}`
      ).join('\n')}
      
      Please provide personalized guidance that:
      1. Acknowledges their current emotional state
      2. Relates to their assessment results
      3. Offers specific, actionable coping strategies
      4. Maintains hope and encouragement
      5. Suggests professional resources if appropriate
    `;
  }

  // Get recommended techniques based on assessment and emotion
  getRecommendedTechniques(assessmentResults, emotionAnalysis) {
    const techniques = [];
    const { depression, anxiety } = assessmentResults;
    const { primaryEmotion, intensity } = emotionAnalysis;

    // Add techniques based on depression level
    if (depression.severity !== 'low') {
      techniques.push(...this.therapeuticApproaches.depression[depression.severity] || []);
    }

    // Add techniques based on anxiety level  
    if (anxiety.severity !== 'low') {
      techniques.push(...this.therapeuticApproaches.anxiety[anxiety.severity] || []);
    }

    // Add emotion-specific techniques
    if (primaryEmotion === 'anxiety' && intensity > 6) {
      techniques.push('breathing_exercises', 'grounding_techniques');
    }
    if (primaryEmotion === 'sadness' && intensity > 6) {
      techniques.push('behavioral_activation', 'social_connection');
    }

    return [...new Set(techniques)]; // Remove duplicates
  }

  // Generate follow-up questions to continue conversation
  generateFollowUpQuestions(emotionAnalysis) {
    const { primaryEmotion, intensity } = emotionAnalysis;
    
    const questions = {
      sadness: [
        "What activities used to bring you joy?",
        "Have you been able to connect with friends or family recently?",
        "What's been the most challenging part of your day?"
      ],
      anxiety: [
        "What situations tend to trigger your anxiety the most?",
        "Have you tried any relaxation techniques before?",
        "What helps you feel more grounded when you're worried?"
      ],
      stress: [
        "What's contributing most to your stress right now?",
        "How has this been affecting your sleep or appetite?",
        "What would help you feel more in control?"
      ],
      anger: [
        "What's been frustrating you the most lately?",
        "How do you usually handle these feelings?",
        "What would help you feel more calm right now?"
      ]
    };

    return questions[primaryEmotion] || [
      "How has this been affecting your daily life?",
      "What kind of support would be most helpful right now?",
      "Is there anything specific you'd like to work on?"
    ];
  }

  // Assess risk level and determine if escalation needed
  assessRisk(assessmentResults, emotionAnalysis) {
    const { phq9Score, gad7Score } = assessmentResults;
    const { intensity, concerns } = emotionAnalysis;

    let riskLevel = 'low';
    const recommendations = [];

    // High-risk indicators
    if (phq9Score >= 15 || gad7Score >= 15 || intensity >= 8) {
      riskLevel = 'high';
      recommendations.push('Consider speaking with a counselor or mental health professional');
      recommendations.push('Contact campus counseling services');
    } else if (phq9Score >= 10 || gad7Score >= 10 || intensity >= 6) {
      riskLevel = 'moderate';
      recommendations.push('Regular check-ins with support system');
      recommendations.push('Consider counseling resources');
    }

    // Crisis indicators
    const crisisKeywords = ['suicide', 'self-harm', 'hurt myself', 'end it all'];
    const hasCrisisIndicators = concerns.some(concern => 
      crisisKeywords.some(keyword => concern.toLowerCase().includes(keyword))
    );

    if (hasCrisisIndicators) {
      riskLevel = 'crisis';
      recommendations.push('IMMEDIATE: Contact crisis hotline or emergency services');
      recommendations.push('National Suicide Prevention Lifeline: 988');
      recommendations.push('Campus emergency services');
    }

    return { riskLevel, recommendations };
  }

  // Fallback guidance when AI service fails
  getFallbackGuidance(assessmentResults, emotionAnalysis) {
    const { depression, anxiety } = assessmentResults;
    const { primaryEmotion } = emotionAnalysis;

    const fallbackResponses = {
      sadness: "I understand you're feeling down right now. These feelings are valid, and it's important to be gentle with yourself. Try taking small steps today - maybe a short walk, listening to music you enjoy, or reaching out to someone you trust.",
      anxiety: "Feeling anxious can be overwhelming. Let's focus on what you can control right now. Try taking slow, deep breaths - in for 4 counts, hold for 4, out for 4. Ground yourself by naming 5 things you can see around you.",
      stress: "Stress can feel overwhelming, but breaking it down can help. What's one small thing you can tackle today? Remember that it's okay to ask for help and take breaks when you need them."
    };

    return {
      guidance: fallbackResponses[primaryEmotion] || "I'm here to support you. You're taking a positive step by reaching out, and that shows strength. Let's work together to find strategies that can help.",
      recommendedTechniques: ['deep_breathing', 'mindfulness', 'self_care'],
      followUpQuestions: ["How are you feeling right now?", "What would be most helpful?"],
      riskAssessment: { riskLevel: 'low', recommendations: [] }
    };
  }

  // Process real-time conversation for emotional context
  async processConversation(message, assessmentResults, conversationHistory) {
    try {
      // Analyze emotion in current message
      const emotionAnalysis = await this.analyzeEmotion(message);
      
      // Generate contextual guidance
      const guidance = await this.generateGuidance(
        assessmentResults, 
        emotionAnalysis, 
        conversationHistory
      );

      // Log interaction for learning (privacy-compliant)
      logger.info('AI Guidance Generated', {
        emotion: emotionAnalysis.primaryEmotion,
        riskLevel: guidance.riskAssessment.riskLevel,
        timestamp: new Date()
      });

      return {
        emotionAnalysis,
        guidance,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error processing conversation:', error);
      throw error;
    }
  }
}

module.exports = new EmotionalAIGuidance();