const { logger } = require('../utils/logger');
const { db } = require('../config/firebase');

class MLService {
  constructor() {
    this.models = {
      crisisDetection: null,
      sentimentAnalysis: null,
      riskAssessment: null
    };
    this.initializeModels();
  }

  async initializeModels() {
    try {
      // In production, load actual ML models here
      logger.info('Initializing ML models...');
      
      // Mock model initialization
      this.models.crisisDetection = {
        predict: this.detectCrisis.bind(this),
        confidence: 0.85
      };
      
      this.models.sentimentAnalysis = {
        predict: this.analyzeSentiment.bind(this),
        confidence: 0.80
      };
      
      this.models.riskAssessment = {
        predict: this.assessRisk.bind(this),
        confidence: 0.90
      };
      
      logger.info('ML models initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ML models:', error);
    }
  }

  // Crisis detection based on text analysis
  detectCrisis(text) {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead',
      'hurt myself', 'self harm', 'cutting', 'overdose', 'jump off', 'hang myself',
      'want to die', 'end my life', 'no point living', 'everyone would be better'
    ];
    
    const urgentKeywords = [
      'tonight', 'today', 'right now', 'immediately', 'can\'t take it',
      'final decision', 'goodbye', 'last time', 'planning to'
    ];
    
    const textLower = text.toLowerCase();
    let crisisScore = 0;
    let urgencyScore = 0;
    
