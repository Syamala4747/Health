const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');

const { db } = require('../config/firebase');
const { logger } = require('../utils/logger');

// Mock AI responses for now - in production, integrate with OpenAI or similar
const generateAIResponse = async (message, context) => {
  // Crisis detection
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead',
    'hurt myself', 'self harm', 'cutting', 'overdose', 'jump off'
  ];
  
  const messageLower = message.toLowerCase();
  const isCrisis = crisisKeywords.some(keyword => messageLower.includes(keyword));
  
  if (isCrisis) {
    return {
      response: "I'm very concerned about what you've shared. Your safety is the most important thing right now. Please consider reaching out to a crisis helpline immediately: National Suicide Prevention Lifeline (988) or text HOME to 741741. Would you like me to help you find local emergency resources?",
      confidence: 0.95,
      isCrisis: true
    };
  }

  // Assessment-based responses
  if (context.assessmentResults) {
    const phq9Score = context.assessmentResults.phq9?.score || 0;
    const gad7Score = context.assessmentResults.gad7?.score || 0;
    
    if (phq9Score >= 15) {
      return generateDepressionResponse(message, phq9Score, context);
    } else if (gad7Score >= 10) {
      return generateAnxietyResponse(message, gad7Score, context);
    }
  }

  // General supportive responses
  return generateGeneralResponse(message, context);
};

const generateDepressionResponse = (message, score, context) => {
  const responses = [
    "I can see from your assessment that you're experiencing significant depression symptoms. It takes courage to reach out. What's been the most challenging part of your day today?",
    "Your PHQ-9 score indicates you're going through a really difficult time. I want you to know that what you're feeling is valid, and there are ways to feel better. Can you tell me about one small thing that brought you even a moment of peace recently?",
    "Depression can make everything feel overwhelming. Let's focus on just this moment right now. What's one thing you can do today to take care of yourself, even if it's something very small?",
    "I understand you're struggling with depression. Sometimes it helps to break things down into smaller, manageable pieces. What's one concern that's weighing heavily on your mind right now?"
  ];
  
  return {
    response: responses[Math.floor(Math.random() * responses.length)],
    confidence: 0.85,
    category: 'depression_support'
  };
};

const generateAnxietyResponse = (message, score, context) => {
  const responses = [
    "I can see from your assessment that anxiety is really affecting you. Anxiety can feel overwhelming, but you're not alone in this. What situations tend to trigger your anxiety the most?",
    "Your GAD-7 score shows you're experiencing significant anxiety. Let's try a grounding technique: Can you name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste?",
    "Anxiety can make your mind race with worries. Right now, let's focus on your breathing. Try taking a slow, deep breath in for 4 counts, hold for 4, then breathe out for 6. How does that feel?",
    "I understand anxiety can be exhausting. Sometimes it helps to remember that anxiety is your mind trying to protect you, even when there's no real danger. What's one worry that's been particularly persistent lately?"
  ];
  
  return {
    response: responses[Math.floor(Math.random() * responses.length)],
    confidence: 0.85,
    category: 'anxiety_support'
  };
};

const generateGeneralResponse = (message, context) => {
  // Simple keyword-based responses for now
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('stress')) {
    return {
      response: "Stress is something we all experience, and it sounds like you're dealing with quite a bit right now. What's been your biggest source of stress lately? Sometimes talking through it can help us see it more clearly.",
      confidence: 0.75,
      category: 'stress_support'
    };
  }
  
  if (messageLower.includes('sleep') || messageLower.includes('tired')) {
    return {
      response: "Sleep issues can really impact how we feel during the day. Are you having trouble falling asleep, staying asleep, or both? Good sleep hygiene can make a big difference in how we cope with daily challenges.",
      confidence: 0.75,
      category: 'sleep_support'
    };
  }
  
  if (messageLower.includes('lonely') || messageLower.includes('alone')) {
    return {
      response: "Feeling lonely can be really painful. It's important to remember that feeling lonely doesn't mean you're alone - many people experience this. What usually helps you feel more connected to others?",
      confidence: 0.75,
      category: 'loneliness_support'
    };
  }
  
  if (messageLower.includes('angry') || messageLower.includes('frustrated')) {
    return {
      response: "It sounds like you're feeling really frustrated or angry about something. Those are valid emotions, and it's okay to feel them. What's been triggering these feelings for you?",
      confidence: 0.75,
      category: 'anger_support'
    };
  }
  
  // Default supportive response
  const defaultResponses = [
    "Thank you for sharing that with me. It sounds like you're going through something difficult. Can you tell me more about what's on your mind?",
    "I hear you, and I want you to know that your feelings are valid. What would be most helpful for you to talk about right now?",
    "It takes strength to reach out when you're struggling. What's been the most challenging part of your day today?",
    "I'm here to listen and support you. What's one thing that's been weighing on your mind lately?"
  ];
  
  return {
    response: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
    confidence: 0.65,
    category: 'general_support'
  };
};

