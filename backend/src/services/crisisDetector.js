const axios = require('axios');
const { logger } = require('../utils/logger');

/**
 * Crisis Detection Service
 * Analyzes text for potential crisis situations using ML models
 */
class CrisisDetector {
  constructor() {
    this.threshold = parseFloat(process.env.CRISIS_DETECTION_THRESHOLD) || 0.8;
    this.mlServiceUrl = process.env.ML_SERVICE_URL;
    this.huggingFaceKey = process.env.HUGGINGFACE_API_KEY;
    this.crisisKeywords = this.loadCrisisKeywords();
    this.initialized = true;
  }

  loadCrisisKeywords() {
    return {
      en: [
        'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
        'hurt myself', 'self harm', 'cut myself', 'overdose', 'jump off',
        'hang myself', 'shoot myself', 'no point living', 'life is meaningless',
        'everyone would be better without me', 'planning to die', 'goodbye forever',
        'final goodbye', 'can\'t go on', 'nothing left', 'hopeless', 'worthless'
      ],
      te: [
        'ఆత్మహత్య', 'చచ్చిపోవాలని', 'జీవితం అంతం', 'మరణించాలని', 'బతకలేను'
      ],
      hi: [
        'आत्महत्या', 'मरना चाहता हूं', 'जीवन समाप्त', 'मौत', 'जीना नहीं चाहता'
      ],
      ta: [
        'தற்கொலை', 'சாக வேண்டும்', 'வாழ்க்கை முடிவு', 'மரணம்', 'வாழ முடியாது'
      ]
    };
  }

  async analyze(message, language = 'en') {
    try {
      // First, check for obvious crisis keywords
      const keywordResult = this.checkCrisisKeywords(message, language);
      if (keywordResult.isCrisis) {
        return keywordResult;
      }

      // Try ML-based detection
      const mlResult = await this.mlAnalysis(message, language);
      if (mlResult) {
        return mlResult;
      }

      // Fallback to keyword-based detection with lower threshold
      return this.fallbackAnalysis(message, language);

    } catch (error) {
      logger.error('Crisis detection error:', error);
      // In case of error, err on the side of caution with keyword detection
      return this.checkCrisisKeywords(message, language, 0.5);
    }
  }

  checkCrisisKeywords(message, language, threshold = 0.8) {
    const normalizedMessage = message.toLowerCase();
    const keywords = this.crisisKeywords[language] || this.crisisKeywords.en;
    
    let matchCount = 0;
    const matchedKeywords = [];

    for (const keyword of keywords) {
      if (normalizedMessage.includes(keyword.toLowerCase())) {
        matchCount++;
        matchedKeywords.push(keyword);
      }
    }

    const confidence = Math.min(matchCount / 3, 1.0); // Normalize to 0-1
    const isCrisis = confidence >= threshold;

    if (isCrisis) {
      return {
        isCrisis: true,
        confidence,
        method: 'keyword',
        matchedKeywords,
        response: this.getCrisisResponse(language),
        recommendations: this.getCrisisRecommendations(language)
      };
    }

    return { isCrisis: false, confidence, method: 'keyword' };
  }

  async mlAnalysis(message, language) {
    try {
      // Try local ML service first
      if (this.mlServiceUrl) {
        const response = await axios.post(`${this.mlServiceUrl}/crisis-detect`, {
          text: message,
          language
        }, { timeout: 5000 });

        if (response.data && response.data.confidence >= this.threshold) {
          return {
            isCrisis: true,
            confidence: response.data.confidence,
            method: 'ml_local',
            response: this.getCrisisResponse(language),
            recommendations: this.getCrisisRecommendations(language)
          };
        }
      }

      // Try HuggingFace API as fallback
      if (this.huggingFaceKey) {
        const hfResponse = await this.huggingFaceAnalysis(message);
        if (hfResponse && hfResponse.confidence >= this.threshold) {
          return {
            isCrisis: true,
            confidence: hfResponse.confidence,
            method: 'huggingface',
            response: this.getCrisisResponse(language),
            recommendations: this.getCrisisRecommendations(language)
          };
        }
      }

      return null;
    } catch (error) {
      logger.warn('ML analysis failed:', error.message);
      return null;
    }
  }