    // Check for crisis keywords
    crisisKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        crisisScore += 1;
      }
    });
    
    // Check for urgency indicators
    urgentKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        urgencyScore += 1;
      }
    });
    
    const isCrisis = crisisScore > 0;
    const isUrgent = urgencyScore > 0;
    const confidence = Math.min(0.95, 0.6 + (crisisScore * 0.1) + (urgencyScore * 0.15));
    
    return {
      isCrisis,
      isUrgent,
      confidence,
      riskLevel: this.calculateRiskLevel(crisisScore, urgencyScore),
      detectedKeywords: crisisKeywords.filter(k => textLower.includes(k))
    };
  }

  // Sentiment analysis for chat messages
  analyzeSentiment(text) {
    const positiveWords = [
      'happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic',
      'better', 'improved', 'hopeful', 'optimistic', 'grateful', 'thankful'
    ];
    
    const negativeWords = [
      'sad', 'depressed', 'anxious', 'worried', 'scared', 'angry', 'frustrated',
      'hopeless', 'worthless', 'terrible', 'awful', 'horrible', 'devastating'
    ];
    
    const textLower = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (textLower.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (textLower.includes(word)) negativeScore++;
    });
    
    const totalScore = positiveScore + negativeScore;
    let sentiment = 'neutral';
    let confidence = 0.5;
    
    if (totalScore > 0) {
      const ratio = positiveScore / totalScore;
      if (ratio > 0.6) {
        sentiment = 'positive';
        confidence = 0.7 + (ratio - 0.6) * 0.75;
      } else if (ratio < 0.4) {
        sentiment = 'negative';
        confidence = 0.7 + (0.4 - ratio) * 0.75;
      }
    }
    
    return {
      sentiment,
      confidence: Math.min(0.95, confidence),
      positiveScore,
      negativeScore,
      emotionalIntensity: this.calculateEmotionalIntensity(positiveScore, negativeScore)
    };
  }

  // Risk assessment based on multiple factors
  assessRisk(assessmentData) {
    const { phq9Score = 0, gad7Score = 0, recentMessages = [], userHistory = {} } = assessmentData;
    
    let riskScore = 0;
    const factors = [];
    
    // PHQ-9 risk factors
    if (phq9Score >= 20) {
      riskScore += 0.4;
      factors.push('Severe depression symptoms');
    } else if (phq9Score >= 15) {
      riskScore += 0.3;
      factors.push('Moderately severe depression');
    } else if (phq9Score >= 10) {
      riskScore += 0.2;
      factors.push('Moderate depression');
    }
    
    // GAD-7 risk factors
    if (gad7Score >= 15) {
      riskScore += 0.3;
      factors.push('Severe anxiety symptoms');
    } else if (gad7Score >= 10) {
      riskScore += 0.2;
      factors.push('Moderate anxiety');
    }
    
    // Recent message analysis
    let negativeMessageCount = 0;
    let crisisIndicators = 0;
    
    recentMessages.forEach(message => {
      const sentiment = this.analyzeSentiment(message.content);
      const crisis = this.detectCrisis(message.content);
      
      if (sentiment.sentiment === 'negative') negativeMessageCount++;
      if (crisis.isCrisis) crisisIndicators++;
    });
    
    if (crisisIndicators > 0) {
      riskScore += 0.5;
      factors.push('Crisis indicators in recent messages');
    }
    
    if (negativeMessageCount > recentMessages.length * 0.7) {
      riskScore += 0.2;
      factors.push('Predominantly negative communication');
    }
    
    // Historical patterns
    if (userHistory.previousCrisisEvents > 0) {
      riskScore += 0.15;
      factors.push('Previous crisis events');
    }
    
    if (userHistory.frequentNegativeAssessments) {
      riskScore += 0.1;
      factors.push('Pattern of concerning assessments');
    }
    
    const riskLevel = this.calculateOverallRiskLevel(riskScore);
    
    return {
      riskScore: Math.min(1.0, riskScore),
      riskLevel,
      confidence: 0.85,
      factors,
      recommendations: this.generateRecommendations(riskLevel, factors)
    };
  }

  calculateRiskLevel(crisisScore, urgencyScore) {
    if (crisisScore > 2 || urgencyScore > 1) return 'critical';
    if (crisisScore > 0 || urgencyScore > 0) return 'high';
    return 'low';
  }

  calculateEmotionalIntensity(positiveScore, negativeScore) {
    const total = positiveScore + negativeScore;
    if (total === 0) return 'low';
    if (total >= 5) return 'high';
    if (total >= 3) return 'moderate';
    return 'low';
  }

  calculateOverallRiskLevel(score) {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'moderate';
    if (score >= 0.2) return 'mild';
    return 'low';
  }

  generateRecommendations(riskLevel, factors) {
    const recommendations = [];
    
    switch (riskLevel) {
      case 'critical':
        recommendations.push('Immediate professional intervention required');
        recommendations.push('Contact crisis hotline: 988');
        recommendations.push('Consider emergency services if in immediate danger');
        recommendations.push('Notify college counseling center immediately');
        break;
        
      case 'high':
        recommendations.push('Schedule urgent appointment with counselor');
        recommendations.push('Increase monitoring and check-ins');
        recommendations.push('Consider crisis safety planning');
        recommendations.push('Engage support network');
        break;
        
      case 'moderate':
        recommendations.push('Regular counseling sessions recommended');
        recommendations.push('Monitor symptoms closely');
        recommendations.push('Implement coping strategies');
        recommendations.push('Consider medication evaluation');
        break;
        
      case 'mild':
        recommendations.push('Continue current support level');
        recommendations.push('Practice self-care techniques');
        recommendations.push('Regular assessment monitoring');
        break;
        
      default:
        recommendations.push('Maintain preventive care');
        recommendations.push('Continue healthy lifestyle practices');
    }
    
    return recommendations;
  }

  // Analyze assessment trends over time
  async analyzeAssessmentTrends(userId, timeframe = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (timeframe * 24 * 60 * 60 * 1000));
      
      const assessmentsSnapshot = await db.collection('assessments')
        .where('userId', '==', userId)
        .where('createdAt', '>=', startDate)
        .orderBy('createdAt', 'asc')
        .get();
      
      const assessments = [];
      assessmentsSnapshot.forEach(doc => {
        assessments.push({ id: doc.id, ...doc.data() });
      });
      
      if (assessments.length < 2) {
        return {
          trend: 'insufficient_data',
          confidence: 0.1,
          message: 'Need more assessments to determine trend'
        };
      }
      
      // Calculate trend
      const phq9Scores = assessments.filter(a => a.type === 'PHQ9').map(a => a.score);
      const gad7Scores = assessments.filter(a => a.type === 'GAD7').map(a => a.score);
      
      const phq9Trend = this.calculateTrend(phq9Scores);
      const gad7Trend = this.calculateTrend(gad7Scores);
      
      return {
        phq9Trend,
        gad7Trend,
        overallTrend: this.combineTraends(phq9Trend, gad7Trend),
        assessmentCount: assessments.length,
        timeframe,
        confidence: Math.min(0.9, 0.5 + (assessments.length * 0.1))
      };
      
    } catch (error) {
      logger.error('Error analyzing assessment trends:', error);
      throw error;
    }
  }

  calculateTrend(scores) {
    if (scores.length < 2) return { direction: 'stable', magnitude: 0 };
    
    const first = scores[0];
    const last = scores[scores.length - 1];
    const change = last - first;
    const percentChange = (change / first) * 100;
    
    let direction = 'stable';
    if (percentChange > 10) direction = 'worsening';
    else if (percentChange < -10) direction = 'improving';
    
    return {
      direction,
      magnitude: Math.abs(percentChange),
      change,
      firstScore: first,
      lastScore: last
    };
  }

  combineTraends(phq9Trend, gad7Trend) {
    // Simple combination logic - can be made more sophisticated
    if (phq9Trend.direction === 'worsening' || gad7Trend.direction === 'worsening') {
      return 'worsening';
    } else if (phq9Trend.direction === 'improving' && gad7Trend.direction === 'improving') {
      return 'improving';
    } else {
      return 'stable';
    }
  }

  // Generate personalized insights
  generatePersonalizedInsights(userData) {
    const insights = [];
    
    // Based on assessment patterns
    if (userData.assessmentTrends?.overallTrend === 'improving') {
      insights.push({
        type: 'positive',
        message: 'Your mental health scores show improvement over time. Keep up the good work!',
        confidence: 0.8
      });
    }
    
    // Based on usage patterns
    if (userData.aiChatFrequency > 5) {
      insights.push({
        type: 'engagement',
        message: 'You\'re actively engaging with mental health resources. This shows great self-awareness.',
        confidence: 0.7
      });
    }
    
    // Based on risk factors
    if (userData.riskAssessment?.riskLevel === 'high') {
      insights.push({
        type: 'concern',
        message: 'Your recent responses indicate you may benefit from additional support. Consider reaching out to a counselor.',
        confidence: 0.9
      });
    }
    
    return insights;
  }
}

module.exports = new MLService();