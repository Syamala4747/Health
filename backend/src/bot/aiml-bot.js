const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const { logger } = require('../utils/logger');

class AIMLBot {
  constructor() {
    this.patterns = new Map();
    this.templates = new Map();
    this.context = new Map(); // User context storage
    this.defaultResponses = [
      "I understand you're going through something difficult. Can you tell me more about how you're feeling?",
      "It sounds like you're dealing with some challenges. I'm here to listen and support you.",
      "Thank you for sharing that with me. How can I best help you right now?",
      "I hear you. Sometimes it helps to talk through what we're experiencing. What's on your mind?",
      "Your feelings are valid. Would you like to explore some coping strategies, or would you prefer to talk more about what's troubling you?"
    ];
    
    this.loadAIMLFiles();
  }

  async loadAIMLFiles() {
    try {
      const aimlDir = path.join(__dirname, 'aiml');
      const files = fs.readdirSync(aimlDir).filter(file => file.endsWith('.aiml'));
      
      let totalPatterns = 0;
      
      for (const file of files) {
        const filePath = path.join(aimlDir, file);
        const patternsLoaded = await this.loadAIMLFile(filePath);
        totalPatterns += patternsLoaded;
      }
      
      logger.info(`Loaded ${totalPatterns} AIML patterns from ${files.length} files`);
    } catch (error) {
      logger.error('Error loading AIML files:', error);
    }
  }

  async loadAIMLFile(filePath) {
    try {
      const xmlContent = fs.readFileSync(filePath, 'utf8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlContent);
      
      let patternsLoaded = 0;
      
      if (result.aiml && result.aiml.category) {
        for (const category of result.aiml.category) {
          if (category.pattern && category.template) {
            const pattern = this.normalizePattern(category.pattern[0]);
            const template = category.template[0];
            
            this.patterns.set(pattern, template);
            patternsLoaded++;
          }
        }
      }
      
      return patternsLoaded;
    } catch (error) {
      logger.error(`Error loading AIML file ${filePath}:`, error);
      return 0;
    }
  }

  normalizePattern(pattern) {
    if (typeof pattern === 'string') {
      return pattern.toUpperCase().trim();
    }
    return pattern.toString().toUpperCase().trim();
  }

  normalizeInput(input) {
    return input.toUpperCase().trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  async getResponse(input, options = {}) {
    try {
      const { userId, language = 'en', context = {} } = options;
      
      // Store user context
      if (userId) {
        this.context.set(userId, { ...this.context.get(userId), ...context });
      }

      const normalizedInput = this.normalizeInput(input);
      
      // Try exact pattern match first
      let response = this.findExactMatch(normalizedInput);
      
      // Try partial matches if no exact match
      if (!response) {
        response = this.findPartialMatch(normalizedInput);
      }
      
      // Use default response if no match found
      if (!response) {
        response = this.getDefaultResponse();
      }

      // Process template variables
      const processedResponse = this.processTemplate(response, {
        input: normalizedInput,
        userId,
        context: this.context.get(userId) || {}
      });

      return {
        response: processedResponse,
        confidence: response ? 0.8 : 0.3,
        intent: this.detectIntent(normalizedInput),
        suggestions: this.getSuggestions(normalizedInput)
      };

    } catch (error) {
      logger.error('AIML bot error:', error);
      return {
        response: "I'm sorry, I'm having trouble understanding right now. Could you please rephrase that?",
        confidence: 0.1,
        intent: 'unknown',
        suggestions: []
      };
    }
  }

  findExactMatch(input) {
    return this.patterns.get(input);
  }

  findPartialMatch(input) {
    const words = input.split(' ');
    
    // Try to find patterns that contain key words from input
    for (const [pattern, template] of this.patterns.entries()) {
      const patternWords = pattern.split(' ');
      
      // Check if input contains significant words from pattern
      const matchingWords = words.filter(word => 
        word.length > 2 && patternWords.includes(word)
      );
      
      if (matchingWords.length >= Math.min(2, words.length * 0.5)) {
        return template;
      }
    }
    
    // Try wildcard matching for common patterns
    for (const [pattern, template] of this.patterns.entries()) {
      if (pattern.includes('*') || this.matchesWildcardPattern(input, pattern)) {
        return template;
      }
    }
    
    return null;
  }

  matchesWildcardPattern(input, pattern) {
    // Simple wildcard matching - can be enhanced
    const regex = pattern
      .replace(/\*/g, '.*')
      .replace(/\s+/g, '\\s+');
    
    try {
      return new RegExp(`^${regex}$`, 'i').test(input);
    } catch (error) {
      return false;
    }
  }

  getDefaultResponse() {
    const randomIndex = Math.floor(Math.random() * this.defaultResponses.length);
    return this.defaultResponses[randomIndex];
  }

  processTemplate(template, variables) {
    if (typeof template !== 'string') {
      return template.toString();
    }

    let processed = template;
    
    // Replace common template variables
    processed = processed.replace(/<star\/>/g, variables.input || '');
    processed = processed.replace(/<that\/>/g, '');
    processed = processed.replace(/<get name="([^"]+)"\/>/g, (match, name) => {
      return variables.context[name] || '';
    });
    
