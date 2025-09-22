import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Language translations
const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    profile: "Profile",
    sessions: "Sessions",
    resources: "Resources",
    logout: "Logout",
    
    // Dashboard
    welcomeMessage: "Welcome to Your ZenCare Journey",
    wellnessScore: "Your Wellness Score",
    improving: "Improving",
    quickTips: "Quick Tips",
    
    // Features
    testEmotion: "Test Your Emotion",
    testEmotionDesc: "Complete PHQ-9 and GAD-7 assessments to evaluate your mental health status",
    takeAssessment: "Take Assessment",
    
    aiCounsellor: "AI Counsellor",
    aiCounsellorDesc: "Chat with our AI-powered counsellor for immediate support and guidance",
    startChat: "Start Chat",
    
    humanCounsellor: "Human Counsellor",
    humanCounsellorDesc: "Book sessions and connect with certified mental health professionals",
    bookSession: "Book Session",
    
    resourceHub: "Resource Hub",
    resourceHubDesc: "Access articles, videos, and wellness resources in multiple languages",
    exploreResources: "Explore Resources",
    
    // Common
    loading: "Loading...",
    close: "Close",
    cancel: "Cancel",
    submit: "Submit",
    save: "Save",
    next: "Next",
    back: "Back",
    
    // Authentication
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot Password?",
    
    // Mental Health Assessment
    mentalHealthAssessment: "Mental Health Assessment",
    phq9Title: "PHQ-9: Depression Screening",
    gad7Title: "GAD-7: Anxiety Screening",
    assessmentResults: "Assessment Results",
    
    // Resources
    wellnessResourcesHub: "Wellness Resources Hub",
    videos: "Videos",
    articles: "Articles",
    mindfulGames: "Mindful Games",
    peacefulImages: "Peaceful Images",
    additionalResources: "Additional Resources"
  },
  
  hi: {
    // Navigation
    dashboard: "डैशबोर्ड",
    profile: "प्रोफ़ाइल",
    sessions: "सत्र",
    resources: "संसाधन",
    logout: "लॉग आउट",
    
    // Dashboard
    welcomeMessage: "आपकी ZenCare यात्रा में आपका स्वागत है",
    wellnessScore: "आपका कल्याण स्कोर",
    improving: "सुधार हो रहा है",
    quickTips: "त्वरित सुझाव",
    
    // Features
    testEmotion: "अपनी भावना का परीक्षण करें",
    testEmotionDesc: "अपनी मानसिक स्वास्थ्य स्थिति का मूल्यांकन करने के लिए PHQ-9 और GAD-7 मूल्यांकन पूरा करें",
    takeAssessment: "मूल्यांकन लें",
    
    aiCounsellor: "AI काउंसलर",
    aiCounsellorDesc: "तत्काल सहायता और मार्गदर्शन के लिए हमारे AI-संचालित काउंसलर से चैट करें",
    startChat: "चैट शुरू करें",
    
    humanCounsellor: "मानव काउंसलर",
    humanCounsellorDesc: "सत्र बुक करें और प्रमाणित मानसिक स्वास्थ्य पेशेवरों से जुड़ें",
    bookSession: "सत्र बुक करें",
    
    resourceHub: "संसाधन केंद्र",
    resourceHubDesc: "कई भाषाओं में लेख, वीडियो और कल्याण संसाधनों तक पहुंचें",
    exploreResources: "संसाधन एक्सप्लोर करें",
    
    // Common
    loading: "लोड हो रहा है...",
    close: "बंद करें",
    cancel: "रद्द करें",
    submit: "सबमिट करें",
    save: "सेव करें",
    next: "अगला",
    back: "वापस",
    
    // Authentication
    login: "लॉगिन",
    register: "रजिस्टर",
    email: "ईमेल",
    password: "पासवर्ड",
    forgotPassword: "पासवर्ड भूल गए?",
    
    // Mental Health Assessment
    mentalHealthAssessment: "मानसिक स्वास्थ्य मूल्यांकन",
    phq9Title: "PHQ-9: अवसाद स्क्रीनिंग",
    gad7Title: "GAD-7: चिंता स्क्रीनिंग",
    assessmentResults: "मूल्यांकन परिणाम",
    
    // Resources
    wellnessResourcesHub: "कल्याण संसाधन केंद्र",
    videos: "वीडियो",
    articles: "लेख",
    mindfulGames: "माइंडफुल गेम्स",
    peacefulImages: "शांतिपूर्ण छवियां",
    additionalResources: "अतिरिक्त संसाधन"
  },
  
  ta: {
    // Navigation
    dashboard: "டாஷ்போர்டு",
    profile: "சுயவிவரம்",
    sessions: "அமர்வுகள்",
    resources: "வளங்கள்",
    logout: "வெளியேறு",
    
    // Dashboard
    welcomeMessage: "உங்கள் ZenCare பயணத்திற்கு வரவேற்கிறோம்",
    wellnessScore: "உங்கள் நல்வாழ்வு மதிப்பெண்",
    improving: "மேம்படுத்துகிறது",
    quickTips: "விரைவான குறிப்புகள்",
    
    // Features
    testEmotion: "உங்கள் உணர்வை சோதிக்கவும்",
    testEmotionDesc: "உங்கள் மனநல நிலையை மதிப்பிட PHQ-9 மற்றும் GAD-7 மதிப்பீடுகளை முடிக்கவும்",
    takeAssessment: "மதிப்பீடு எடுக்கவும்",
    
    aiCounsellor: "AI ஆலோசகர்",
    aiCounsellorDesc: "உடனடி ஆதரவு மற்றும் வழிகாட்டுதலுக்காக எங்கள் AI-இயங்கும் ஆலோசகருடன் அரட்டையடிக்கவும்",
    startChat: "அரட்டை தொடங்கவும்",
    
    humanCounsellor: "மனித ஆலோசகர்",
    humanCounsellorDesc: "அமர்வுகளை பதிவு செய்து சான்றளிக்கப்பட்ட மனநல நிபுணர்களுடன் இணைக்கவும்",
    bookSession: "அமர்வு பதிவு செய்யவும்",
    
    resourceHub: "வள மையம்",
    resourceHubDesc: "பல மொழிகளில் கட்டுரைகள், வீடியோக்கள் மற்றும் நல்வாழ்வு வளங்களை அணுகவும்",
    exploreResources: "வளங்களை ஆராயவும்",
    
    // Common
    loading: "ஏற்றுகிறது...",
    close: "மூடு",
    cancel: "ரத்து செய்",
    submit: "சமர்பிக்கவும்",
    save: "சேமிக்கவும்",
    next: "அடுத்தது",
    back: "பின்னோக்கி",
    
    // Authentication
    login: "உள்நுழைய",
    register: "பதிவு செய்ய",
    email: "மின்னஞ்சல்",
    password: "கடவுச்சொல்",
    forgotPassword: "கடவுச்சொல் மறந்துவிட்டதா?",
    
    // Mental Health Assessment
    mentalHealthAssessment: "மனநல மதிப்பீடு",
    phq9Title: "PHQ-9: மன அழுத்த பரிசோதனை",
    gad7Title: "GAD-7: கவலை பரிசோதனை",
    assessmentResults: "மதிப்பீடு முடிவுகள்",
    
    // Resources
    wellnessResourcesHub: "நல்வாழ்வு வள மையம்",
    videos: "வீடியோக்கள்",
    articles: "கட்டுரைகள்",
    mindfulGames: "கவனமுள்ள விளையாட்டுகள்",
    peacefulImages: "அமைதியான படங்கள்",
    additionalResources: "கூடுதல் வளங்கள்"
  },
  
  te: {
    // Navigation
    dashboard: "డాష్‌బోర్డ్",
    profile: "ప్రొఫైల్",
    sessions: "సెషన్లు",
    resources: "వనరులు",
    logout: "లాగ్ అవుట్",
    
    // Dashboard
    welcomeMessage: "మీ ZenCare ప్రయాణానికి స్వాగతం",
    wellnessScore: "మీ వెల్‌నెస్ స్కోర్",
    improving: "మెరుగుపడుతోంది",
    quickTips: "త్వరిత చిట్కాలు",
    
    // Features
    testEmotion: "మీ భావనను పరీక్షించండి",
    testEmotionDesc: "మీ మానసిక ఆరోగ్య స్థితిని అంచనా వేయడానికి PHQ-9 మరియు GAD-7 అంచనాలను పూర్తి చేయండి",
    takeAssessment: "అంచనా తీసుకోండి",
    
    aiCounsellor: "AI కౌన్సెలర్",
    aiCounsellorDesc: "తక్షణ మద్దతు మరియు మార్గదర్శనం కోసం మా AI-శక్తితో కూడిన కౌన్సెలర్‌తో చాట్ చేయండి",
    startChat: "చాట్ ప్రారంభించండి",
    
    humanCounsellor: "మానవ కౌన్సెలర్",
    humanCounsellorDesc: "సెషన్లను బుక్ చేయండి మరియు ధృవీకరించబడిన మానసిక ఆరోగ్య నిపుణులతో కనెక్ట్ అవ్వండి",
    bookSession: "సెషన్ బుక్ చేయండి",
    
    resourceHub: "వనరుల కేంద్రం",
    resourceHubDesc: "అనేక భాషలలో కథనాలు, వీడియోలు మరియు వెల్‌నెస్ వనరులను యాక్సెస్ చేయండి",
    exploreResources: "వనరులను అన్వేషించండి",
    
    // Common
    loading: "లోడ్ అవుతోంది...",
    close: "మూసివేయండి",
    cancel: "రద్దు చేయండి",
    submit: "సమర్పించండి",
    save: "సేవ్ చేయండి",
    next: "తదుపరి",
    back: "వెనుకకు",
    
    // Authentication
    login: "లాగిన్",
    register: "రిజిస్టర్",
    email: "ఇమెయిల్",
    password: "పాస్‌వర్డ్",
    forgotPassword: "పాస్‌వర్డ్ మర్చిపోయారా?",
    
    // Mental Health Assessment
    mentalHealthAssessment: "మానసిక ఆరోగ్య అంచనా",
    phq9Title: "PHQ-9: డిప్రెషన్ స్క్రీనింగ్",
    gad7Title: "GAD-7: ఆందోళన స్క్రీనింగ్",
    assessmentResults: "అంచనా ఫలితాలు",
    
    // Resources
    wellnessResourcesHub: "వెల్‌నెస్ వనరుల కేంద్రం",
    videos: "వీడియోలు",
    articles: "కథనాలు",
    mindfulGames: "మైండ్‌ఫుల్ గేమ్స్",
    peacefulImages: "శాంతియుత చిత్రాలు",
    additionalResources: "అదనపు వనరులు"
  }
}

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en')

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('zencare-language')
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage)
    }
  }, [])

  const changeLanguage = (languageCode) => {
    if (translations[languageCode]) {
      setCurrentLanguage(languageCode)
      localStorage.setItem('zencare-language', languageCode)
    }
  }

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key
  }

  const availableLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' }
  ]

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    availableLanguages
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}