import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Translation data
  const translations = {
    en: {
      // App titles
      appName: 'ZenCare',
      subtitle: 'Mental Health Support',
      
      // Navigation
      dashboard: 'Dashboard',
      resources: 'Resources',
      profile: 'Profile',
      sessions: 'Sessions',
      
      // Dashboard
      welcome: 'Welcome to ZenCare',
      mentalHealthAssessment: 'Test Your Emotion',
      assessmentDescription: 'Take our clinical assessment',
      findCounsellor: 'Find a Counsellor',
      counsellorDescription: 'Connect with professionals',
      resourceHub: 'Resource Hub',
      resourceDescription: 'Wellness videos & activities',
      aiChatbot: 'AI Support',
      chatbotDescription: 'Get instant emotional support',
      
      // Assessment
      startAssessment: 'Start Assessment',
      phq9Title: 'Depression Screening (PHQ-9)',
      gad7Title: 'Anxiety Screening (GAD-7)',
      assessmentNote: 'This is a screening tool, not a diagnostic instrument',
      
      // Resources
      videos: 'Videos',
      articles: 'Articles',
      games: 'Games',
      images: 'Images',
      dailyTips: 'Daily Tips',
      
      // Common actions
      back: 'Back',
      next: 'Next',
      close: 'Close',
      save: 'Save',
      cancel: 'Cancel',
      continue: 'Continue',
      
      // Wellness content
      meditation: 'Meditation',
      breathing: 'Breathing',
      relaxation: 'Relaxation',
      sleep: 'Sleep',
      mindfulness: 'Mindfulness',
    },
    hi: {
      // App titles
      appName: 'जेनकेयर',
      subtitle: 'मानसिक स्वास्थ्य सहायता',
      
      // Navigation
      dashboard: 'डैशबोर्ड',
      resources: 'संसाधन',
      profile: 'प्रोफाइल',
      sessions: 'सत्र',
      
      // Dashboard
      welcome: 'जेनकेयर में आपका स्वागत है',
      mentalHealthAssessment: 'अपनी भावना का परीक्षण करें',
      assessmentDescription: 'हमारा क्लिनिकल आकलन लें',
      findCounsellor: 'काउंसलर खोजें',
      counsellorDescription: 'विशेषज्ञों से जुड़ें',
      resourceHub: 'संसाधन केंद्र',
      resourceDescription: 'कल्याण वीडियो और गतिविधियां',
      aiChatbot: 'AI सहायता',
      chatbotDescription: 'तुरंत भावनात्मक सहायता प्राप्त करें',
      
      // Assessment
      startAssessment: 'आकलन शुरू करें',
      phq9Title: 'अवसाद स्क्रीनिंग (PHQ-9)',
      gad7Title: 'चिंता स्क्रीनिंग (GAD-7)',
      assessmentNote: 'यह एक स्क्रीनिंग उपकरण है, निदान उपकरण नहीं',
      
      // Resources
      videos: 'वीडियो',
      articles: 'लेख',
      games: 'खेल',
      images: 'चित्र',
      dailyTips: 'दैनिक सुझाव',
      
      // Common actions
      back: 'वापस',
      next: 'अगला',
      close: 'बंद करें',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      continue: 'जारी रखें',
      
      // Wellness content
      meditation: 'ध्यान',
      breathing: 'श्वास',
      relaxation: 'विश्राम',
      sleep: 'नींद',
      mindfulness: 'सचेतता',
    },
    ta: {
      // App titles
      appName: 'ஜென்கேர்',
      subtitle: 'மனநல ஆதரவு',
      
      // Navigation
      dashboard: 'டாஷ்போர்ட்',
      resources: 'வளங்கள்',
      profile: 'சுயவிவரம்',
      sessions: 'அமர்வுகள்',
      
      // Dashboard
      welcome: 'ஜென்கேருக்கு வரவேற்கிறோம்',
      mentalHealthAssessment: 'உங்கள் உணர்வைச் சோதிக்கவும்',
      assessmentDescription: 'எங்கள் மருத்துவ மதிப்பீட்டை எடுங்கள்',
      findCounsellor: 'ஆலோசகரைக் கண்டறியவும்',
      counsellorDescription: 'நிபுணர்களுடன் இணைக்கவும்',
      resourceHub: 'வள மையம்',
      resourceDescription: 'நலன் வீडியோக்கள் மற்றும் செயல்பாடுகள்',
      aiChatbot: 'AI ஆதரவு',
      chatbotDescription: 'உடனடி உணர்ச்சி ஆதரவு பெறுங்கள்',
      
      // Assessment
      startAssessment: 'மதிப்பீட்டைத் தொடங்கவும்',
      phq9Title: 'மன அழுத்த பரிசோதனை (PHQ-9)',
      gad7Title: 'கவலை பரிசோதனை (GAD-7)',
      assessmentNote: 'இது ஒரு ஸ்கிரீனிங் கருவி, நோயறிதல் கருவி அல்ல',
      
      // Resources
      videos: 'காணொளிகள்',
      articles: 'கட்டுரைகள்',
      games: 'விளையாட்டுகள்',
      images: 'படங்கள்',
      dailyTips: 'தினசரி குறிப்புகள்',
      
      // Common actions
      back: 'பின்னால்',
      next: 'அடுத்து',
      close: 'மூடு',
      save: 'சேமி',
      cancel: 'ரத்து',
      continue: 'தொடரவும்',
      
      // Wellness content
      meditation: 'தியானம்',
      breathing: 'சுவாசம்',
      relaxation: 'ஓய்வு',
      sleep: 'தூக்கம்',
      mindfulness: 'கவனம்',
    },
    te: {
      // App titles
      appName: 'జెన్‌కేర్',
      subtitle: 'మానసిక ఆరోగ్య మద్దతు',
      
      // Navigation
      dashboard: 'డాష్‌బోర్డ్',
      resources: 'వనరులు',
      profile: 'ప్రొఫైల్',
      sessions: 'సెషన్లు',
      
      // Dashboard
      welcome: 'జెన్‌కేర్‌కు స్వాగతం',
      mentalHealthAssessment: 'మీ భావనను పరీక్షించండి',
      assessmentDescription: 'మా వైద్య మూల్యాంకనం తీసుకోండి',
      findCounsellor: 'కౌన్సిలర్‌ను కనుగొనండి',
      counsellorDescription: 'నిపుణులతో కనెక్ట్ అవ్వండి',
      resourceHub: 'వనరుల కేంద్రం',
      resourceDescription: 'సంక్షేమ వీడియోలు మరియు కార్యకలాపాలు',
      aiChatbot: 'AI మద్దతు',
      chatbotDescription: 'తక్షణ భావోద్వేగ మద్దతు పొందండి',
      
      // Assessment
      startAssessment: 'మూల్యాంకనం ప్రారంభించండి',
      phq9Title: 'నిరాశ పరీక్ష (PHQ-9)',
      gad7Title: 'ఆందోళన పరీక్ష (GAD-7)',
      assessmentNote: 'ఇది స్క్రీనింగ్ సాధనం, రోగనిర్ధారణ సాధనం కాదు',
      
      // Resources
      videos: 'వీడియోలు',
      articles: 'వ్యాసాలు',
      games: 'గేమ్‌లు',
      images: 'చిత్రాలు',
      dailyTips: 'రోజువారీ చిట్కాలు',
      
      // Common actions
      back: 'వెనుకకు',
      next: 'తదుపరి',
      close: 'మూసివేయండి',
      save: 'సేవ్ చేయండి',
      cancel: 'రద్దు చేయండి',
      continue: 'కొనసాగించండి',
      
      // Wellness content
      meditation: 'ధ్యానం',
      breathing: 'శ్వాస',
      relaxation: 'విశ్రాంతి',
      sleep: 'నిద్రలేవు',
      mindfulness: 'అవగాహన',
    }
  };

  // Load saved language preference
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
        if (savedLanguage && translations[savedLanguage]) {
          setCurrentLanguage(savedLanguage);
        }
      } catch (error) {
        console.log('Error loading language preference:', error);
      }
    };
    loadLanguage();
  }, []);

  // Save language preference
  const changeLanguage = async (languageCode) => {
    try {
      setCurrentLanguage(languageCode);
      await AsyncStorage.setItem('selectedLanguage', languageCode);
    } catch (error) {
      console.log('Error saving language preference:', error);
    }
  };

  // Translation function
  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    availableLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};