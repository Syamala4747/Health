/**
 * Direct Universal AI Counselor for React
 * Responds based on user input and mood - No API required
 * Works immediately in browser environment
 */

class DirectUniversalCounselor {
  constructor() {
    this.emotionKeywords = {
      anxious: ['anxious', 'worried', 'nervous', 'scared', 'afraid', 'panic', 'stress', 'overwhelmed', 'tension'],
      depressed: ['sad', 'depressed', 'hopeless', 'down', 'empty', 'worthless', 'crying', 'despair', 'lonely'],
      angry: ['angry', 'mad', 'furious', 'frustrated', 'irritated', 'annoyed', 'rage', 'hate', 'upset'],
      excited: ['excited', 'happy', 'thrilled', 'amazing', 'wonderful', 'great', 'fantastic', 'awesome', 'joy'],
      confused: ['confused', 'lost', 'unsure', 'unclear', 'don\'t know', 'uncertain', 'mixed up'],
      stressed: ['stressed', 'pressure', 'deadline', 'overwhelmed', 'too much', 'busy', 'loaded'],
      tired: ['tired', 'exhausted', 'drained', 'fatigue', 'sleepy', 'worn out']
    };
    
    this.topicKeywords = {
      academic: ['exam', 'test', 'study', 'grade', 'homework', 'assignment', 'professor', 'class', 'university', 'college', 'school', 'presentation', 'project'],
      social: ['friend', 'relationship', 'family', 'lonely', 'isolated', 'social', 'party', 'group', 'roommate', 'dating', 'breakup'],
      career: ['job', 'career', 'work', 'interview', 'internship', 'resume', 'future', 'graduation', 'professional'],
      health: ['tired', 'sick', 'sleep', 'exercise', 'eating', 'health', 'doctor', 'energy']
    };
    
    this.responseTemplates = {
      anxious: [
        "I can sense the anxiety in your words, and I want you to know that what you're feeling is completely valid. Anxiety often comes when we care deeply about something. Let's work through this together - you don't have to face this alone.",
        "Your anxiety is understandable given what you're going through. When we feel anxious, our mind is trying to protect us, but sometimes it can feel overwhelming. What specific part of this situation feels most challenging right now?",
        "I hear the worry in what you're sharing. Anxiety can make everything feel more intense, but remember that you've handled difficult situations before. Let's break this down into manageable pieces."
      ],
      depressed: [
        "I can feel the heaviness in your words, and I want you to know that your feelings are completely valid. Depression can make everything feel harder, but you're not alone in this. Thank you for sharing with me - that takes courage.",
        "What you're experiencing sounds really difficult. Depression can make us feel isolated and hopeless, but please know that these feelings, while real and painful, are temporary. You matter, and your life has value.",
        "I hear the sadness in what you're telling me. Depression can make it hard to see beyond the current moment, but you've reached out today, which shows incredible strength. Let's explore some ways to support you through this."
      ],
      angry: [
        "I can sense the frustration in your words. Anger often tells us that something important to us has been threatened or hurt. Your feelings are valid - let's explore what's behind this anger together.",
        "It sounds like you're dealing with something really frustrating. Anger can be a signal that our boundaries have been crossed or our values challenged. What do you think triggered these feelings?",
        "I hear the intensity in what you're sharing. Anger is a natural emotion, and it's okay to feel this way. Let's work together to understand what's driving these feelings and find healthy ways to process them."
      ],
      excited: [
        "I can feel the positive energy in your words! It's wonderful to hear such enthusiasm. Excitement can be energizing and motivating - what's bringing you this joy?",
        "Your excitement is contagious! It's beautiful to experience these positive emotions. Sometimes when we're excited, it can be helpful to think about how to channel this energy constructively.",
        "I love hearing the happiness in what you're sharing! Positive emotions like excitement are so important for our wellbeing. Tell me more about what's making you feel this way."
      ],
      confused: [
        "I can understand feeling confused - it's completely normal when we're facing complex situations or decisions. Confusion often means we're processing a lot of information. Let's try to untangle this together.",
        "It sounds like you're dealing with some uncertainty, which can be really challenging. When we feel confused, it can help to break things down step by step. What feels most unclear to you right now?",
        "Confusion is often a sign that we're growing and learning. It's okay not to have all the answers right now. Let's explore what you do know and build from there."
      ],
      stressed: [
        "I can hear the stress in what you're sharing. Feeling overwhelmed is so common, especially when we have a lot on our plate. You're not alone in feeling this way, and there are ways we can work together to make things more manageable.",
        "Stress can make everything feel more difficult and urgent. What you're experiencing is valid - when we're stressed, our body and mind are working hard to cope. Let's look at some ways to ease this pressure.",
        "It sounds like you're carrying a heavy load right now. Stress is our body's way of responding to demands, but when it becomes overwhelming, it's important to find ways to manage it. What feels most pressing to you?"
      ],
      neutral: [
        "Thank you for sharing with me. I'm here to listen and support you in whatever way I can. What's on your mind today, and how can I best help you?",
        "I appreciate you reaching out. Sometimes it's not easy to put our thoughts and feelings into words. Take your time - I'm here to listen and support you.",
        "I'm glad you're here. Whether you're dealing with something specific or just need someone to talk to, I'm here to listen and help however I can."
      ]
    };
    
    this.copingStrategies = {
      anxious: [
        "Deep breathing: Try the 4-7-8 technique (breathe in for 4, hold for 7, exhale for 8)",
        "Grounding technique: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste",
        "Progressive muscle relaxation: Tense and release each muscle group",
        "Mindful observation: Focus on one object and describe it in detail",
        "Gentle movement like walking or stretching"
      ],
      depressed: [
        "Start with one small, achievable task to build momentum",
        "Reach out to someone you trust - connection can help lift mood",
        "Engage in gentle physical activity, even just a short walk",
        "Practice self-compassion - treat yourself like you would a good friend",
        "Create a simple daily routine to provide structure"
      ],
      angry: [
        "Take 10 deep breaths before responding to any situation",
        "Physical release: Try vigorous exercise or punch a pillow",
        "Write down your thoughts and feelings without censoring",
        "Step away from the trigger if possible to cool down",
        "Talk to someone you trust about what's bothering you"
      ],
      excited: [
        "Channel this energy into planning or goal-setting",
        "Share your excitement with others who care about you",
        "Write down what's making you happy to remember later",
        "Use this positive energy for creative activities",
        "Practice gratitude for this moment of joy"
      ],
      confused: [
        "Write down what you know vs. what you don't know",
        "Break the complex situation into smaller, manageable parts",
        "Talk through your thoughts with someone you trust",
        "Research or gather more information if needed",
        "Give yourself permission to take time to figure things out"
      ],
      stressed: [
        "Prioritize tasks: What absolutely must be done today?",
        "Take regular breaks, even if just for 5 minutes",
        "Practice time management techniques like the Pomodoro method",
        "Delegate tasks when possible",
        "Practice saying 'no' to additional commitments"
      ],
      general: [
        "Practice mindfulness or meditation for 5-10 minutes daily",
        "Maintain a regular sleep schedule",
        "Stay connected with supportive friends and family",
        "Engage in activities you enjoy",
        "Take care of your physical health with good nutrition and exercise"
      ]
    };
  }
  
