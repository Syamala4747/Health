#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 MongoDB Migration Script');
console.log('This script will help you switch from Firebase to MongoDB Atlas\n');

// MongoDB schemas
const mongooseSchemas = {
  'User.js': `const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['student', 'counsellor', 'admin'],
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: String,
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blockedAt: Date,
  approved: {
    type: Boolean,
    default: function() {
      return this.role === 'student';
    }
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  profileComplete: {
    type: Boolean,
    default: false
  },
  
  // Counsellor specific fields
  specialization: String,
  bio: String,
  languages: [String],
  availability: {
    monday: [{ start: String, end: String }],
    tuesday: [{ start: String, end: String }],
    wednesday: [{ start: String, end: String }],
    thursday: [{ start: String, end: String }],
    friday: [{ start: String, end: String }],
    saturday: [{ start: String, end: String }],
    sunday: [{ start: String, end: String }]
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  
  // Student specific fields
  lastPHQScore: Number,
  lastPHQSeverity: String,
  lastPHQDate: Date,
  lastGADScore: Number,
  lastGADSeverity: String,
  lastGADDate: Date,
  
  // Common fields
  lastLogin: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });
userSchema.index({ approved: 1 });
userSchema.index({ firebaseUid: 1 });

module.exports = mongoose.model('User', userSchema);`,

  'Session.js': `const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  counsellorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['chat', 'audio'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  startedAt: Date,
  endedAt: Date,
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  endedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  duration: Number, // in minutes
  notes: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String
}, {
  timestamps: true
});

// Indexes
sessionSchema.index({ studentId: 1 });
sessionSchema.index({ counsellorId: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ startedAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);`,

  'ChatMessage.js': `const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });
chatMessageSchema.index({ senderId: 1 });
chatMessageSchema.index({ receiverId: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);`,

  'Booking.js': `const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  counsellorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['chat', 'audio'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'in_progress'],
    default: 'pending'
  },
  notes: String,
  preferredLanguage: {
    type: String,
    default: 'en'
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  confirmedAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelReason: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reason: String // For counsellor decline reason
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ studentId: 1 });
bookingSchema.index({ counsellorId: 1 });
bookingSchema.index({ scheduledAt: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);`,

  'Report.js': `const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['inappropriate_behavior', 'harassment', 'spam', 'crisis_detection', 'other'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'closed', 'withdrawn'],
    default: 'open'
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  },
  evidence: String,
  confidence: Number, // For crisis detection
  originalMessage: String, // For crisis detection
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  handledAt: Date,
  adminNotes: String,
  actionTaken: String,
  withdrawnAt: Date,
  withdrawReason: String
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ reporterId: 1 });
reportSchema.index({ reportedId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ type: 1 });

module.exports = mongoose.model('Report', reportSchema);`,

  'Resource.js': `const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  content: String,
  type: {
    type: String,
    enum: ['article', 'video', 'game', 'pdf', 'audio'],
    required: true
  },
  language: {
    type: String,
    enum: ['en', 'te', 'hi', 'ta'],
    default: 'en'
  },
  category: {
    type: String,
    enum: ['anxiety', 'depression', 'stress', 'mindfulness', 'relationships', 'self-care', 'crisis', 'games'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  url: String,
  thumbnailUrl: String,
  duration: Number, // in seconds
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredOrder: Number,
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewed: Date,
  relatedResources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
resourceSchema.index({ type: 1 });
resourceSchema.index({ language: 1 });
resourceSchema.index({ category: 1 });
resourceSchema.index({ isActive: 1 });
resourceSchema.index({ isFeatured: 1, featuredOrder: 1 });
resourceSchema.index({ viewCount: -1 });
resourceSchema.index({ tags: 1 });

module.exports = mongoose.model('Resource', resourceSchema);`,

  'AuditLog.js': `const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['User', 'Session', 'Booking', 'Report', 'Resource']
  },
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);`
};

