import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Card, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

const MessageBubble = ({ message, isUser, timestamp }) => (
  <View style={[styles.messageBubble, isUser ? styles.userMessage : styles.botMessage]}>
    <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.botMessageText]}>
      {message}
    </Text>
    <Text style={styles.timestamp}>{timestamp}</Text>
  </View>
);

const SuggestedPrompts = ({ onPromptSelect }) => {
  const { t } = useLanguage();
  
  const prompts = [
    "I'm feeling anxious about my exams",
    "How can I manage stress better?",
    "I'm having trouble sleeping",
    "I feel overwhelmed with work",
    "How to practice mindfulness?",
    "I need motivation to study"
  ];

  return (
    <View style={styles.suggestedPrompts}>
      <Text style={styles.promptsTitle}>💡 Suggested Topics:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {prompts.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            style={styles.promptChip}
            onPress={() => onPromptSelect(prompt)}
          >
            <Text style={styles.promptText}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const CrisisDetectionAlert = ({ onContactSupport, onDismiss }) => (
  <Card style={styles.crisisAlert}>
    <Card.Content>
      <View style={styles.crisisHeader}>
        <MaterialCommunityIcons name="alert-circle" size={24} color="#d32f2f" />
        <Text style={styles.crisisTitle}>Crisis Support Detected</Text>
      </View>
      <Text style={styles.crisisMessage}>
        I notice you might be going through a difficult time. You don't have to face this alone.
      </Text>
      <View style={styles.crisisActions}>
        <Button
          mode="contained"
          onPress={onContactSupport}
          style={styles.crisisButton}
          buttonColor="#d32f2f"
        >
          Get Immediate Help
        </Button>
        <Button onPress={onDismiss}>Continue Chat</Button>
      </View>
      <Text style={styles.emergencyText}>
        🚨 Emergency: Call 988 (Suicide & Crisis Lifeline) or text HOME to 741741
      </Text>
    </Card.Content>
  </Card>
);

export default function EnhancedChatbotScreen() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hello! I'm ZenBot, your AI mental health companion. I'm here to listen and provide support. How are you feeling today?`,
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const scrollViewRef = useRef();

  // Crisis keywords that trigger alert
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'hurt myself', 'self harm',
    'worthless', 'hopeless', 'give up', 'can\'t go on', 'better off dead'
  ];

  const detectCrisis = (text) => {
    return crisisKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const generateBotResponse = async (userMessage) => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check for crisis indicators
    if (detectCrisis(userMessage)) {
      setShowCrisisAlert(true);
      return "I'm concerned about what you've shared. Your safety and well-being are important. Would you like me to connect you with professional support resources?";
    }

    // Context-aware responses based on keywords
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
      return "I understand that anxiety can be overwhelming. Try this breathing exercise: Breathe in for 4 counts, hold for 4, breathe out for 6. Remember, anxiety is temporary and you have the strength to get through this. Would you like some specific coping strategies?";
    }
    
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed')) {
      return "Stress is a normal response, but when it becomes overwhelming, it's important to address it. Try breaking large tasks into smaller, manageable steps. What specific situation is causing you the most stress right now?";
    }
    
    if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia')) {
      return "Sleep issues can significantly impact mental health. Try establishing a bedtime routine: no screens 1 hour before bed, keep your room cool and dark, and try progressive muscle relaxation. What's been keeping you up at night?";
    }
    
    if (lowerMessage.includes('lonely') || lowerMessage.includes('alone')) {
      return "Feeling lonely is difficult, but you're not truly alone. Consider reaching out to friends, family, or joining online communities with shared interests. Sometimes even small social interactions can help. Would you like suggestions for connecting with others?";
    }
    
    if (lowerMessage.includes('motivation') || lowerMessage.includes('unmotivated')) {
      return "Lack of motivation is common, especially when we're struggling. Try setting small, achievable goals and celebrating each accomplishment. What's one small thing you could do today that would make you feel good about yourself?";
    }
    
    if (lowerMessage.includes('exam') || lowerMessage.includes('study')) {
      return "Academic pressure can be intense. Remember that your worth isn't defined by grades. Try the Pomodoro technique: 25 minutes of focused study, then a 5-minute break. How long until your exam?";
    }
    
    // Default supportive responses
    const supportiveResponses = [
      "Thank you for sharing that with me. It takes courage to open up about how you're feeling. Can you tell me more about what's been on your mind?",
      "I hear you, and your feelings are valid. Sometimes just talking about what we're experiencing can help. What would be most helpful for you right now?",
      "It sounds like you're going through something challenging. Remember that seeking support is a sign of strength, not weakness. How can I best support you today?",
      "I appreciate you trusting me with your thoughts. Every small step toward understanding and addressing how you feel matters. What's been the most difficult part of your day?",
      "Your mental health matters, and so do you. It's okay to not be okay sometimes. What kind of support feels most helpful to you right now?"
    ];
    
    return supportiveResponses[Math.floor(Math.random() * supportiveResponses.length)];
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const botResponse = await generateBotResponse(inputText.trim());
      
      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: "I'm sorry, I'm having trouble responding right now. Please try again or contact a counselor if you need immediate support.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrisisSupport = () => {
    Alert.alert(
      "Crisis Support Resources",
      "🚨 National Suicide Prevention Lifeline: 988\n📱 Crisis Text Line: Text HOME to 741741\n🌐 Crisis Chat: suicidepreventionlifeline.org\n\nWould you like me to help you connect with a local counselor?",
      [
        { text: "Yes, Help Me", onPress: () => {/* Navigate to counselor list */} },
        { text: "Not Now", style: "cancel" }
      ]
    );
    setShowCrisisAlert(false);
  };

  const handlePromptSelect = (prompt) => {
    setInputText(prompt);
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.botInfo}>
          <MaterialCommunityIcons name="robot" size={32} color="#1976d2" />
          <View>
            <Text style={styles.botName}>ZenBot</Text>
            <Text style={styles.botStatus}>🟢 Online • AI Mental Health Support</Text>
          </View>
        </View>
      </View>

      {showCrisisAlert && (
        <CrisisDetectionAlert
          onContactSupport={handleCrisisSupport}
          onDismiss={() => setShowCrisisAlert(false)}
        />
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message.text}
            isUser={message.isUser}
            timestamp={message.timestamp}
          />
        ))}
        
        {isLoading && (
          <View style={styles.loadingMessage}>
            <ActivityIndicator size="small" color="#1976d2" />
            <Text style={styles.loadingText}>ZenBot is typing...</Text>
          </View>
        )}
      </ScrollView>

      {messages.length === 1 && (
        <SuggestedPrompts onPromptSelect={handlePromptSelect} />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message here..."
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <MaterialCommunityIcons 
            name="send" 
            size={24} 
            color={inputText.trim() ? "#fff" : "#ccc"} 
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        💡 ZenBot provides supportive conversation but is not a replacement for professional therapy
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  botInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1976d2',
  },
  botStatus: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  crisisAlert: {
    margin: 10,
    backgroundColor: '#ffebee',
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  crisisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginLeft: 8,
  },
  crisisMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  crisisActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  crisisButton: {
    flex: 1,
  },
  emergencyText: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1976d2',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 18,
    marginVertical: 4,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  suggestedPrompts: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  promptsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#666',
  },
  promptChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  promptText: {
    fontSize: 12,
    color: '#1976d2',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#1976d2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  disclaimer: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#fff',
  },
});