/**
 * @route POST /api/ai-counselor/chat
 * @desc Send message to AI counselor and get response
 * @access Protected (Student only)
 */
router.post('/chat', [
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  body('sessionId').optional().isString().withMessage('Session ID must be a string'),
  body('context').optional().isObject().withMessage('Context must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { message, sessionId, context = {} } = req.body;

    // Generate AI response
    const aiResponse = await generateAIResponse(message, context);

    // Log the interaction for monitoring and improvement
    logger.info(`AI Counselor interaction: ${message.substring(0, 50)}... -> ${aiResponse.category || 'general'}`);

    // If crisis detected, create alert
    if (aiResponse.isCrisis) {
      try {
        await db.collection('crisis_alerts').add({
          userId: req.user?.uid || 'anonymous',
          sessionId: sessionId || null,
          message: message,
          aiResponse: aiResponse.response,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active'
        });
        
        logger.warn(`Crisis detected in AI counselor session: ${sessionId}`);
      } catch (alertError) {
        logger.error('Failed to create crisis alert:', alertError);
      }
    }

    res.json({
      success: true,
      response: aiResponse.response,
      confidence: aiResponse.confidence,
      category: aiResponse.category,
      isCrisis: aiResponse.isCrisis || false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('AI Counselor chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI counselor request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route GET /api/ai-counselor/history/:userId
 * @desc Get AI counselor chat history for a user
 * @access Protected (User's own history only)
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, sessionId } = req.query;

    // In a real implementation, verify user has access to this history
    let query = db.collection('ai_messages')
      .where('userId', '==', userId);
    
    if (sessionId) {
      query = query.where('sessionId', '==', sessionId);
    }
    
    const messagesSnapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();

    const messages = [];
    messagesSnapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Reverse to get chronological order
    messages.reverse();

    res.json({
      success: true,
      messages,
      count: messages.length
    });

  } catch (error) {
    logger.error('Get AI counselor history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history'
    });
  }
});

/**
 * @route GET /api/ai-counselor/sessions/:userId
 * @desc Get AI counselor sessions for a user
 * @access Protected (User's own sessions only)
 */
router.get('/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const sessionsSnapshot = await db.collection('ai_sessions')
      .where('userId', '==', userId)
      .orderBy('startedAt', 'desc')
      .limit(20)
      .get();

    const sessions = [];
    sessionsSnapshot.forEach(doc => {
      sessions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      sessions,
      count: sessions.length
    });

  } catch (error) {
    logger.error('Get AI counselor sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sessions'
    });
  }
});

/**
 * @route POST /api/ai-counselor/feedback
 * @desc Submit feedback for AI counselor interaction
 * @access Protected
 */
router.post('/feedback', [
  body('sessionId').isString().withMessage('Session ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isString().withMessage('Feedback must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { sessionId, rating, feedback } = req.body;

    await db.collection('ai_feedback').add({
      sessionId,
      userId: req.user?.uid || 'anonymous',
      rating,
      feedback: feedback || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`AI Counselor feedback received: ${rating}/5 for session ${sessionId}`);

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    logger.error('AI Counselor feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
});

module.exports = router;