# Mobile - React Native App

This is the mobile application for the ZenCare Mental Health Platform, built with React Native and Expo.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation
```bash
npm install
```

### Development
```bash
# Start Expo development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios

# Run on web
npx expo start --web
```

## 📱 Platform Support

- **iOS**: 13.0+
- **Android**: API level 21+
- **Web**: Modern browsers (development only)

## 🏗️ Project Structure

```
src/
├── screens/           # Screen components
│   ├── auth/         # Authentication screens
│   ├── student/      # Student-specific screens
│   ├── counsellor/   # Counsellor screens
│   ├── admin/        # Admin screens
│   └── shared/       # Shared screens
├── navigation/       # Navigation configuration
├── contexts/         # React contexts
├── services/         # API services
├── components/       # Reusable components
├── config/           # Configuration files
├── theme/            # Theme and styling
└── i18n/            # Internationalization
```

## 🎯 Features

### Student Features
- **Mental Health Assessments**: Quick PHQ-9 and GAD-7 assessments
- **AI Counselor Chat**: 24/7 AI-powered mental health support
- **Counselor Booking**: Find and book counselors
- **Resources**: Access mental health resources
- **Progress Tracking**: View assessment history

### Counselor Features
- **Student Management**: View assigned students
- **Chat Interface**: Secure messaging with students
- **Assessment Review**: View student assessment results
- **Schedule Management**: Manage appointments

### Core Features
- **Multi-language Support**: English, Hindi, Tamil, Telugu
- **Dark/Light Theme**: User preference theming
- **Offline Support**: Basic functionality without internet
- **Push Notifications**: Important alerts and reminders

## 🛠️ Technology Stack

### Core
- **React Native** with Expo SDK 49+
- **React Navigation v6** for navigation
- **React Native Paper** for Material Design components
- **Expo Router** for file-based routing

### State Management
- **React Context** for global state
- **AsyncStorage** for local persistence

### Backend Integration
- **Firebase** for authentication and data
- **Axios** for HTTP requests
- **Socket.io** for real-time communication

### UI/UX
- **React Native Paper** - Material Design
- **React Native Vector Icons** - Icon library
- **React Native Gesture Handler** - Gesture support
- **React Native Reanimated** - Animations

## 🎨 Design System

### Colors
```javascript
const theme = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  background: '#ffffff',
  surface: '#f8fafc',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b'
}
```

### Typography
- Roboto (Android)
- San Francisco (iOS)
- Responsive font scaling

## 🌐 Internationalization

Supported languages:
- **English** (en) - Default
- **Hindi** (hi)
- **Tamil** (ta)
- **Telugu** (te)

### Adding New Languages
1. Add translation file in `src/i18n/locales/`
2. Update language selector
3. Test RTL support if needed

## 📊 State Management

### Context Structure
```javascript
// AuthContext - User authentication
// LanguageContext - Language preferences
// ThemeContext - Theme preferences
// ApiContext - API state management
```

### Local Storage
- User preferences
- Offline data cache
- Assessment responses
- Chat history

## 🔐 Security

### Authentication
- Firebase Authentication
- Biometric authentication (optional)
- Secure token storage

### Data Protection
- HTTPS only communication
- Local data encryption
- Secure storage for sensitive data

## 📱 Platform-Specific Features

### iOS
- Face ID / Touch ID support
- iOS-specific animations
- Native iOS share sheet

### Android
- Fingerprint authentication
- Android-specific navigation
- Material Design guidelines

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Testing Strategy
- **Unit Tests**: Component testing with Jest
- **Integration Tests**: API integration testing
- **E2E Tests**: End-to-end user flows

## 📦 Build & Deployment

### Development Build
```bash
# Development build
npx expo run:android
npx expo run:ios
```

### Production Build
```bash
# Build for app stores
npx eas build --platform all

# Build APK for testing
npx eas build --platform android --profile preview
```

### App Store Deployment
```bash
# Submit to app stores
npx eas submit --platform all
```

## 🔧 Configuration

### app.json
```json
{
  "expo": {
    "name": "ZenCare",
    "slug": "zencare-mental-health",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    }
  }
}
```

### Environment Configuration
```javascript
// config/environment.js
export const config = {
  development: {
    apiUrl: 'http://localhost:5000',
    firebaseConfig: { /* dev config */ }
  },
  production: {
    apiUrl: 'https://api.zencare.app',
    firebaseConfig: { /* prod config */ }
  }
}
```

## 📈 Performance

### Optimization Strategies
- Lazy loading of screens
- Image optimization
- Bundle size optimization
- Memory leak prevention

### Monitoring
- Crash reporting with Sentry
- Performance monitoring
- User analytics

## 🐛 Common Issues

### Metro Bundler Issues
```bash
# Clear Metro cache
npx expo start -c

# Reset Expo cache
npx expo install --fix
```

### Platform-Specific Issues
- iOS simulator setup
- Android emulator configuration
- Gradle build issues

## 📱 Features Roadmap

### Phase 1 (Current)
- ✅ User authentication
- ✅ Basic assessments
- ✅ AI chat functionality
- ✅ Multi-language support

### Phase 2 (Planned)
- 🔄 Offline mode enhancement
- 🔄 Push notifications
- 🔄 Advanced analytics
- 🔄 Social features

### Phase 3 (Future)
- 📋 Video calling
- 📋 Advanced AI features
- 📋 Wearable integration
- 📋 Community features

## 🤝 Contributing

1. Follow React Native best practices
2. Use TypeScript for type safety
3. Implement proper error boundaries
4. Test on both platforms
5. Follow accessibility guidelines

---

For more information, see the main project [README](../README.md).