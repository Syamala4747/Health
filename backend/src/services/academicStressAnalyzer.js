/**
 * Academic Stress Correlation Engine
 * Correlates mental health with academic performance and calendar events
 */

const { createDocument, queryDocuments, updateDocument, COLLECTIONS } = require('../config/firebase');
const { logger } = require('../utils/logger');

class AcademicStressAnalyzer {
  constructor() {
    this.academicCalendar = this.loadAcademicCalendar();
    this.stressPatterns = new Map();
    this.predictiveModels = this.initializePredictiveModels();
    
    logger.info('Academic Stress Analyzer initialized');
  }

  loadAcademicCalendar() {
    return {
      '2024': {
        examPeriods: [
          { name: 'Mid-Semester Exams', start: '2024-03-15', end: '2024-03-25', stress_level: 'high' },
          { name: 'End-Semester Exams', start: '2024-05-10', end: '2024-05-25', stress_level: 'very_high' },
          { name: 'Supplementary Exams', start: '2024-07-01', end: '2024-07-10', stress_level: 'high' },
          { name: 'Semester Exams', start: '2024-11-15', end: '2024-11-30', stress_level: 'very_high' }
        ],
        stressfulEvents: [
          { name: 'Admission Results', date: '2024-08-15', stress_level: 'very_high', affected_groups: ['new_students'] },
          { name: 'Placement Season', start: '2024-09-01', end: '2024-12-31', stress_level: 'high', affected_groups: ['final_year'] },
          { name: 'Assignment Deadlines', recurring: 'monthly', stress_level: 'medium' },
          { name: 'Semester Registration', start: '2024-01-15', end: '2024-01-25', stress_level: 'medium' },
          { name: 'Result Declaration', dates: ['2024-04-15', '2024-06-30', '2024-12-15'], stress_level: 'high' }
        ],
        holidays: [
          { name: 'Winter Break', start: '2024-12-20', end: '2025-01-05', stress_level: 'low' },
          { name: 'Summer Break', start: '2024-06-01', end: '2024-07-31', stress_level: 'low' }
        ],
        regionalEvents: {
          'Kashmir Valley': [
            { name: 'Connectivity Issues Period', start: '2024-08-05', end: '2024-08-15', stress_level: 'high' },
            { name: 'Winter Closure Risk', start: '2024-12-01', end: '2024-02-28', stress_level: 'medium' }
          ],
          'Jammu Region': [
            { name: 'Extreme Heat Period', start: '2024-05-15', end: '2024-07-15', stress_level: 'medium' }
          ],
          'Ladakh': [
            { name: 'Isolation Period', start: '2024-11-01', end: '2024-03-31', stress_level: 'high' },
            { name: 'Tourist Season Disruption', start: '2024-06-01', end: '2024-09-30', stress_level: 'low' }
          ]
        }
      }
    };
  }

  initializePredictiveModels() {
    return {
      stressPredictor: {
        examProximityWeight: 0.4,
        historicalPatternWeight: 0.3,
        personalFactorsWeight: 0.2,
        regionalFactorsWeight: 0.1
      },
      interventionTriggers: {
        phq9_threshold: 10, // Moderate depression
        gad7_threshold: 8,  // Moderate anxiety
        stress_increase_rate: 0.3, // 30% increase from baseline
        consecutive_bad_days: 3
      }
    };
  }

  async analyzeStudentStressPattern(userId, assessmentData) {
    try {
      const currentDate = new Date();
      const academicContext = this.getCurrentAcademicContext(currentDate);
      const historicalData = await this.getStudentHistoricalData(userId);
      const stressAnalysis = await this.correlateWithAcademicEvents(userId, assessmentData, academicContext);
      
      // Store analysis
      const analysisId = await this.storeStressAnalysis(userId, stressAnalysis);
      
      // Check for intervention triggers
      const interventionNeeded = await this.checkInterventionTriggers(userId, stressAnalysis);
      
      if (interventionNeeded.required) {
        await this.triggerProactiveIntervention(userId, interventionNeeded);
      }

      return {
        analysisId,
        currentStressLevel: stressAnalysis.currentStressLevel,
        academicContext: academicContext,
        predictions: stressAnalysis.predictions,
        interventionTriggered: interventionNeeded.required,
        recommendations: this.generateRecommendations(stressAnalysis)
      };

    } catch (error) {
      logger.error('Academic stress analysis failed:', error);
      throw error;
    }
  }

