const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const verifyFirebaseToken = require('../middleware/auth');
const logger = require('../utils/logger');
const aimlBot = require('../services/aimlBot');

// Load questionnaire flows
const phq9Flow = require('../bot/flows/phq9Flow.json');
const gad7Flow = require('../bot/flows/gad7Flow.json');

/**
 * @route GET /api/chatbot/questionnaire/:type
 * @desc Get questionnaire (PHQ-9 or GAD-7)
 * @access Private
 */
router.get('/questionnaire/:type', [
  verifyFirebaseToken,
], async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user.uid;

    if (!['phq9', 'gad7'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid questionnaire type. Must be phq9 or gad7'
      });
    }

    const questionnaireFile = type === 'phq9' ? phq9Flow : gad7Flow;
    
    logger.info(`Questionnaire ${type} requested by user ${userId}`);

    res.json({
      success: true,
      data: questionnaireFile
    });

  } catch (error) {
    logger.error('Get questionnaire error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get questionnaire'
    });
  }
});

/**
 * @route POST /api/chatbot/assessment
 * @desc Submit assessment (PHQ-9 or GAD-7)
 * @access Private
 */
router.post('/assessment', [
  verifyFirebaseToken,
  body('type').isIn(['phq9', 'gad7']).withMessage('Type must be phq9 or gad7'),
  body('answers').isObject().withMessage('Answers must be an object'),
  body('totalScore').isInt({ min: 0 }).withMessage('Total score must be a non-negative integer'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { type, answers, totalScore } = req.body;
    const userId = req.user.uid;

    const questionnaireFile = type === 'phq9' ? phq9Flow : gad7Flow;
    
    // Calculate severity based on total score
    let severity = 'unknown';
    let severityColor = '#6A5ACD'; // Default primary color
    let recommendation = '';

    for (const range of questionnaireFile.scoring.ranges) {
      if (totalScore >= range.min && totalScore <= range.max) {
        severity = range.severity;
        recommendation = range.recommendation.en; // TODO: Use user's language
        
        // Set severity color
        switch (range.severity) {
          case 'none-minimal':
          case 'minimal':
            severityColor = '#4CAF50'; // success
            break;
          case 'mild':
            severityColor = '#FF9800'; // warning
            break;
          case 'moderate':
            severityColor = '#FF5722'; // orange
            break;
          case 'moderately-severe':
          case 'severe':
            severityColor = '#F44336'; // error
            break;
        }
        break;
      }
    }

    // Store assessment result
    await storeAssessmentResult(userId, type, {
      answers,
      totalScore,
      severity,
      recommendation,
      completedAt: new Date()
    });

    // Check if crisis intervention is needed
    const needsCrisisIntervention = totalScore >= (type === 'phq9' ? 15 : 15);

    logger.info(`Assessment ${type} completed by user ${userId}, score: ${totalScore}, severity: ${severity}`);

    res.json({
      success: true,
      data: {
        totalScore,
        severity,
        severityColor,
        recommendation,
        needsCrisisIntervention,
        emergencyContacts: questionnaireFile.emergencyContacts.en
      }
    });

  } catch (error) {
    logger.error('Submit assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assessment'
    });
  }
});

/**
 * @route POST /api/chatbot/message
 * @desc Send message to chatbot
 * @access Private
 */
router.post('/message', [
  verifyFirebaseToken,
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
  body('sessionId').trim().isLength({ min: 1 }).withMessage('Session ID is required'),
  body('language').optional().isIn(['en', 'te', 'hi', 'ta']).withMessage('Invalid language code'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { message, sessionId, language = 'en' } = req.body;
    const userId = req.user.uid;

    logger.info(`Chat message from user ${userId}: ${message.substring(0, 50)}...`);

    // Check for crisis language first
    const crisisDetected = await checkForCrisisLanguage(message);
    
    // Get AIML response based on language
    const aiResponse = await aimlBot.getResponse(message, {
      userId,
      language,
      sessionId,
      context: req.body.context || {}
    });

    // Generate suggestions based on response
    const suggestions = generateSuggestions(message, aiResponse.intent);

    // Log the interaction
    await logChatInteraction(userId, sessionId, message, aiResponse.response, 'message');

    res.json({
      success: true,
      message: aiResponse.response,
      crisisDetected,
      suggestions,
      intent: aiResponse.intent,
      confidence: aiResponse.confidence
    });

  } catch (error) {
    logger.error('Chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message'
    });
  }
});

/**
 * @route POST /api/chatbot/ai
 * @desc AI chatbot endpoint
 * @access Private
 */
router.post('/ai', [
  verifyFirebaseToken,
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
  body('language').optional().isIn(['en', 'te', 'hi', 'ta']).withMessage('Invalid language code'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { message, language = 'en' } = req.body;
    const userId = req.user.uid;
    const sessionId = `session_${userId}_${Date.now()}`;

    logger.info(`AI chat message from user ${userId}: ${message.substring(0, 50)}...`);

    // Check for crisis language first
    const crisisDetected = await checkForCrisisLanguage(message);
    
    // Get AIML response based on language
    const aiResponse = await aimlBot.getResponse(message, {
      userId,
      language,
      sessionId,
      context: req.body.context || {}
    });

    // Generate suggestions based on response
    const suggestions = generateSuggestions(message, aiResponse.intent);

    // Log the interaction
    await logChatInteraction(userId, sessionId, message, aiResponse.response, 'ai');

    res.json({
      success: true,
      response: aiResponse.response,
      crisisDetected,
      suggestions,
      intent: aiResponse.intent,
      confidence: aiResponse.confidence,
      sessionId
    });

  } catch (error) {
    logger.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI chat message'
    });
  }
});

