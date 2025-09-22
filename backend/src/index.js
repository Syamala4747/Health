const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initializeFirebase } = require('./config/firebase');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const SocketService = require('./services/socketService');
// Route imports
const chatbotRoutes = require('./routes/chatbot');
const adminRoutes = require('./routes/admin');
const aiGuidanceRoutes = require('./routes/aiGuidance');
const mlAnalysisRoutes = require('./routes/mlAnalysis');
const collegeHeadRegistrationRoutes = require('./routes/collegeHeadRegistration');
const counselorRequestsRoutes = require('./routes/counselorRequests');
const aiCounselorRoutes = require('./routes/aiCounselor');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase
try {
  initializeFirebase();
} catch (error) {
  logger.error('Failed to initialize Firebase:', error);
  // Continue without Firebase for now
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai-guidance', aiGuidanceRoutes);
app.use('/api/ml', mlAnalysisRoutes);
app.use('/api/college-head-registration', collegeHeadRegistrationRoutes);
app.use('/api/counselor-requests', counselorRequestsRoutes);
app.use('/api/ai-counselor', aiCounselorRoutes);
const bookingsRoutes = require('./routes/bookings');
app.use('/api/bookings', bookingsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
});

// Initialize Socket.IO service
const socketService = new SocketService(server);
logger.info('🔌 Socket.IO service initialized');

// Keep the process alive
server.on('error', (error) => {
  logger.error('Server error:', error);
});

module.exports = app;