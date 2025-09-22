const admin = require('firebase-admin');
const { logger } = require('../utils/logger');

/**
 * Middleware to verify Firebase ID tokens
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No valid authorization token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'student',
      emailVerified: decodedToken.email_verified,
      customClaims: decodedToken
    };

    // Check if user is blocked
    if (decodedToken.blocked) {
      return res.status(403).json({
        success: false,
        message: 'Account has been blocked',
        blocked: true,
        reason: decodedToken.blockReason || 'Account blocked by administrator'
      });
    }

    logger.info(`Authenticated user: ${req.user.uid} (${req.user.role})`);
    next();

  } catch (error) {
    logger.error('Token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Middleware to check user roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Access denied for user ${req.user.uid} with role ${userRole}. Required: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole
      });
    }

    next();
  };
};

/**
 * Middleware for admin-only routes
 */
const requireAdmin = requireRole(['admin']);

/**
 * Middleware for college head routes
 */
const requireCollegeHead = requireRole(['college_head', 'admin']);

/**
 * Middleware for counsellor and admin routes
 */
const requireCounsellor = requireRole(['counsellor', 'admin']);

/**
 * Middleware for student routes (all authenticated users)
 */
const requireStudent = requireRole(['student', 'counsellor', 'admin']);

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return next(); // Continue without authentication
    }

    // Try to verify the token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'student',
      emailVerified: decodedToken.email_verified,
      customClaims: decodedToken
    };

    logger.info(`Optional auth - authenticated user: ${req.user.uid}`);

  } catch (error) {
    // Log error but don't fail the request
    logger.warn('Optional auth failed:', error.message);
  }
  
  next();
};

/**
 * Middleware to check if user account is approved (for counsellors)
 */
const requireApproval = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Students don't need approval
    if (req.user.role === 'student') {
      return next();
    }

    // Check if counsellor is approved
    if (req.user.role === 'counsellor') {
      const approved = req.user.customClaims.approved;
      
      if (!approved) {
        return res.status(403).json({
          success: false,
          message: 'Account pending approval',
          code: 'PENDING_APPROVAL'
        });
      }
    }

    next();

  } catch (error) {
    logger.error('Approval check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify account status'
    });
  }
};

/**
 * Rate limiting middleware for sensitive operations
 */
const rateLimitSensitive = (req, res, next) => {
  // This would typically use Redis or similar for distributed rate limiting
  // For now, we'll use a simple in-memory approach
  
  const key = `${req.ip}:${req.user?.uid || 'anonymous'}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 10;

  // TODO: Implement proper rate limiting with Redis
  // For now, just log and continue
  logger.info(`Rate limit check for ${key}`);
  next();
};

/**
 * Middleware to log user actions for audit trail
 */
const auditLog = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      setImmediate(() => {
        logger.info(`Audit: ${action}`, {
          userId: req.user?.uid,
          userRole: req.user?.role,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString(),
          success: res.statusCode < 400
        });
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  verifyFirebaseToken,
  requireRole,
  requireAdmin,
  requireCollegeHead,
  requireCounsellor,
  requireStudent,
  optionalAuth,
  requireApproval,
  rateLimitSensitive,
  auditLog
};