  getCurrentAcademicContext(date) {
    const year = date.getFullYear().toString();
    const calendar = this.academicCalendar[year];
    if (!calendar) return { context: 'normal', stress_level: 'low' };

    const currentDateStr = date.toISOString().split('T')[0];
    
    // Check exam periods
    for (const exam of calendar.examPeriods) {
      if (currentDateStr >= exam.start && currentDateStr <= exam.end) {
        return {
          context: 'exam_period',
          event: exam.name,
          stress_level: exam.stress_level,
          days_remaining: this.calculateDaysUntil(exam.end)
        };
      }
      
      // Check if exam is approaching (within 2 weeks)
      const daysUntilExam = this.calculateDaysUntil(exam.start);
      if (daysUntilExam > 0 && daysUntilExam <= 14) {
        return {
          context: 'pre_exam',
          event: exam.name,
          stress_level: 'medium',
          days_until: daysUntilExam
        };
      }
    }

    // Check stressful events
    for (const event of calendar.stressfulEvents) {
      if (event.date && currentDateStr === event.date) {
        return {
          context: 'stressful_event',
          event: event.name,
          stress_level: event.stress_level
        };
      }
      
      if (event.start && event.end && currentDateStr >= event.start && currentDateStr <= event.end) {
        return {
          context: 'stressful_period',
          event: event.name,
          stress_level: event.stress_level,
          days_remaining: this.calculateDaysUntil(event.end)
        };
      }
    }

    return { context: 'normal', stress_level: 'low' };
  }

  async correlateWithAcademicEvents(userId, assessmentData, academicContext) {
    const user = await this.getUserDetails(userId);
    const region = this.determineRegion(user);
    const historicalBaseline = await this.calculateUserBaseline(userId);
    
    // Calculate stress correlation
    const stressCorrelation = this.calculateStressCorrelation(
      assessmentData,
      academicContext,
      historicalBaseline
    );

    // Generate predictions
    const predictions = this.generateStressPredictions(userId, academicContext, stressCorrelation);

    return {
      userId,
      timestamp: new Date().toISOString(),
      currentStressLevel: this.categorizeStressLevel(assessmentData),
      academicContext,
      region,
      correlation: stressCorrelation,
      predictions,
      baseline: historicalBaseline,
      riskFactors: this.identifyRiskFactors(assessmentData, academicContext, user)
    };
  }

  calculateStressCorrelation(assessmentData, academicContext, baseline) {
    const phqIncrease = (assessmentData.phq9_score || 0) - (baseline.avg_phq9 || 0);
    const gadIncrease = (assessmentData.gad7_score || 0) - (baseline.avg_gad7 || 0);
    
    // Academic stress multiplier based on context
    const contextMultiplier = {
      'exam_period': 1.5,
      'pre_exam': 1.2,
      'stressful_event': 1.3,
      'stressful_period': 1.1,
      'normal': 1.0
    };

    const multiplier = contextMultiplier[academicContext.context] || 1.0;
    
    return {
      phq9_correlation: phqIncrease * multiplier,
      gad7_correlation: gadIncrease * multiplier,
      academic_impact_score: this.calculateAcademicImpactScore(assessmentData, academicContext),
      stress_increase_rate: ((phqIncrease + gadIncrease) / 2) / (baseline.avg_total || 1),
      context_multiplier: multiplier
    };
  }

  generateStressPredictions(userId, academicContext, correlation) {
    const upcomingEvents = this.getUpcomingAcademicEvents();
    const predictions = [];

    for (const event of upcomingEvents) {
      const daysUntil = this.calculateDaysUntil(event.start || event.date);
      const predictedStressIncrease = this.predictStressIncrease(correlation, event);
      
      predictions.push({
        event: event.name,
        date: event.start || event.date,
        days_until: daysUntil,
        predicted_stress_level: event.stress_level,
        predicted_increase: predictedStressIncrease,
        intervention_recommended: predictedStressIncrease > 0.3,
        preparation_time: Math.max(daysUntil - 7, 0) // Start intervention 1 week before
      });
    }

    return predictions.sort((a, b) => a.days_until - b.days_until).slice(0, 5);
  }

  async checkInterventionTriggers(userId, analysis) {
    const triggers = this.predictiveModels.interventionTriggers;
    const reasons = [];
    
    // Check assessment scores
    if (analysis.currentStressLevel.phq9_score >= triggers.phq9_threshold) {
      reasons.push(`PHQ-9 score (${analysis.currentStressLevel.phq9_score}) indicates moderate depression`);
    }
    
    if (analysis.currentStressLevel.gad7_score >= triggers.gad7_threshold) {
      reasons.push(`GAD-7 score (${analysis.currentStressLevel.gad7_score}) indicates moderate anxiety`);
    }
    
    // Check stress increase rate
    if (analysis.correlation.stress_increase_rate >= triggers.stress_increase_rate) {
      reasons.push(`Stress levels increased by ${Math.round(analysis.correlation.stress_increase_rate * 100)}%`);
    }
    
    // Check academic context
    if (analysis.academicContext.stress_level === 'very_high') {
      reasons.push(`High-stress academic period: ${analysis.academicContext.event}`);
    }

    // Check consecutive assessments
    const recentAssessments = await this.getRecentAssessments(userId, 7); // Last 7 days
    const consecutiveBadDays = this.countConsecutiveBadDays(recentAssessments);
    
    if (consecutiveBadDays >= triggers.consecutive_bad_days) {
      reasons.push(`${consecutiveBadDays} consecutive days of concerning scores`);
    }

    return {
      required: reasons.length > 0,
      reasons,
      urgency: this.calculateInterventionUrgency(reasons.length, analysis),
      recommendedActions: this.getRecommendedInterventions(analysis)
    };
  }

