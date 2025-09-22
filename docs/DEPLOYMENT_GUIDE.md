# Deployment Guide

This guide covers deploying the Student Wellness App to production environments.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Backend API    │    │   Firebase      │
│  (Expo/EAS)     │◄──►│ (Render/Heroku)  │◄──►│  (Production)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌──────────────────┐             │
         └─────────────►│   Admin Web      │◄────────────┘
                        │ (Vercel/Netlify) │
                        └──────────────────┘
                                 │
                        ┌──────────────────┐
                        │   ML Services    │
                        │ (Cloud Run/AWS)  │
                        └──────────────────┘
```

## 🔧 Prerequisites

1. **Firebase Project** (Production)
2. **Expo Account** (for mobile deployment)
3. **Cloud Provider Account** (Render, Heroku, Vercel, etc.)
4. **Domain Name** (optional but recommended)
5. **SSL Certificate** (handled by cloud providers)

## 🚀 Deployment Steps

### 1. Firebase Setup

#### Create Production Firebase Project
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create new project or use existing
firebase projects:create student-wellness-prod

# Initialize Firebase in your project
firebase init
```

#### Configure Firebase Services
1. **Authentication**
   - Enable Email/Password and Phone authentication
   - Configure authorized domains
   - Set up custom claims for roles

2. **Firestore**
   - Deploy security rules: `firebase deploy --only firestore:rules`
   - Deploy indexes: `firebase deploy --only firestore:indexes`
   - Import seed data: `node scripts/seed-firebase.js`

3. **Storage**
   - Configure storage rules for file uploads
   - Set up CORS for web access

#### Firebase Configuration
```javascript
// firebase-config.js
const firebaseConfig = {
  apiKey: "your-production-api-key",
  authDomain: "student-wellness-prod.firebaseapp.com",
  projectId: "student-wellness-prod",
  storageBucket: "student-wellness-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 2. Backend Deployment

#### Option A: Render
1. **Create Render Account** and connect GitHub
2. **Create Web Service**
   ```yaml
   # render.yaml
   services:
     - type: web
       name: wellness-api
       env: node
       buildCommand: cd packages/server && npm install
       startCommand: cd packages/server && npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: FIREBASE_PROJECT_ID
           fromDatabase:
             name: firebase-config
             property: projectId
   ```

3. **Environment Variables**
   ```bash
   NODE_ENV=production
   PORT=3001
   FIREBASE_PROJECT_ID=student-wellness-prod
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   ML_SERVICE_URL=https://your-ml-service.com
   HUGGINGFACE_API_KEY=your_hf_key
   ```

#### Option B: Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Create Heroku app
heroku create wellness-api-prod

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set FIREBASE_PROJECT_ID=student-wellness-prod

# Deploy
git subtree push --prefix packages/server heroku main
```

#### Option C: Google Cloud Run
```dockerfile
# Use the official Node.js runtime as the base image
FROM node:18-alpine

WORKDIR /app
COPY packages/server/package*.json ./
RUN npm ci --only=production

COPY packages/server/ ./
EXPOSE 8080

CMD ["npm", "start"]
```

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/wellness-api
gcloud run deploy --image gcr.io/PROJECT_ID/wellness-api --platform managed
```

### 3. ML Service Deployment

#### Option A: Google Cloud Run
```bash
# Build ML service
cd packages/ml
docker build -t gcr.io/PROJECT_ID/wellness-ml .

# Deploy to Cloud Run
gcloud run deploy wellness-ml \
  --image gcr.io/PROJECT_ID/wellness-ml \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Option B: AWS Lambda (Serverless)
```yaml
# serverless.yml
service: wellness-ml

provider:
  name: aws
  runtime: python3.9
  region: us-east-1

functions:
  crisis-detect:
    handler: handlers.crisis_detect
    events:
      - http:
          path: /crisis-detect
          method: post
          cors: true
```

#### Option C: Heroku
```bash
# Create Heroku app for ML service
heroku create wellness-ml-prod

# Set Python buildpack
heroku buildpacks:set heroku/python

# Deploy
git subtree push --prefix packages/ml heroku main
```

### 4. Admin Web App Deployment

#### Option A: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from packages/web directory
cd packages/web
vercel --prod
```

#### Option B: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
cd packages/web
npm run build
netlify deploy --prod --dir=build
```

#### Environment Variables for Web App
```bash
REACT_APP_API_BASE_URL=https://your-api-domain.com/api
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=student-wellness-prod.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=student-wellness-prod
```

