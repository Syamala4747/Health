const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * GAD-7 Anxiety Assessment Service
 * Implements the Generalized Anxiety Disorder 7-item scale
 */
class GADAssessment {
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
      logger.info('✅ GAD-7 Assessment initialized successfully');
    } catch (error) {
      logger.error('❌ GAD-7 Assessment initialization failed:', error);
      this.loadDefaultQuestions();
    }
  }

  async loadQuestions() {
    const questionsPath = path.join(__dirname, '../bot/flows/gad7.json');
    
    try {
      const content = await fs.readFile(questionsPath, 'utf8');
      const data = JSON.parse(content);
      this.questions = data.questions;
    } catch (error) {
      logger.warn('GAD-7 questions file not found, using defaults');
      this.loadDefaultQuestions();
    }
  }

  loadDefaultQuestions() {
    this.questions = [
      {
        id: 1,
        text: "Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 2,
        text: "Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 3,
        text: "Over the last 2 weeks, how often have you been bothered by worrying too much about different things?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 4,
        text: "Over the last 2 weeks, how often have you been bothered by trouble relaxing?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 5,
        text: "Over the last 2 weeks, how often have you been bothered by being so restless that it is hard to sit still?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 6,
        text: "Over the last 2 weeks, how often have you been bothered by becoming easily annoyed or irritable?",
        options: [
          { value: 0, text: "Not at all" },
          { value: 1, text: "Several days" },
          { value: 2, text: "More than half the days" },
          { value: 3, text: "Nearly every day" }
        ]
      },
      {
        id: 7,
        text: "Over the last 2 weeks, how often have you been bothered by feeling afraid, as if something awful might happen?",
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
      interpretation = 'Minimal anxiety symptoms. You appear to be experiencing very few symptoms of anxiety.';
      recommendations = [
        'Continue with your current stress management practices',
        'Maintain regular exercise and relaxation activities',
        'Practice deep breathing or mindfulness when stressed',
        'Keep a healthy work-life balance'
      ];
    } else if (totalScore >= 5 && totalScore <= 9) {
      severity = 'mild';
      interpretation = 'Mild anxiety symptoms. You may be experiencing some anxiety that could benefit from attention.';
      recommendations = [
        'Learn and practice relaxation techniques',
        'Consider regular exercise or yoga',
        'Try mindfulness or meditation practices',
        'Limit caffeine and alcohol intake',
        'Talk to someone you trust about your worries'
      ];
    } else if (totalScore >= 10 && totalScore <= 14) {
      severity = 'moderate';
      interpretation = 'Moderate anxiety symptoms. Your anxiety levels are significant and may be impacting your daily functioning.';
      recommendations = [
        'Consider speaking with a counsellor or therapist',
        'Learn cognitive-behavioral techniques for managing anxiety',
        'Practice regular stress-reduction activities',
        'Consider joining an anxiety support group',
        'Speak with a healthcare provider about your symptoms'
      ];
    } else if (totalScore >= 15) {
      severity = 'severe';
      interpretation = 'Severe anxiety symptoms. You are experiencing significant anxiety that likely requires professional attention.';
      recommendations = [
        'Seek professional help from a mental health provider',
        'Consider both therapy and medication options with a doctor',
        'Learn emergency anxiety management techniques',
        'Inform trusted friends or family about your situation',
        'Avoid self-medicating with alcohol or drugs',
        'Consider intensive treatment if symptoms are overwhelming'
      ];
    }

    return {
      score: totalScore,
      severity,
      interpretation,
      recommendations,
      copingStrategies: this.getCopingStrategies(severity),
      emergencyResources: severity === 'severe' ? {
        crisis: process.env.CRISIS_TEXT_LINE || '741741',
        anxiety: 'Anxiety and Depression Association of America: 240-485-1001'
      } : null
    };
  }

  getCopingStrategies(severity) {
    const strategies = {
      minimal: [
        '4-7-8 breathing technique',
        'Progressive muscle relaxation',
        'Regular physical activity',
        'Maintain social connections'
      ],
      mild: [
        'Deep breathing exercises',
        'Mindfulness meditation',
        'Regular sleep schedule',
        'Limit news and social media',
        'Grounding techniques (5-4-3-2-1 method)'
      ],
      moderate: [
        'Cognitive restructuring techniques',
        'Scheduled worry time',
        'Regular therapy sessions',
        'Anxiety management apps',
        'Support group participation'
      ],
      severe: [
        'Professional crisis management plan',
        'Medication compliance if prescribed',
        'Intensive therapy or counseling',
        'Emergency contact list',
        'Hospitalization if necessary'
      ]
    };

    return strategies[severity] || strategies.minimal;
  }

  generateSessionId(userId) {
    return `gad7_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

module.exports = { GADAssessment };