  detectEmotionAndTopic(message) {
    const messageLower = message.toLowerCase();
    
    // Emotion detection
    const emotionScores = {};
    Object.entries(this.emotionKeywords).forEach(([emotion, keywords]) => {
      const score = keywords.filter(keyword => messageLower.includes(keyword)).length;
      if (score > 0) {
        emotionScores[emotion] = score / keywords.length;
      }
    });
    
    // Get primary emotion
    let emotion = 'neutral';
    let confidence = 0.5;
    
    if (Object.keys(emotionScores).length > 0) {
      const primaryEmotion = Object.entries(emotionScores)
        .reduce((a, b) => emotionScores[a[0]] > emotionScores[b[0]] ? a : b);
      emotion = primaryEmotion[0];
      confidence = primaryEmotion[1];
    }
    
    // Topic detection
    const detectedTopics = [];
    Object.entries(this.topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        detectedTopics.push(topic);
      }
    });
    
    if (detectedTopics.length === 0) {
      detectedTopics.push('general');
    }
    
    return {
      emotion,
      confidence,
      all_emotions: emotionScores,
      topics: detectedTopics
    };
  }
  
  getAIResponse(message, assessmentData = null) {
    // Detect emotion and topics
    const analysis = this.detectEmotionAndTopic(message);
    const { emotion, topics } = analysis;
    
    // Select appropriate response template
    const templates = this.responseTemplates[emotion] || this.responseTemplates.neutral;
    const baseResponse = templates[Math.floor(Math.random() * templates.length)];
    
    // Add topic-specific context
    const topicAdditions = {
      academic: " Academic pressures can feel overwhelming, but remember that learning is a process and it's okay to struggle sometimes.",
      social: " Relationships and social connections are so important for our wellbeing, and it's natural to have challenges in this area.",
      career: " Career decisions and planning can create anxiety, but remember that paths can evolve and change over time.",
      health: " Taking care of your physical and mental health is one of the most important things you can do for yourself."
    };
    
    let finalResponse = baseResponse;
    
    // Add relevant topic context
    for (const topic of topics) {
      if (topicAdditions[topic]) {
        finalResponse += topicAdditions[topic];
        break;
      }
    }
    
    // Add assessment context if available
    if (assessmentData && assessmentData.phq9Score) {
      const phqScore = assessmentData.phq9Score || 0;
      const gadScore = assessmentData.gad7Score || 0;
      
      if (phqScore > 10 || gadScore > 10) {
        finalResponse += " I notice from your assessment that you've been experiencing some significant challenges. Remember that seeking support is a sign of strength.";
      }
    }
    
    // Add encouraging question
    const questions = [
      " What feels most important to focus on right now?",
      " How have you handled similar feelings in the past?",
      " What would be most helpful for you in this moment?",
      " Is there someone in your support network you could reach out to?",
      " What would you tell a friend going through the same thing?"
    ];
    finalResponse += questions[Math.floor(Math.random() * questions.length)];
    
    // Get coping strategies
    const strategies = this.copingStrategies[emotion] || this.copingStrategies.general;
    const selectedStrategies = this.shuffleArray(strategies).slice(0, 3);
    
    // Risk assessment
    const riskLevel = this.assessRisk(message, emotion);
    
    return {
      response: finalResponse,
      mood_analysis: {
        primary_emotion: emotion,
        confidence: analysis.confidence,
        all_emotions: analysis.all_emotions
      },
      topics: topics,
      coping_strategies: selectedStrategies,
      risk_assessment: riskLevel,
      success: true
    };
  }
  
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  assessRisk(message, emotion) {
    const highRiskKeywords = ['suicide', 'kill myself', 'end it all', 'want to die', 'self-harm', 'hurt myself'];
    const moderateRiskKeywords = ['hopeless', 'worthless', 'can\'t go on', 'no point', 'give up'];
    
    const messageLower = message.toLowerCase();
    
    if (highRiskKeywords.some(keyword => messageLower.includes(keyword))) {
      return {
        risk_level: 'high',
        recommendation: 'Please reach out to a mental health professional or crisis hotline immediately. You don\'t have to go through this alone.',
        resources: ['National Suicide Prevention Lifeline: 988', 'Crisis Text Line: Text HOME to 741741']
      };
    } else if (moderateRiskKeywords.some(keyword => messageLower.includes(keyword))) {
      return {
        risk_level: 'moderate',
        recommendation: 'I encourage you to speak with a counselor or trusted friend about these feelings.',
        resources: ['Campus counseling center', 'Student support services']
      };
    } else {
      return {
        risk_level: 'low',
        recommendation: 'Continue taking care of yourself and reach out for support when needed.',
        resources: ['Self-care activities', 'Peer support groups']
      };
    }
  }
}

// Export for use in React
export default DirectUniversalCounselor;