    // Remove any remaining XML tags
    processed = processed.replace(/<[^>]*>/g, '');
    
    return processed.trim();
  }

  detectIntent(input) {
    const intents = {
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
      farewell: ['bye', 'goodbye', 'see you', 'farewell'],
      help: ['help', 'assist', 'support', 'what can you do'],
      assessment: ['test', 'assessment', 'questionnaire', 'phq', 'gad', 'depression', 'anxiety'],
      crisis: ['suicide', 'kill myself', 'hurt myself', 'die', 'end my life'],
      emotion: ['sad', 'happy', 'angry', 'anxious', 'depressed', 'stressed', 'worried'],
      counselor: ['counselor', 'therapist', 'professional', 'human help', 'talk to someone'],
      resources: ['resources', 'articles', 'videos', 'help materials', 'information']
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => input.toLowerCase().includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }

  getSuggestions(input) {
    const intent = this.detectIntent(input);
    
    const suggestions = {
      greeting: [
        "How are you feeling today?",
        "What would you like to talk about?",
        "Would you like to take a mental health assessment?"
      ],
      emotion: [
        "Tell me more about how you're feeling",
        "Would you like some coping strategies?",
        "Have you considered talking to a counselor?"
      ],
      assessment: [
        "Take PHQ-9 depression assessment",
        "Take GAD-7 anxiety assessment",
        "Learn about mental health assessments"
      ],
      crisis: [
        "Get immediate help",
        "Contact crisis hotline",
        "Find emergency resources"
      ],
      counselor: [
        "Browse available counselors",
        "Book a counseling session",
        "Learn about counseling services"
      ],
      resources: [
        "Browse wellness articles",
        "Watch helpful videos",
        "Try mindfulness exercises"
      ]
    };

    return suggestions[intent] || [
      "Tell me more about that",
      "How can I help you today?",
      "Would you like to explore some resources?"
    ];
  }

  // Method to add new patterns dynamically
  addPattern(pattern, template) {
    const normalizedPattern = this.normalizePattern(pattern);
    this.patterns.set(normalizedPattern, template);
    logger.info(`Added new AIML pattern: ${normalizedPattern}`);
  }

  // Method to get bot statistics
  getStats() {
    return {
      totalPatterns: this.patterns.size,
      activeContexts: this.context.size,
      defaultResponses: this.defaultResponses.length
    };
  }

  // Method to clear user context (for privacy)
  clearUserContext(userId) {
    this.context.delete(userId);
    logger.info(`Cleared context for user ${userId}`);
  }
}

module.exports = { AIMLBot };