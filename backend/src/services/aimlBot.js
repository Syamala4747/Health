const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * AIML Bot Service
 * Handles deterministic responses using AIML patterns
 */
class AIMLBot {
  constructor() {
    this.patterns = new Map();
    this.sessions = new Map();
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      await this.loadAIMLFiles();
      this.initialized = true;
      logger.info('✅ AIML Bot initialized successfully');
    } catch (error) {
      logger.error('❌ AIML Bot initialization failed:', error);
    }
  }

  async loadAIMLFiles() {
    const aimlDir = path.join(__dirname, '../bot/aiml');
    
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(aimlDir, { recursive: true });
      
      // Load all AIML files
      const files = await fs.readdir(aimlDir);
      const aimlFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of aimlFiles) {
        const filePath = path.join(aimlDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const patterns = JSON.parse(content);
        
        // Merge patterns into main patterns map
        Object.entries(patterns).forEach(([key, value]) => {
          this.patterns.set(key.toLowerCase(), value);
        });
      }
      
      logger.info(`Loaded ${this.patterns.size} AIML patterns from ${aimlFiles.length} files`);
    } catch (error) {
      logger.warn('No AIML files found, using default patterns');
      this.loadDefaultPatterns();
    }
  }

  loadDefaultPatterns() {
    const defaultPatterns = {
      // Greetings
      'hello': {
        responses: [
          'Hello! I\'m here to support you. How are you feeling today?',
          'Hi there! I\'m glad you\'re here. What\'s on your mind?',
          'Hello! I\'m your AI counsellor. How can I help you today?'
        ],
        suggestions: ['I\'m feeling anxious', 'I need someone to talk to', 'Tell me about mental health']
      },
      'hi': {
        responses: [
          'Hi! I\'m here to listen and support you. How are you doing?',
          'Hello! What would you like to talk about today?'
        ],
        suggestions: ['I\'m not feeling well', 'I need help', 'Just checking in']
      },
      'good morning': {
        responses: [
          'Good morning! I hope you\'re having a peaceful start to your day.',
          'Good morning! How are you feeling this morning?'
        ],
        suggestions: ['I\'m feeling good', 'I\'m struggling today', 'Tell me something positive']
      },
      
      // Mental health topics
      'anxiety': {
        responses: [
          'I understand that anxiety can be overwhelming. Would you like to try some breathing exercises or talk about what\'s making you anxious?',
          'Anxiety is very common, and you\'re not alone. What specific situations make you feel anxious?'
        ],
        suggestions: ['Breathing exercises', 'Talk about triggers', 'Coping strategies']
      },
      'depression': {
        responses: [
          'I\'m sorry you\'re going through this. Depression can make everything feel difficult. Would you like to talk about how you\'re feeling?',
          'Thank you for sharing that with me. Depression affects many people, and seeking support is a brave step.'
        ],
        suggestions: ['I feel hopeless', 'I need professional help', 'Self-care tips']
      },
      'stress': {
        responses: [
          'Stress can really impact our wellbeing. What\'s been causing you the most stress lately?',
          'I hear that you\'re feeling stressed. Let\'s talk about some ways to manage it.'
        ],
        suggestions: ['Work stress', 'School pressure', 'Relaxation techniques']
      },
      
      // Support and encouragement
      'help': {
        responses: [
          'I\'m here to help you. You can talk to me about anything that\'s bothering you, or I can guide you through some mental health assessments.',
          'Of course I\'ll help! What kind of support are you looking for today?'
        ],
        suggestions: ['Take an assessment', 'Just need to talk', 'Find resources']
      },
      'lonely': {
        responses: [
          'Feeling lonely can be really painful. I\'m here with you right now. Would you like to talk about what\'s making you feel this way?',
          'You\'re not alone, even when it feels that way. I\'m here to listen and support you.'
        ],
        suggestions: ['Tell me more', 'I need human connection', 'Coping with loneliness']
      },
      'scared': {
        responses: [
          'It takes courage to share that you\'re scared. I\'m here to support you. What\'s frightening you?',
          'Feeling scared is completely valid. You\'re safe here with me. Would you like to talk about it?'
        ],
        suggestions: ['I\'m afraid of the future', 'I have panic attacks', 'I need reassurance']
      },
      
      // Positive responses
      'good': {
        responses: [
          'I\'m so glad to hear you\'re doing well! What\'s been going particularly good for you?',
          'That\'s wonderful! It\'s important to acknowledge when we\'re feeling good.'
        ],
        suggestions: ['Share good news', 'Gratitude practice', 'Keep the momentum']
      },
      'better': {
        responses: [
          'I\'m happy to hear you\'re feeling better! What helped you get to this point?',
          'That\'s great progress! Healing isn\'t always linear, so celebrate these better moments.'
        ],
        suggestions: ['What helped me', 'I want to maintain this', 'Share my progress']
      },
      
      // Default fallbacks
      'default': {
        responses: [
          'I hear you. Can you tell me more about what you\'re experiencing?',
          'Thank you for sharing that with me. How does that make you feel?',
          'I\'m listening. Would you like to explore this topic further?',
          'That sounds important to you. Can you help me understand better?'
        ],
        suggestions: ['Tell me more', 'I need different help', 'Talk to a human counsellor']
      }
    };

    Object.entries(defaultPatterns).forEach(([key, value]) => {
      this.patterns.set(key, value);
    });
  }

  async getResponse(message, userId, sessionId = null, language = 'en') {
    if (!this.initialized) {
      await this.init();
    }

    const normalizedMessage = message.toLowerCase().trim();
    const currentSessionId = sessionId || this.generateSessionId(userId);
    
    // Initialize session if needed
    if (!this.sessions.has(currentSessionId)) {
      this.sessions.set(currentSessionId, {
        userId,
        messages: [],
        context: {},
        startTime: new Date()
      });
    }

    const session = this.sessions.get(currentSessionId);
    session.messages.push({ type: 'user', message, timestamp: new Date() });

    // Find matching pattern
    let matchedPattern = null;
    let matchedKey = null;

    // Direct keyword matching
    for (const [key, pattern] of this.patterns) {
      if (normalizedMessage.includes(key)) {
        matchedPattern = pattern;
        matchedKey = key;
        break;
      }
    }

    // If no match found, use default
    if (!matchedPattern) {
      matchedPattern = this.patterns.get('default');
      matchedKey = 'default';
    }

    // Select response
    const responses = matchedPattern.responses;
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Add response to session
    session.messages.push({ 
      type: 'bot', 
      message: selectedResponse, 
      timestamp: new Date(),
      pattern: matchedKey
    });

    // Update session context
    session.context.lastPattern = matchedKey;
    session.context.lastResponse = selectedResponse;

    return {
      response: selectedResponse,
      suggestions: matchedPattern.suggestions || [],
      sessionId: currentSessionId,
      pattern: matchedKey
    };
  }

  generateSessionId(userId) {
    return `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getUserConversationCount(userId) {
    let count = 0;
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId) {
        count += session.messages.filter(m => m.type === 'user').length;
      }
    }
    return count;
  }

  async getLastActivity(userId) {
    let lastActivity = null;
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId && session.messages.length > 0) {
        const lastMessage = session.messages[session.messages.length - 1];
        if (!lastActivity || lastMessage.timestamp > lastActivity) {
          lastActivity = lastMessage.timestamp;
        }
      }
    }
    return lastActivity;
  }

  clearSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  // Clean up old sessions (call periodically)
  cleanupOldSessions(maxAgeHours = 24) {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions) {
      if (session.startTime < cutoff) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = { AIMLBot };