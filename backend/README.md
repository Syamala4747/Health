# Backend - Node.js Express Server

This is the backend API server for the ZenCare Mental Health Platform, built with Node.js and Express.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase Admin SDK credentials

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file with the following variables:
```env
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
OPENAI_API_KEY=your_openai_key (optional)
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 🏗️ Project Structure

```
src/
├── routes/              # API route handlers
│   ├── auth.js         # Authentication routes
│   ├── users.js        # User management
│   ├── admin.js        # Admin operations
│   ├── chatbot.js      # AI chatbot endpoints
│   └── ml.js           # ML analysis endpoints
├── services/           # Business logic services
│   ├── crisisDetector.js
│   ├── phqAssessment.js
│   └── gadAssessment.js
├── middleware/         # Express middleware
│   ├── auth.js         # Authentication middleware
│   └── errorHandler.js # Error handling
├── config/             # Configuration files
│   └── firebase.js     # Firebase admin setup
├── bot/                # Chatbot logic
│   ├── aiml/           # AIML conversation patterns
│   └── flows/          # Conversation flows
└── utils/              # Utility functions
    └── logger.js       # Winston logging
```

## 🛠️ API Endpoints

### Authentication
```
POST /api/auth/login     # User login
POST /api/auth/register  # User registration
POST /api/auth/logout    # User logout
GET  /api/auth/profile   # Get user profile
```

### User Management
```
GET    /api/users        # Get users (admin only)
PUT    /api/users/:id    # Update user
DELETE /api/users/:id    # Delete user (admin only)
```

### Assessments
```
POST /api/assessments/phq9  # Submit PHQ-9 assessment
POST /api/assessments/gad7  # Submit GAD-7 assessment
GET  /api/assessments/user/:id  # Get user assessments
```

### Chatbot
```
POST /api/chatbot/message    # Send message to AI
GET  /api/chatbot/history    # Get chat history
```

### ML Analysis
```
POST /api/ml/analyze         # Run ML analysis
GET  /api/ml/insights/:id    # Get ML insights
```

### Admin Operations
```
GET  /api/admin/stats        # System statistics
POST /api/admin/approve/:id  # Approve user
GET  /api/admin/reports      # Generate reports
```

## 🔐 Authentication & Authorization

### Middleware
- Firebase JWT verification
- Role-based access control
- Request logging

### Security Features
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention

## 🤖 AI Integration

### Chatbot Features
- AIML pattern matching
- Multi-language support
- Context-aware responses
- Crisis detection

### Assessment Analysis
- PHQ-9 depression scoring
- GAD-7 anxiety scoring
- Risk level categorization
- Automated recommendations

## 📊 Data Models

### User Schema
```javascript
{
  uid: String,
  email: String,
  role: 'admin' | 'college_head' | 'counsellor' | 'student',
  college: {
    id: String,
    name: String
  },
  profile: {
    name: String,
    age: Number,
    department: String
  },
  approved: Boolean,
  blocked: Boolean,
  createdAt: Timestamp
}
```

### Assessment Schema
```javascript
{
  userId: String,
  type: 'phq9' | 'gad7',
  responses: Array,
  score: Number,
  severity: String,
  recommendations: Array,
  timestamp: Timestamp
}
```

## 🔧 Configuration

### Firebase Admin SDK
1. Download service account key from Firebase Console
2. Set environment variables or use key file
3. Initialize Firebase Admin in `config/firebase.js`

### Logging
Winston logger configuration:
- Console logging for development
- File logging for production
- Error tracking and alerts

## 📦 Dependencies

### Core Dependencies
- `express` - Web framework
- `firebase-admin` - Firebase backend SDK
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `winston` - Logging

### AI/ML Dependencies
- `openai` - OpenAI API integration
- `natural` - Natural language processing
- `sentiment` - Sentiment analysis

## 🔍 Monitoring & Logging

### Log Levels
- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug information

### Log Files
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled rejections

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t zencare-backend .

# Run container
docker run -p 5000:5000 zencare-backend
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
FIREBASE_PROJECT_ID=your_production_project
# ... other production variables
```

## 📈 Performance

### Optimization Strategies
- Connection pooling
- Response caching
- Request compression
- Database indexing

### Monitoring
- Response time tracking
- Error rate monitoring
- Resource usage alerts

## 🐛 Common Issues

### Firebase Connection
- Verify service account credentials
- Check Firebase project configuration
- Ensure proper IAM permissions

### CORS Issues
- Configure allowed origins
- Set proper headers
- Handle preflight requests

## 🤝 Contributing

1. Follow RESTful API conventions
2. Implement proper error handling
3. Add comprehensive logging
4. Write unit tests for new features
5. Document API changes

---

For more information, see the main project [README](../README.md).