  async triggerProactiveIntervention(userId, interventionData) {
    const interventionId = await createDocument(COLLECTIONS.PROACTIVE_INTERVENTIONS, {
      userId,
      type: 'academic_stress_prediction',
      urgency: interventionData.urgency,
      reasons: interventionData.reasons,
      recommendedActions: interventionData.recommendedActions,
      status: 'initiated',
      createdAt: new Date().toISOString()
    });

    // Notify counsellor
    await this.notifyCounsellorForIntervention(userId, interventionData);
    
    // Send supportive message to student
    await this.sendProactiveSupport(userId, interventionData);
    
    // Schedule follow-up
    await this.scheduleProactiveFollowUp(userId, interventionId);

    logger.info(`Proactive intervention triggered for user ${userId}`, {
      interventionId,
      urgency: interventionData.urgency,
      reasons: interventionData.reasons
    });

    return interventionId;
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Academic context recommendations
    if (analysis.academicContext.context === 'pre_exam') {
      recommendations.push({
        type: 'study_planning',
        title: 'Exam Preparation Support',
        description: 'Create a structured study plan to reduce pre-exam anxiety',
        priority: 'high',
        resources: ['study_techniques', 'time_management', 'exam_anxiety']
      });
    }
    
    if (analysis.academicContext.context === 'exam_period') {
      recommendations.push({
        type: 'stress_management',
        title: 'Exam Stress Relief',
        description: 'Practice relaxation techniques during exam period',
        priority: 'very_high',
        resources: ['breathing_exercises', 'quick_meditation', 'exam_tips']
      });
    }

    // Regional recommendations
    if (analysis.region === 'Kashmir Valley' && analysis.academicContext.stress_level !== 'low') {
      recommendations.push({
        type: 'connectivity_support',
        title: 'Offline Study Resources',
        description: 'Download study materials for potential connectivity issues',
        priority: 'medium',
        resources: ['offline_content', 'study_groups', 'local_support']
      });
    }

    // Predictive recommendations
    for (const prediction of analysis.predictions) {
      if (prediction.intervention_recommended) {
        recommendations.push({
          type: 'preventive_care',
          title: `Prepare for ${prediction.event}`,
          description: `Start stress management ${prediction.preparation_time} days before ${prediction.event}`,
          priority: prediction.predicted_increase > 0.5 ? 'high' : 'medium',
          timeline: `${prediction.days_until} days until event`
        });
      }
    }

    return recommendations;
  }

  // Utility methods
  calculateDaysUntil(dateString) {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getUpcomingAcademicEvents() {
    const year = new Date().getFullYear().toString();
    const calendar = this.academicCalendar[year];
    if (!calendar) return [];

    const today = new Date().toISOString().split('T')[0];
    const upcoming = [];

    // Add exam periods
    calendar.examPeriods.forEach(exam => {
      if (exam.start > today) {
        upcoming.push(exam);
      }
    });

    // Add stressful events
    calendar.stressfulEvents.forEach(event => {
      if (event.date && event.date > today) {
        upcoming.push(event);
      } else if (event.start && event.start > today) {
        upcoming.push(event);
      }
    });

    return upcoming;
  }

  async getUserDetails(userId) {
    // Implementation to get user details
    return { id: userId, region: 'Kashmir Valley' }; // Placeholder
  }

  determineRegion(user) {
    return user.region || 'Jammu Region';
  }

  // Get institutional statistics for admin dashboard
  async getInstitutionalStressAnalytics(timeframe = '30d') {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    const analyses = await queryDocuments(COLLECTIONS.STRESS_ANALYSES, [
      { field: 'timestamp', operator: '>=', value: startDate.toISOString() }
    ]);

    return {
      totalAnalyses: analyses.length,
      averageStressLevel: this.calculateAverageStressLevel(analyses),
      stressTrends: this.calculateStressTrends(analyses),
      academicCorrelations: this.calculateAcademicCorrelations(analyses),
      interventionsTriggered: await this.getInterventionStats(startDate),
      regionalBreakdown: this.getRegionalStressBreakdown(analyses),
      upcomingRisks: this.identifyUpcomingRisks()
    };
  }

  calculateAverageStressLevel(analyses) {
    if (analyses.length === 0) return 0;
    
    const totalStress = analyses.reduce((sum, analysis) => {
      return sum + (analysis.currentStressLevel.phq9_score || 0) + (analysis.currentStressLevel.gad7_score || 0);
    }, 0);
    
    return totalStress / (analyses.length * 2); // Divide by 2 for average of both scores
  }

  identifyUpcomingRisks() {
    const upcomingEvents = this.getUpcomingAcademicEvents();
    return upcomingEvents
      .filter(event => event.stress_level === 'high' || event.stress_level === 'very_high')
      .slice(0, 3)
      .map(event => ({
        event: event.name,
        date: event.start || event.date,
        days_until: this.calculateDaysUntil(event.start || event.date),
        expected_impact: event.stress_level,
        preparation_recommended: true
      }));
  }
}

module.exports = { AcademicStressAnalyzer };