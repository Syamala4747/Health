import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Card } from 'react-native-paper';

import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, handleApiError } from '../../services/apiService';

const ChatbotScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const flatListRef = useRef();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [crisisDetected, setCrisisDetected] = useState(false);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      // Create initial welcome message
      const welcomeMessage = {
        id: Date.now().toString(),
        text: getWelcomeMessage(),
        sender: 'bot',
        timestamp: new Date(),
        type: 'welcome'
      };
      
      setMessages([welcomeMessage]);
      
      // Generate session ID
      setSessionId(`chat_${user.uid}_${Date.now()}`);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const getWelcomeMessage = () => {
    const greetings = {
      en: "Hello! I'm your AI wellness companion. I'm here to listen and support you through whatever you're experiencing. How are you feeling today?",
      te: "హలో! నేను మీ AI వెల్నెస్ సహచరుడిని. మీరు అనుభవిస్తున్న దాని ద్వారా మిమ్మల్ని వినడానికి మరియు మద్దతు ఇవ్వడానికి నేను ఇక్కడ ఉన్నాను. ఈరోజు మీరు ఎలా అనిపిస్తున్నారు?",
      hi: "नमस्ते! मैं आपका AI वेलनेस साथी हूँ। आप जो भी अनुभव कर रहे हैं, उसमें आपको सुनने और समर्थन देने के लिए मैं यहाँ हूँ। आज आप कैसा महसूस कर रहे हैं?",
      ta: "வணக்கம்! நான் உங்கள் AI நல்வாழ்வு துணைவன். நீங்கள் அனுபவிப்பது எதுவாக இருந்தாலும் அதில் உங்களைக் கேட்பதற்கும் ஆதரிப்பதற்கும் நான் இங்கே இருக்கிறேன். இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?"
    };
    
    return greetings[i18n.language] || greetings.en;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setTyping(true);

    try {
      // Send message to AI service
      const response = await apiService.chatbot.sendMessage({
        message: userMessage.text,
        sessionId,
        language: i18n.language,
        userId: user.uid
      });

      // Check for crisis detection
      if (response.data.crisisDetected) {
        setCrisisDetected(true);
        showCrisisAlert();
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.message,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: response.data.suggestions || [],
        crisisDetected: response.data.crisisDetected || false
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const showCrisisAlert = () => {
    Alert.alert(
      'Crisis Support Available',
      'I notice you might be going through a difficult time. Remember that help is available 24/7.',
      [
        {
          text: 'Call Crisis Line',
          onPress: () => {
            // Implementation for calling crisis line
          }
        },
        {
          text: 'Book Counsellor',
          onPress: () => navigation.navigate('CounsellorList')
        },
        {
          text: 'Continue Chat',
          style: 'cancel'
        }
      ]
    );
  };

  const sendSuggestion = (suggestion) => {
    setInputText(suggestion);
    sendMessage();
  };

  const startAssessment = (type) => {
    navigation.navigate('Assessment', { type });
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        {item.crisisDetected && (
          <Card style={styles.crisisCard}>
            <Card.Content>
              <View style={styles.crisisHeader}>
                <Ionicons name="warning" size={20} color={colors.error} />
                <Text style={styles.crisisTitle}>Crisis Resources</Text>
              </View>
              <Text style={styles.crisisText}>
                National Suicide Prevention Lifeline: 988
              </Text>
              <Text style={styles.crisisText}>
                Crisis Text Line: Text HOME to 741741
              </Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('CounsellorList')}
                style={styles.crisisButton}
              >
                Talk to a Human Counsellor
              </Button>
            </Card.Content>
          </Card>
        )}

        {item.suggestions && item.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {item.suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => sendSuggestion(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {item.type === 'welcome' && (
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
            <View style={styles.quickActionButtons}>
              <Button 
                mode="outlined" 
                onPress={() => startAssessment('phq9')}
                style={styles.quickActionButton}
                compact
              >
                Depression Check
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => startAssessment('gad7')}
                style={styles.quickActionButton}
                compact
              >
                Anxiety Check
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => navigation.navigate('Resources')}
                style={styles.quickActionButton}
                compact
              >
                Resources
              </Button>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!typing) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.typingText}>AI is typing...</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>AI Counsellor</Text>
          <Text style={styles.headerSubtitle}>Your wellness companion</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Info', 'This AI chatbot provides supportive conversation and can help guide you to appropriate resources. It is not a replacement for professional mental health care.')}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      {renderTypingIndicator()}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          multiline
          maxLength={1000}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Ionicons name="send" size={20} color={colors.surface} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  messagesList: {
    flex: 1,
    padding: spacing.md,
  },
  messageContainer: {
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  botBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.sm,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  messageText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
    lineHeight: typography.lineHeight.md,
  },
  userMessageText: {
    color: colors.textOnPrimary,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  userTimestamp: {
    color: colors.textOnPrimary,
    opacity: 0.8,
  },
  crisisCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.errorLight,
    width: '100%',
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  crisisTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  crisisText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  crisisButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.error,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    width: '100%',
  },
  suggestionChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  suggestionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  quickActionsContainer: {
    marginTop: spacing.md,
    width: '100%',
  },
  quickActionsTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  quickActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionButton: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  typingContainer: {
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.sm,
  },
  typingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
    backgroundColor: colors.background,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginLeft: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
});

export default ChatbotScreen;