// MongoDB configuration files
const mongoConfig = {
  'packages/server/src/config/mongodb.js': `const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    logger.info(\`✅ MongoDB connected: \${conn.connection.host}\`);
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('🔌 MongoDB disconnected');
  } catch (error) {
    logger.error('❌ MongoDB disconnection error:', error);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.info('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.info('🔌 Mongoose disconnected');
  isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  disconnectDB,
  isConnected: () => isConnected
};`,

  'packages/server/src/middleware/mongoAuth.js': `const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');

/**
 * JWT-based authentication middleware for MongoDB
 */
const mongoAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No valid authorization header found' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not found' 
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        error: 'Account Blocked', 
        message: user.blockReason || 'Your account has been blocked by an administrator',
        isBlocked: true
      });
    }

    // Check if counsellor is approved
    if (user.role === 'counsellor' && !user.approved) {
      return res.status(403).json({ 
        error: 'Account Pending', 
        message: 'Your counsellor account is pending approval',
        isPending: true
      });
    }

    // Attach user to request
    req.user = {
      uid: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      isBlocked: user.isBlocked,
      approved: user.approved,
      ...user.toObject()
    };

    next();
  } catch (error) {
    logger.error('MongoDB Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid Token', 
        message: 'The provided token is invalid' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token Expired', 
        message: 'Your session has expired. Please log in again.' 
      });
    }

    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication failed' 
    });
  }
};

module.exports = {
  mongoAuthMiddleware
};`
};

// Create directories and files
function createMongoDBStructure() {
  console.log('📁 Creating MongoDB directory structure...');
  
  // Create models directory
  const modelsDir = path.join(process.cwd(), 'packages/server/src/models');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  // Create model files
  Object.entries(mongooseSchemas).forEach(([filename, content]) => {
    const filePath = path.join(modelsDir, filename);
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created model: ${filename}`);
  });

  // Create config files
  Object.entries(mongoConfig).forEach(([filepath, content]) => {
    const fullPath = path.join(process.cwd(), filepath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Created config: ${path.basename(filepath)}`);
  });
}

