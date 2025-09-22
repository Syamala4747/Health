const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const { CrisisDetector } = require('../services/crisisDetector');
const { logger } = require('../utils/logger');
const axios = require('axios');

const router = express.Router();

// Initialize crisis detector
const crisisDetector = new CrisisDetector();

/**
 * Crisis detection endpoint
 */
router.post('/crisis-detect', [
  authMiddleware,
  body('text').isString().isLength({ min: 1, max: 5000 }),
  body('language').optional().isIn(['en', 'te', 'hi', 'ta'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { text, language = 'en' } = req.body;
  const userId = req.user.uid;

  try {
    const result = await crisisDetector.analyze(text, language);
    
    // Log the analysis (without storing the actual text for privacy)
    logger.info('Crisis detection analysis', {
      userId,
      language,
      isCrisis: result.isCrisis,
      confidence: result.confidence,
      method: result.method,
      textLength: text.length
    });

    // Don't return the full crisis response here, just the analysis
    res.json({
      isCrisis: result.isCrisis,
      confidence: result.confidence,
      method: result.method,
      language,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Crisis detection error:', error);
    res.status(500).json({ error: 'Crisis detection analysis failed' });
  }
}));

/**
 * Sentiment analysis endpoint
 */
router.post('/sentiment', [
  authMiddleware,
  body('text').isString().isLength({ min: 1, max: 5000 }),
  body('language').optional().isIn(['en', 'te', 'hi', 'ta'])
], asyncHandler(async (req, res) => {
  const { text, language = 'en' } = req.body;
  const userId = req.user.uid;

  try {
    let sentiment = { polarity: 0, subjectivity: 0, label: 'neutral' };

    // Try ML service first
    if (process.env.ML_SERVICE_URL) {
      try {
        const response = await axios.post(`${process.env.ML_SERVICE_URL}/sentiment`, {
          text,
          language
        }, { timeout: 5000 });
        
        sentiment = response.data;
      } catch (mlError) {
        logger.warn('ML service sentiment analysis failed:', mlError.message);
      }
    }

    // Fallback to simple keyword-based sentiment
    if (sentiment.label === 'neutral') {
      sentiment = simpleKeywordSentiment(text, language);
    }

    logger.info('Sentiment analysis', {
      userId,
      language,
      sentiment: sentiment.label,
      polarity: sentiment.polarity,
      textLength: text.length
    });

    res.json({
      sentiment,
      language,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Sentiment analysis failed' });
  }
}));

/**
 * Text classification for mental health topics
 */
router.post('/classify', [
  authMiddleware,
  body('text').isString().isLength({ min: 1, max: 5000 }),
  body('language').optional().isIn(['en', 'te', 'hi', 'ta'])
], asyncHandler(async (req, res) => {
  const { text, language = 'en' } = req.body;
  const userId = req.user.uid;

  try {
    let classification = { categories: [], confidence: 0 };

    // Try ML service first
    if (process.env.ML_SERVICE_URL) {
      try {
        const response = await axios.post(`${process.env.ML_SERVICE_URL}/classify`, {
          text,
          language
        }, { timeout: 5000 });
        
        classification = response.data;
      } catch (mlError) {
        logger.warn('ML service classification failed:', mlError.message);
      }
    }

    // Fallback to keyword-based classification
    if (classification.categories.length === 0) {
      classification = keywordBasedClassification(text, language);
    }

    logger.info('Text classification', {
      userId,
      language,
      categories: classification.categories,
      confidence: classification.confidence,
      textLength: text.length
    });

    res.json({
      classification,
      language,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Text classification error:', error);
    res.status(500).json({ error: 'Text classification failed' });
  }
}));

/**
 * Get ML service status and capabilities
 */
router.get('/status', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const status = {
      crisisDetection: {
        available: true,
        methods: ['keyword', 'pattern'],
        languages: ['en', 'te', 'hi', 'ta']
      },
      sentimentAnalysis: {
        available: false,
        methods: ['keyword'],
        languages: ['en']
      },
      textClassification: {
        available: false,
        methods: ['keyword'],
        languages: ['en']
      },
      externalServices: {
        mlService: !!process.env.ML_SERVICE_URL,
        huggingFace: !!process.env.HUGGINGFACE_API_KEY
      }
    };

    // Check ML service availability
    if (process.env.ML_SERVICE_URL) {
      try {
        const response = await axios.get(`${process.env.ML_SERVICE_URL}/health`, { timeout: 3000 });
        if (response.status === 200) {
          status.sentimentAnalysis.available = true;
          status.sentimentAnalysis.methods.push('ml');
          status.textClassification.available = true;
          status.textClassification.methods.push('ml');
        }
      } catch (error) {
        logger.warn('ML service health check failed:', error.message);
      }
    }

    res.json(status);
  } catch (error) {
    logger.error('ML status check error:', error);
    res.status(500).json({ error: 'Failed to check ML service status' });
  }
}));

/**
 * Batch analysis for multiple texts
 */
router.post('/batch-analyze', [
  authMiddleware,
  body('texts').isArray({ min: 1, max: 10 }),
  body('texts.*').isString().isLength({ min: 1, max: 1000 }),
  body('analysisTypes').isArray().custom((types) => {
    const validTypes = ['crisis', 'sentiment', 'classification'];
    return types.every(type => validTypes.includes(type));
  }),
  body('language').optional().isIn(['en', 'te', 'hi', 'ta'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { texts, analysisTypes, language = 'en' } = req.body;
  const userId = req.user.uid;

  try {
    const results = [];

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const result = { index: i, text: text.substring(0, 50) + '...' };

      // Crisis detection
      if (analysisTypes.includes('crisis')) {
        try {
          const crisisResult = await crisisDetector.analyze(text, language);
          result.crisis = {
            isCrisis: crisisResult.isCrisis,
            confidence: crisisResult.confidence,
            method: crisisResult.method
          };
        } catch (error) {
          result.crisis = { error: 'Analysis failed' };
        }
      }

      // Sentiment analysis
      if (analysisTypes.includes('sentiment')) {
        result.sentiment = simpleKeywordSentiment(text, language);
      }

      // Classification
      if (analysisTypes.includes('classification')) {
        result.classification = keywordBasedClassification(text, language);
      }

      results.push(result);
    }

    logger.info('Batch analysis completed', {
      userId,
      textsCount: texts.length,
      analysisTypes,
      language
    });

    res.json({
      results,
      totalTexts: texts.length,
      analysisTypes,
      language,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Batch analysis error:', error);
    res.status(500).json({ error: 'Batch analysis failed' });
  }
}));

// Helper functions for fallback analysis

function simpleKeywordSentiment(text, language) {
  const positiveWords = {
    en: ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'joy', 'excited'],
    te: ['సంతోషం', 'మంచి', 'గొప్ప', 'అద్భుతం'],
    hi: ['खुश', 'अच्छा', 'बेहतरीन', 'शानदार'],
    ta: ['மகிழ்ச்சி', 'நல்ல', 'சிறந்த', 'அருமை']
  };

  const negativeWords = {
    en: ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'depressed', 'anxious', 'worried', 'scared'],
    te: ['దుఃఖం', 'చెడ్డ', 'భయం', 'కోపం'],
    hi: ['दुखी', 'बुरा', 'डर', 'गुस्सा'],
    ta: ['துக்கம்', 'கெட்ட', 'பயம்', 'கோபம்']
  };

  const positive = positiveWords[language] || positiveWords.en;
  const negative = negativeWords[language] || negativeWords.en;

  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positive.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negative.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  const total = positiveCount + negativeCount;
  if (total === 0) {
    return { polarity: 0, subjectivity: 0, label: 'neutral' };
  }

  const polarity = (positiveCount - negativeCount) / total;
  let label = 'neutral';
  if (polarity > 0.1) label = 'positive';
  else if (polarity < -0.1) label = 'negative';

  return {
    polarity,
    subjectivity: total / text.split(' ').length,
    label,
    positiveCount,
    negativeCount
  };
}

function keywordBasedClassification(text, language) {
  const categories = {
    anxiety: {
      en: ['anxiety', 'anxious', 'worried', 'nervous', 'panic', 'stress', 'overwhelmed'],
      te: ['ఆందోళన', 'భయం', 'ఒత్తిడి'],
      hi: ['चिंता', 'घबराहट', 'तनाव'],
      ta: ['கவலை', 'பதற்றம', 'மன அழுத்தம்']
    },
    depression: {
      en: ['depression', 'depressed', 'sad', 'hopeless', 'empty', 'worthless'],
      te: ['నిరాశ', 'దుఃఖం', 'నిస్సహాయత'],
      hi: ['अवसाद', 'उदास', 'निराश'],
      ta: ['மனச்சோர்வு', 'துக்கம்', 'நம்பிக்கையின்மை']
    },
    stress: {
      en: ['stress', 'pressure', 'burden', 'overwhelmed', 'exhausted'],
      te: ['ఒత్తిడి', 'భారం', 'అలసట'],
      hi: ['तनाव', 'दबाव', 'थकान'],
      ta: ['மன அழுத்தம்', 'சுமை', 'களைப்பு']
    }
  };

  const lowerText = text.toLowerCase();
  const results = [];

  Object.entries(categories).forEach(([category, keywords]) => {
    const categoryKeywords = keywords[language] || keywords.en;
    let matches = 0;

    categoryKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) matches++;
    });

    if (matches > 0) {
      results.push({
        category,
        confidence: Math.min(matches / categoryKeywords.length, 1.0),
        matches
      });
    }
  });

  return {
    categories: results.sort((a, b) => b.confidence - a.confidence),
    confidence: results.length > 0 ? results[0].confidence : 0
  };
}

module.exports = router;