  async huggingFaceAnalysis(message) {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/martin-ha/toxic-comment-model',
        { inputs: message },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      // This is a simplified example - you'd want a model specifically trained for crisis detection
      const result = response.data[0];
      if (result && Array.isArray(result)) {
        const toxicScore = result.find(r => r.label === 'TOXIC')?.score || 0;
        // Convert toxic score to crisis probability (this is a rough approximation)
        const crisisConfidence = Math.min(toxicScore * 1.2, 1.0);
        
        return {
          confidence: crisisConfidence,
          rawScore: toxicScore
        };
      }

      return null;
    } catch (error) {
      logger.warn('HuggingFace API error:', error.message);
      return null;
    }
  }

  fallbackAnalysis(message, language) {
    // More sophisticated pattern matching as fallback
    const patterns = {
      en: [
        /\b(want to|going to|plan to|thinking about).*(die|kill|end|suicide)\b/i,
        /\b(life is|feeling).*(hopeless|meaningless|worthless|pointless)\b/i,
        /\b(can't|cannot).*(go on|continue|take it|handle)\b/i,
        /\b(everyone|world).*(better without|better off without)\b/i
      ]
    };

    const messagePatterns = patterns[language] || patterns.en;
    let patternMatches = 0;

    for (const pattern of messagePatterns) {
      if (pattern.test(message)) {
        patternMatches++;
      }
    }

    const confidence = Math.min(patternMatches / 2, 1.0);
    const isCrisis = confidence >= 0.6; // Lower threshold for pattern matching

    if (isCrisis) {
      return {
        isCrisis: true,
        confidence,
        method: 'pattern',
        response: this.getCrisisResponse(language),
        recommendations: this.getCrisisRecommendations(language)
      };
    }

    return { isCrisis: false, confidence, method: 'pattern' };
  }

  getCrisisResponse(language = 'en') {
    const responses = {
      en: "I'm very concerned about what you've shared. Your life has value and there are people who want to help. Please reach out to a crisis counselor or emergency services immediately. You don't have to go through this alone.",
      te: "మీరు పంచుకున్న విషయం గురించి నేను చాలా ఆందోళన చెందుతున్నాను. మీ జీవితానికి విలువ ఉంది మరియు మీకు సహాయం చేయాలని అనుకునే వ్యక్తులు ఉన్నారు. దయచేసి వెంటనే సంక్షోభ సలహాదారుని లేదా అత్యవసర సేవలను సంప్రదించండి.",
      hi: "आपने जो साझा किया है उसके बारे में मैं बहुत चिंतित हूं। आपके जीवन का मूल्य है और ऐसे लोग हैं जो आपकी मदद करना चाहते हैं। कृपया तुरंत किसी संकट परामर्शदाता या आपातकालीन सेवाओं से संपर्क करें।",
      ta: "நீங்கள் பகிர்ந்துகொண்டது குறித்து நான் மிகவும் கவலைப்படுகிறேன். உங்கள் வாழ்க்கைக்கு மதிப்பு உண்டு மற்றும் உங்களுக்கு உதவ விரும்பும் நபர்கள் உள்ளனர். தயவுசெய்து உடனடியாக நெருக்கடி ஆலோசகர் அல்லது அவசர சேவைகளை தொடர்பு கொள்ளுங்கள்."
    };

    return responses[language] || responses.en;
  }

  getCrisisRecommendations(language = 'en') {
    const recommendations = {
      en: [
        'Call 988 (Suicide & Crisis Lifeline) - Available 24/7',
        'Text HOME to 741741 (Crisis Text Line)',
        'Go to your nearest emergency room',
        'Call 911 if in immediate danger',
        'Reach out to a trusted friend or family member',
        'Contact your therapist or counselor if you have one'
      ],
      te: [
        'సంక్షోభ హెల్ప్‌లైన్‌కు కాల్ చేయండి',
        'సమీప ఆసుపత్రికి వెళ్లండి',
        'విశ్వసనీయ స్నేహితుడు లేదా కుటుంబ సభ్యుడిని సంప్రదించండి',
        'మీకు థెరపిస్ట్ ఉంటే వారిని సంప్రదించండి'
      ],
      hi: [
        'संकट हेल्पलाइन पर कॉल करें',
        'निकटतम अस्पताल जाएं',
        'किसी विश्वसनीय मित्र या परिवारजन से संपर्क करें',
        'यदि आपका कोई थेरेपिस्ट है तो उनसे संपर्क करें'
      ],
      ta: [
        'நெருக்கடி உதவி எண்ணை அழைக்கவும்',
        'அருகிலுள்ள மருத்துவமனைக்கு செல்லுங்கள்',
        'நம்பகமான நண்பர் அல்லது குடும்ப உறுப்பினரை தொடர்பு கொள்ளுங்கள்',
        'உங்களுக்கு சிகிச்சையாளர் இருந்தால் அவர்களை தொடர்பு கொள்ளுங்கள்'
      ]
    };

    return recommendations[language] || recommendations.en;
  }

  // Method to update crisis keywords (for admin use)
  updateCrisisKeywords(language, keywords) {
    this.crisisKeywords[language] = keywords;
    logger.info(`Updated crisis keywords for language: ${language}`);
  }

  // Get statistics for admin dashboard
  getDetectionStats() {
    return {
      threshold: this.threshold,
      mlServiceAvailable: !!this.mlServiceUrl,
      huggingFaceAvailable: !!this.huggingFaceKey,
      supportedLanguages: Object.keys(this.crisisKeywords)
    };
  }
}

module.exports = { CrisisDetector };