const express = require('express');
const router = express.Router();
const emotionalAIGuidance = require('../services/emotionalAIGuidance');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// POST /api/ai-guidance/analyze
// Analyze student message and provide AI guidance
router.post('/analyze', auth, async (req, res) => {
  try {
    const { message, assessmentResults, conversationHistory } = req.body;
    const userId = req.user.uid;

    // Validate required data
    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    if (!assessmentResults) {
      return res.status(400).json({
        error: 'Assessment results are required for personalized guidance'
      });
    }

    // Process the conversation and generate guidance
    const result = await emotionalAIGuidance.processConversation(
      message,
      assessmentResults,
      conversationHistory || []
    );

    // Log the interaction (privacy-compliant)
    logger.info('AI Guidance Request', {
      userId: userId.substring(0, 8) + '...', // Partial ID for privacy
      emotion: result.emotionAnalysis.primaryEmotion,
      riskLevel: result.guidance.riskAssessment.riskLevel,
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: {
        emotionAnalysis: result.emotionAnalysis,
        guidance: result.guidance.guidance,
        recommendedTechniques: result.guidance.recommendedTechniques,
        followUpQuestions: result.guidance.followUpQuestions,
        riskAssessment: result.guidance.riskAssessment,
        timestamp: result.timestamp
      }
    });

  } catch (error) {
    logger.error('AI Guidance Error:', error);
    res.status(500).json({
      error: 'Failed to generate AI guidance',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/ai-guidance/emotion-only
// Analyze emotion without generating full guidance
router.post('/emotion-only', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const emotionAnalysis = await emotionalAIGuidance.analyzeEmotion(message);

    res.json({
      success: true,
      data: emotionAnalysis
    });

  } catch (error) {
    logger.error('Emotion Analysis Error:', error);
    res.status(500).json({
      error: 'Failed to analyze emotion',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/ai-guidance/techniques/:emotion
// Get recommended techniques for specific emotion
router.get('/techniques/:emotion', auth, async (req, res) => {
  try {
    const { emotion } = req.params;
    const { severity = 'mild' } = req.query;

    const techniques = emotionalAIGuidance.getRecommendedTechniques(
      { 
        depression: { severity }, 
        anxiety: { severity } 
      },
      { 
        primaryEmotion: emotion, 
        intensity: 5 
      }
    );

    res.json({
      success: true,
      data: {
        emotion,
        severity,
        techniques
      }
    });

  } catch (error) {
    logger.error('Techniques Retrieval Error:', error);
    res.status(500).json({
      error: 'Failed to retrieve techniques'
    });
  }
});

// POST /api/ai-guidance/crisis-check
// Check for crisis indicators and provide immediate resources
router.post('/crisis-check', auth, async (req, res) => {
  try {
    const { message, assessmentResults } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // Analyze for crisis indicators
    const emotionAnalysis = await emotionalAIGuidance.analyzeEmotion(message);
    const riskAssessment = emotionalAIGuidance.assessRisk(
      assessmentResults || { phq9Score: 0, gad7Score: 0 },
      emotionAnalysis
    );

    // If crisis level, provide immediate resources
    if (riskAssessment.riskLevel === 'crisis') {
      const crisisResources = {
        immediate: [
          {
            name: "National Suicide Prevention Lifeline",
            phone: "988",
            available: "24/7",
            description: "Free and confidential emotional support"
          },
          {
            name: "Crisis Text Line",
            contact: "Text HOME to 741741",
            available: "24/7",
            description: "Free, 24/7 support via text message"
          },
          {
            name: "Emergency Services",
            phone: "911",
            available: "24/7",
            description: "For immediate medical emergencies"
          }
        ],
        campus: [
          {
            name: "Campus Counseling Center",
            description: "Contact your college counseling services immediately",
            action: "Visit counseling center or call campus emergency line"
          }
        ]
      };

      res.json({
        success: true,
        crisis: true,
        data: {
          riskLevel: riskAssessment.riskLevel,
          recommendations: riskAssessment.recommendations,
          resources: crisisResources,
          message: "Your safety is our priority. Please reach out to these resources immediately."
        }
      });
    } else {
      res.json({
        success: true,
        crisis: false,
        data: {
          riskLevel: riskAssessment.riskLevel,
          recommendations: riskAssessment.recommendations
        }
      });
    }

  } catch (error) {
    logger.error('Crisis Check Error:', error);
    res.status(500).json({
      error: 'Failed to perform crisis check'
    });
  }
});

module.exports = router;