/**
 * @route GET /api/chatbot/assessments
 * @desc Get user's assessment history
 * @access Private
 */
router.get('/assessments', [
  verifyFirebaseToken,
], async (req, res) => {
  try {
    const userId = req.user.uid;

    const assessments = await getUserAssessments(userId);

    res.json({
      success: true,
      data: assessments
    });

  } catch (error) {
    logger.error('Get assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assessments'
    });
  }
});

/**
 * @route POST /api/chatbot/phq9
 * @desc Submit PHQ-9 assessment
 * @access Private
 */
router.post('/phq9', [
  verifyFirebaseToken,
  body('answers').isArray().withMessage('Answers must be an array'),
  body('totalScore').isInt({ min: 0, max: 27 }).withMessage('Total score must be between 0 and 27'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { answers, totalScore } = req.body;
    const userId = req.user.uid;

    // Calculate severity based on PHQ-9 score
    let severity, recommendation;
    
    if (totalScore <= 4) {
      severity = 'minimal';
      recommendation = 'Your depression level appears to be minimal. Continue with healthy lifestyle practices.';
    } else if (totalScore <= 9) {
      severity = 'mild';
      recommendation = 'You may be experiencing mild depression. Consider speaking with a counselor for support.';
    } else if (totalScore <= 14) {
      severity = 'moderate';
      recommendation = 'You may be experiencing moderate depression. We recommend speaking with a mental health professional.';
    } else if (totalScore <= 19) {
      severity = 'moderately-severe';
      recommendation = 'You may be experiencing moderately severe depression. Please consider seeking professional help.';
    } else {
      severity = 'severe';
      recommendation = 'You may be experiencing severe depression. We strongly recommend immediate professional support.';
    }

    const result = {
      type: 'phq9',
      answers,
      totalScore,
      severity,
      recommendation,
      completedAt: new Date()
    };

    await saveAssessmentResult(userId, 'phq9', result);

    logger.info(`PHQ-9 assessment completed by user ${userId}, score: ${totalScore}, severity: ${severity}`);

    res.json({
      success: true,
      data: {
        totalScore,
        severity,
        recommendation,
        needsCrisisIntervention: totalScore >= 20
      }
    });

  } catch (error) {
    logger.error('PHQ-9 assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process PHQ-9 assessment'
    });
  }
});

// Helper function to check for crisis language
async function checkForCrisisLanguage(message) {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die', 'hurt myself',
    'self harm', 'cut myself', 'overdose', 'jump off', 'hang myself'
  ];

  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Helper function to generate suggestions
function generateSuggestions(userMessage, intent) {
  const suggestionMap = {
    'depression': [
      'Tell me more about your feelings',
      'Take depression assessment',
      'Find coping strategies'
    ],
    'anxiety': [
      'Try breathing exercises',
      'Take anxiety assessment',
      'Learn relaxation techniques'
    ],
    'stress': [
      'Explore stress management',
      'Find relaxation methods',
      'Talk about your stressors'
    ],
    'greeting': [
      'How are you feeling today?',
      'What\'s on your mind?',
      'I\'m here to listen'
    ]
  };

  return suggestionMap[intent] || [
    'Tell me more',
    'How does that make you feel?',
    'What would help right now?'
  ];
}

// Helper function to store assessment results
async function storeAssessmentResult(userId, type, result) {
  try {
    const { getFirestore } = require('../config/firebase');
    const db = getFirestore();

    await db.collection('assessments').add({
      userId,
      type,
      ...result,
      createdAt: new Date()
    });

    logger.info(`Assessment ${type} stored for user ${userId}`);
  } catch (error) {
    logger.error('Failed to store assessment result:', error);
    throw error;
  }
}

// Helper function to get user assessments
async function getUserAssessments(userId) {
  try {
    const { getFirestore } = require('../config/firebase');
    const db = getFirestore();

    const assessmentsSnapshot = await db
      .collection('assessments')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const assessments = {
      phq9: null,
      gad7: null,
      history: []
    };

    assessmentsSnapshot.forEach(doc => {
      const data = doc.data();
      assessments.history.push({
        id: doc.id,
        ...data
      });

      // Set latest assessments
      if (data.type === 'phq9' && !assessments.phq9) {
        assessments.phq9 = {
          lastScore: data.totalScore,
          lastSeverity: data.severity,
          lastDate: data.createdAt.toDate()
        };
      } else if (data.type === 'gad7' && !assessments.gad7) {
        assessments.gad7 = {
          lastScore: data.totalScore,
          lastSeverity: data.severity,
          lastDate: data.createdAt.toDate()
        };
      }
    });

    return assessments;
  } catch (error) {
    logger.error('Failed to get user assessments:', error);
    throw error;
  }
}

// Helper function to log chat interactions
async function logChatInteraction(userId, sessionId, userMessage, botResponse, type) {
  try {
    const { getFirestore } = require('../config/firebase');
    const db = getFirestore();

    await db.collection('chatLogs').add({
      userId,
      sessionId,
      userMessage,
      botResponse,
      type,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to log chat interaction:', error);
    // Don't throw error for logging failures
  }
}

// Helper function to save assessment results (used by PHQ-9 route)
async function saveAssessmentResult(userId, type, result) {
  try {
    const { getFirestore } = require('../config/firebase');
    const db = getFirestore();

    await db.collection('assessments').add({
      userId,
      type,
      ...result,
      createdAt: new Date()
    });

    logger.info(`Assessment ${type} saved for user ${userId}`);
  } catch (error) {
    logger.error('Failed to save assessment result:', error);
    throw error;
  }
}

module.exports = router;