### 5. Mobile App Deployment

#### Expo Application Services (EAS)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
cd packages/mobile
eas build:configure

# Build for production
eas build --platform all --profile production

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

#### EAS Configuration (eas.json)
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://your-api-domain.com/api",
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "student-wellness-prod"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## 🔒 Security Configuration

### 1. Firebase Security Rules
Deploy production-ready security rules:
```bash
firebase deploy --only firestore:rules
```

### 2. API Security
- Enable CORS for specific domains only
- Implement rate limiting
- Use HTTPS everywhere
- Validate all inputs
- Sanitize user data

### 3. Environment Variables
Never commit sensitive data. Use environment variables:
```bash
# Production environment variables
NODE_ENV=production
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
JWT_SECRET=super-secure-random-string
HUGGINGFACE_API_KEY=your-api-key
```

### 4. SSL/TLS
Ensure all services use HTTPS:
- Firebase: Automatic HTTPS
- Render/Heroku: Automatic HTTPS
- Custom domains: Configure SSL certificates

## 📊 Monitoring & Analytics

### 1. Firebase Analytics
```javascript
// Enable analytics in mobile app
import { getAnalytics } from 'firebase/analytics';
const analytics = getAnalytics(app);
```

### 2. Error Tracking
```bash
# Install Sentry
npm install @sentry/node @sentry/react-native

# Configure in backend
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });
```

### 3. Performance Monitoring
- Firebase Performance Monitoring
- Google Cloud Monitoring
- Custom metrics and alerts

### 4. Logging
```javascript
// Structured logging with Winston
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: packages/web

  deploy-mobile:
    needs: test
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.message, '[mobile]')
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v7
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd packages/mobile && eas build --platform all --non-interactive
```

## 🧪 Testing in Production

### 1. Health Checks
```bash
# API health check
curl https://your-api-domain.com/health

# ML service health check
curl https://your-ml-domain.com/health
```

### 2. End-to-End Testing
```javascript
// Playwright E2E tests
const { test, expect } = require('@playwright/test');

test('user can register and login', async ({ page }) => {
  await page.goto('https://your-web-domain.com');
  // Test registration flow
  await page.click('[data-testid="register-button"]');
  // ... test steps
});
```

### 3. Load Testing
```bash
# Use Artillery for load testing
npm install -g artillery
artillery quick --count 100 --num 10 https://your-api-domain.com/health
```

## 📈 Scaling Considerations

### 1. Database Scaling
- Firebase Firestore: Automatic scaling
- MongoDB Atlas: Configure auto-scaling
- Implement read replicas for heavy read workloads

### 2. API Scaling
- Horizontal scaling with load balancers
- Implement caching (Redis)
- Use CDN for static assets

### 3. ML Service Scaling
- Auto-scaling based on CPU/memory usage
- Implement model caching
- Use GPU instances for heavy ML workloads

## 🔧 Maintenance

### 1. Regular Updates
```bash
# Update dependencies monthly
npm audit
npm update

# Update Firebase SDK
npm install firebase@latest
```

### 2. Database Maintenance
- Regular backups
- Index optimization
- Data archival for old records

### 3. Security Updates
- Monitor security advisories
- Update dependencies with security patches
- Regular security audits

## 📞 Support & Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Check service account permissions
   - Verify project ID configuration
   - Check network connectivity

2. **Mobile App Build Failures**
   - Update Expo SDK
   - Check native dependencies
   - Verify certificates and provisioning profiles

3. **API Performance Issues**
   - Check database query performance
   - Monitor memory usage
   - Implement caching strategies

### Getting Help
- Check application logs
- Monitor error tracking (Sentry)
- Review Firebase console for issues
- Check cloud provider status pages

## 📋 Deployment Checklist

- [ ] Firebase project configured
- [ ] Environment variables set
- [ ] Security rules deployed
- [ ] Backend API deployed and tested
- [ ] ML service deployed and tested
- [ ] Admin web app deployed
- [ ] Mobile app built and submitted
- [ ] SSL certificates configured
- [ ] Monitoring and alerts set up
- [ ] Backup strategy implemented
- [ ] Documentation updated
- [ ] Team access configured
- [ ] Performance testing completed

---

**Note**: This is a mental health application. Ensure proper crisis intervention protocols, data privacy compliance (HIPAA, GDPR), and professional oversight before deploying to production.