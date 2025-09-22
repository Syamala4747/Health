const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * PHQ-9 Depression Assessment Service
 * Implements the Patient Health Questionnaire-9 for depression screening
 */
class PHQAssessment {
  constructor() {
    this.questions = [];
    this.sessions = new Map();
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      await this.loadQuestions();
      this.initialized = true;
      logger.info('✅ PHQ-9 Assessment initialized successfully');
    } catch (error) {
      logger.error('❌ PHQ-9 Assessment initialization failed:', error);
      this.loadDefaultQuestions();
    }
  }

  async loadQuestions() {
    const questionsPath = path.join(__dirname, '../bot/flows/phq9.json');
    
    try {
      const content = await fs.readFile(questionsPath, 'utf8');
      const data = JSON.parse(content);
      this.questions = data.questions;
    } catch (error) {
      logger.warn('PHQ-9 questions file not found, using defaults');
      this.loadDefaultQuestions();
    }
  }

  loadDefaultQuestions() {
    this.questions = [
      {
        id: 1,
        text: "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 2,
        text: "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 3,
        text: "Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 4,
        text: "Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 5,
        text: "Over the last 2 weeks, how often have you been bothered by poor appetite or overeating?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 6,
        text: "Over the last 2 weeks, how often have you been bothered by feeling bad about yourself or that you are a failure or have let yourself or your family down?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 7,
        text: "Over the last 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading the newspaper or watching television?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 8,
        text: "Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 9,
        text: "Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead, or of hurting yourself?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      }
    ];
  }

  async processStep(userId, step, answer = null, sessionId = null) {
    if (!this.initialized) {
      await this.init();
    }

    const currentSessionId = sessionId || this.generateSessionId(userId);
    
    // Initialize session if needed
    if (!this.sessions.has(currentSessionId)) {
      this.sessions.set(currentSessionId, {
        userId,
        answers: [],
        currentStep: 0,
        startTime: new Date()
      });
    }

    const session = this.sessions.get(currentSessionId);

    // If answer provided, store it
    if (answer !== null && step > 0 && step <= this.questions.length) {
      session.answers[step - 1] = answer;
      session.currentStep = step;
    }

    // Check if assessment is complete
    if (session.answers.length === this.questions.length) {
      const result = this.calculateScore(session.answers);
      this.sessions.delete(currentSessionId); // Clean up session
      return {
        completed: true,
        score: result.score,
        severity: result.severity,
        interpretation: result.interpretation,
        recommendations: result.recommendations,
        sessionId: currentSessionId
      };
    }

    // Return next question
    const nextStep = session.answers.length + 1;
    if (nextStep <= this.questions.length) {
      const question = this.questions[nextStep - 1];
      return {
        completed: false,
        step: nextStep,
        totalSteps: this.questions.length,
        question: question.text,
        options: question.options,
        sessionId: currentSessionId,
        progress: Math.round((session.answers.length / this.questions.length) * 100)
      };
    }

    // Should not reach here, but handle gracefully
    return {
      completed: false,
      error: 'Assessment flow error',
      sessionId: currentSessionId
    };
  }

  calculateScore(answers) {
    const totalScore = answers.reduce((sum, answer) => sum + answer, 0);
    
    let severity, interpretation, recommendations;

    if (totalScore >= 0 && totalScore <= 4) {
      severity = 'minimal';
      interpretation = 'Minimal depression symptoms. You appear to be experiencing very few symptoms of depression.';
      recommendations = [
        'Continue with your current self-care practices',
        'Maintain regular exercise and healthy sleep habits',
        'Stay connected with friends and family',
        'Consider mindfulness or meditation practices'
      ];
    } else if (totalScore >= 5 && totalScore <= 9) {
      severity = 'mild';
      interpretation = 'Mild depression symptoms. You may be experiencing some symptoms that could benefit from attention.';
      recommendations = [
        'Consider talking to a counsellor or therapist',
        'Increase physical activity and outdoor time',
        'Practice stress management techniques',
        'Maintain social connections and activities you enjoy',
        'Monitor your symptoms and seek help if they worsen'
      ];
    } else if (totalScore >= 10 && totalScore <= 14) {
      severity = 'moderate';
      interpretation = 'Moderate depression symptoms. Your symptoms are significant and may be impacting your daily life.';
      recommendations = [
        'Strongly consider professional counselling or therapy',
        'Speak with a healthcare provider about your symptoms',
        'Consider joining a support group',
        'Implement structured self-care routines',
        'Avoid alcohol and drugs as coping mechanisms'
      ];
    } else if (totalScore >= 15 && totalScore <= 19) {
      severity = 'moderately_severe';
      interpretation = 'Moderately severe depression symptoms. Your symptoms are quite significant and likely affecting multiple areas of your life.';
      recommendations = [
        'Seek professional help from a mental health provider immediately',
        'Consider both therapy and medication options',
        'Inform trusted friends or family about your situation',
        'Create a safety plan with professional guidance',
        'Avoid making major life decisions while experiencing these symptoms'
      ];
    } else if (totalScore >= 20) {
      severity = 'severe';
      interpretation = 'Severe depression symptoms. You are experiencing significant symptoms that require immediate professional attention.';
      recommendations = [
        'Seek immediate professional help from a mental health provider',
        'Contact your doctor or a mental health crisis line',
        'Consider intensive treatment options',
        'Ensure you have a strong support system in place',
        'If you have thoughts of self-harm, seek emergency help immediately'
      ];
    }

    // Check for suicidal ideation (question 9)
    const suicidalThoughts = answers[8] > 0; // Question 9 answer > 0
    if (suicidalThoughts) {
      recommendations.unshift('⚠️ IMPORTANT: You indicated thoughts of self-harm. Please contact a crisis helpline or emergency services immediately.');
    }

    return {
      score: totalScore,
      severity,
      interpretation,
      recommendations,
      suicidalThoughts,
      emergencyContact: suicidalThoughts ? {
        suicide: process.env.EMERGENCY_CONTACT_NUMBER || '988',
        crisis: process.env.CRISIS_TEXT_LINE || '741741'
      } : null
    };
  }

  generateSessionId(userId) {
    return `phq9_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async clearSession(userId, sessionId) {
    return this.sessions.delete(sessionId);
  }

  async getCompletedCount(userId) {
    // In a real implementation, this would query the database
    // For now, return 0 as sessions are cleared after completion
    return 0;
  }

  // Clean up old sessions
  cleanupOldSessions(maxAgeHours = 2) {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions) {
      if (session.startTime < cutoff) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = { PHQAssessment };