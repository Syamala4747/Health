# Frontend - React Web Application

This is the web frontend for the ZenCare Mental Health Platform, built with React and Material-UI.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env
```

Configure your `.env` file with Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
│   ├── admin/          # Admin dashboard pages
│   ├── college_head/   # College head pages
│   ├── counsellor/     # Counsellor pages
│   └── student/        # Student pages
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── services/           # API services
├── utils/              # Utility functions
├── config/             # Configuration files
└── theme/              # Material-UI theme
```

## 🎯 Features

### Multi-Role Dashboard
- **Admin**: System management and oversight
- **College Head**: College-specific management
- **Counsellor**: Student counseling interface
- **Student**: Mental health resources and assessments

### Key Components
- **Assessment Forms**: PHQ-9, GAD-7 mental health assessments
- **AI Chatbot**: Integrated AI counselor
- **Booking System**: Counselor appointment scheduling
- **Analytics Dashboard**: Role-specific analytics
- **Resource Hub**: Mental health resources

## 🛠️ Technology Stack

- **React 18** with Hooks and Context API
- **Material-UI (MUI)** for component library
- **React Router v6** for navigation
- **Vite** for build tooling
- **Firebase** for backend services
- **React Hot Toast** for notifications

## 📱 Responsive Design

The application is fully responsive and works across:
- Desktop (1920px+)
- Laptop (1024px+)
- Tablet (768px+)
- Mobile (320px+)

## 🔐 Authentication & Authorization

- Firebase Authentication integration
- Role-based access control
- Protected routes with role validation
- Fallback authentication for offline development

## 🌐 Internationalization

Support for multiple languages:
- English (default)
- Hindi
- Tamil
- Telugu

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Build & Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Firebase Hosting
npm run deploy
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication, Firestore, and Storage
3. Configure security rules
4. Add your web app configuration to `.env`

### Material-UI Theme
Custom theme configuration in `src/theme/theme.js`

## 📚 Key Libraries

- `@mui/material` - Material-UI components
- `react-router-dom` - Routing
- `firebase` - Backend services
- `react-hot-toast` - Notifications
- `recharts` - Charts and analytics
- `@emotion/react` - CSS-in-JS styling

## 🐛 Common Issues

### Firebase Connection Issues
- Check your `.env` configuration
- Verify Firebase project settings
- Ensure proper network connectivity

### Build Issues
- Clear node_modules and reinstall
- Check for version conflicts
- Update dependencies

## 📄 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |

## 🤝 Contributing

1. Follow the existing code style
2. Use Material-UI components consistently
3. Implement proper error handling
4. Add appropriate comments
5. Test on multiple screen sizes

---

For more information, see the main project [README](../README.md).