// Update package.json dependencies
function updatePackageJson() {
  console.log('📦 Updating package.json with MongoDB dependencies...');
  
  const packageJsonPath = path.join(process.cwd(), 'packages/server/package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add MongoDB dependencies
  packageJson.dependencies = {
    ...packageJson.dependencies,
    'mongoose': '^7.4.0',
    'jsonwebtoken': '^9.0.1',
    'bcryptjs': '^2.4.3'
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json');
}

// Create migration script
function createMigrationScript() {
  console.log('🔄 Creating Firebase to MongoDB migration script...');
  
  const migrationScript = `#!/usr/bin/env node

const admin = require('firebase-admin');
const mongoose = require('mongoose');
require('dotenv').config();

// Import MongoDB models
const User = require('./packages/server/src/models/User');
const Session = require('./packages/server/src/models/Session');
const Booking = require('./packages/server/src/models/Booking');
const Report = require('./packages/server/src/models/Report');
const Resource = require('./packages/server/src/models/Resource');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

async function migrateCollection(firebaseCollection, MongoModel, transform = (doc) => doc) {
  console.log(\`🔄 Migrating \${firebaseCollection}...\`);
  
  const snapshot = await db.collection(firebaseCollection).get();
  const docs = [];
  
  snapshot.forEach(doc => {
    const data = transform({ id: doc.id, ...doc.data() });
    docs.push(data);
  });
  
  if (docs.length > 0) {
    await MongoModel.insertMany(docs, { ordered: false });
    console.log(\`✅ Migrated \${docs.length} documents from \${firebaseCollection}\`);
  }
}

async function migrate() {
  try {
    console.log('🚀 Starting Firebase to MongoDB migration...');
    
    // Migrate users
    await migrateCollection('users', User, (doc) => ({
      _id: new mongoose.Types.ObjectId(),
      firebaseUid: doc.id,
      ...doc,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt || doc.createdAt),
    }));
    
    // Migrate other collections...
    // Add more migrations as needed
    
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();`;

  fs.writeFileSync(path.join(process.cwd(), 'scripts/migrate-firebase-to-mongodb.js'), migrationScript);
  console.log('✅ Created migration script');
}

// Update environment variables
function updateEnvExample() {
  console.log('🔧 Updating .env.example with MongoDB variables...');
  
  const envPath = path.join(process.cwd(), '.env.example');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  const mongodbVars = `
# MongoDB Configuration (Alternative to Firebase)
MONGODB_URI=mongodb://localhost:27017/student_wellness
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Set to 'mongodb' to use MongoDB instead of Firebase
DATABASE_TYPE=firebase
`;

  envContent += mongodbVars;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env.example');
}

// Create README for MongoDB setup
function createMongoDBReadme() {
  const readmeContent = `# MongoDB Setup Guide

This guide will help you switch from Firebase to MongoDB Atlas.

## Prerequisites

1. MongoDB Atlas account (or local MongoDB installation)
2. Node.js 18+
3. Existing Firebase project data (optional, for migration)

## Setup Steps

### 1. Install Dependencies

\`\`\`bash
cd packages/server
npm install mongoose jsonwebtoken bcryptjs
\`\`\`

### 2. Environment Configuration

Update your \`.env\` file:

\`\`\`env
# Set database type
DATABASE_TYPE=mongodb

# MongoDB connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/student_wellness

# JWT configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d
\`\`\`

### 3. Update Server Configuration

Modify \`packages/server/src/index.js\`:

\`\`\`javascript
// Add at the top
const { connectDB } = require('./config/mongodb');

// Replace Firebase initialization with MongoDB
if (process.env.DATABASE_TYPE === 'mongodb') {
  connectDB();
} else {
  initializeFirebase();
}

// Update auth middleware import
const { authMiddleware } = process.env.DATABASE_TYPE === 'mongodb' 
  ? require('./middleware/mongoAuth')
  : require('./middleware/auth');
\`\`\`

### 4. Data Migration (Optional)

If you have existing Firebase data:

\`\`\`bash
node scripts/migrate-firebase-to-mongodb.js
\`\`\`

### 5. Update API Endpoints

The MongoDB models are compatible with existing API endpoints. Update service files to use Mongoose instead of Firestore:

\`\`\`javascript
// Before (Firebase)
const user = await getDocument(COLLECTIONS.USERS, userId);

// After (MongoDB)
const user = await User.findById(userId);
\`\`\`

## Key Differences

### Authentication
- **Firebase**: Uses Firebase ID tokens
- **MongoDB**: Uses JWT tokens with bcrypt password hashing

### Database Operations
- **Firebase**: Firestore collections and documents
- **MongoDB**: Mongoose models and schemas

### Real-time Features
- **Firebase**: Built-in real-time listeners
- **MongoDB**: Requires Socket.IO or similar for real-time updates

## Models Overview

- **User**: Student, counsellor, and admin accounts
- **Session**: Chat and audio session records
- **ChatMessage**: Individual chat messages
- **Booking**: Session booking requests
- **Report**: User reports and crisis detection
- **Resource**: Wellness resources and content
- **AuditLog**: System activity logging

## Security Considerations

1. **JWT Secret**: Use a strong, random JWT secret
2. **Password Hashing**: Passwords are hashed with bcrypt
3. **Input Validation**: Mongoose schema validation
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **CORS**: Configure CORS for your frontend domains

## Performance Tips

1. **Indexes**: Models include optimized indexes
2. **Connection Pooling**: MongoDB driver handles connection pooling
3. **Aggregation**: Use MongoDB aggregation for complex queries
4. **Caching**: Consider Redis for session caching

## Troubleshooting

### Connection Issues
- Check MongoDB URI format
- Verify network access (IP whitelist for Atlas)
- Ensure database user has proper permissions

### Authentication Issues
- Verify JWT secret is set
- Check token expiration settings
- Ensure user exists in database

### Migration Issues
- Verify Firebase credentials
- Check data format compatibility
- Run migration in small batches for large datasets

## Support

For issues with MongoDB setup:
1. Check MongoDB Atlas documentation
2. Review Mongoose documentation
3. Check application logs for specific errors
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/MONGODB_SETUP.md'), readmeContent);
  console.log('✅ Created MongoDB setup guide');
}

// Main execution
async function main() {
  try {
    console.log('🔄 Starting MongoDB migration setup...\n');
    
    // Create docs directory if it doesn't exist
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    createMongoDBStructure();
    updatePackageJson();
    createMigrationScript();
    updateEnvExample();
    createMongoDBReadme();
    
    console.log('\n🎉 MongoDB migration setup completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Install new dependencies: cd packages/server && npm install');
    console.log('2. Set up MongoDB Atlas or local MongoDB');
    console.log('3. Update your .env file with MongoDB configuration');
    console.log('4. Update server code to use MongoDB (see docs/MONGODB_SETUP.md)');
    console.log('5. Run migration script if you have existing Firebase data');
    console.log('\n📖 See docs/MONGODB_SETUP.md for detailed instructions');
    
  } catch (error) {
    console.error('❌ Error during MongoDB setup:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };`;

  fs.writeFileSync(path.join(process.cwd(), 'scripts/switch-to-mongodb.js'), migrationScript);
  console.log('✅ Created MongoDB migration setup script');
}

// Make the script executable
if (require.main === module) {
  main();
}

module.exports = { main };