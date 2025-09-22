const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { getAuth, createDocument, getDocument, updateDocument, COLLECTIONS } = require('../config/firebase');
const { logger, logAuthEvent } = require('../utils/logger');

const router = express.Router();

/**
 * Register a new user
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isString().isLength({ min: 2, max: 50 }),
  body('role').isIn(['student', 'counsellor']),
  body('phone').optional().isMobilePhone(),
  body('specialization').optional().isString() // For counsellors
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name, role, phone, specialization } = req.body;

  try {
    const auth = getAuth();
    
    // Create Firebase user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone
    });

    // Create user document in Firestore
    const userData = {
      name,
      email,
      role,
      phone: phone || null,
      isBlocked: false,
      approved: role === 'student' ? true : false, // Students auto-approved, counsellors need approval
      specialization: role === 'counsellor' ? specialization : null,
      profileComplete: false,
      lastLogin: null,
      createdAt: new Date().toISOString()
    };

    await createDocument(COLLECTIONS.USERS, userData, userRecord.uid);

    // Log registration
    logAuthEvent(userRecord.uid, 'REGISTER', { role, email });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email,
        name,
        role,
        approved: userData.approved
      },
      needsApproval: role === 'counsellor'
    });

  } catch (error) {
    logger.error('Registration error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak' });
    }

    res.status(500).json({ error: 'Registration failed' });
  }
}));

/**
 * Verify user token and get profile
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'ID token is required' });
  }

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get user data from Firestore
    const userData = await getDocument(COLLECTIONS.USERS, decodedToken.uid);
    
    if (!userData) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Update last login
    await updateDocument(COLLECTIONS.USERS, decodedToken.uid, {
      lastLogin: new Date().toISOString()
    });

    // Log login
    logAuthEvent(decodedToken.uid, 'LOGIN', { email: decodedToken.email });

    res.json({
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: userData.name,
        role: userData.role,
        isBlocked: userData.isBlocked,
        approved: userData.approved,
        profileComplete: userData.profileComplete,
        specialization: userData.specialization,
        phone: userData.phone
      },
      tokenValid: true
    });

  } catch (error) {
    logger.error('Token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired', tokenValid: false });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token revoked', tokenValid: false });
    }

    res.status(401).json({ error: 'Invalid token', tokenValid: false });
  }
}));

/**
 * Update user profile
 */
router.put('/profile', [
  body('name').optional().isString().isLength({ min: 2, max: 50 }),
  body('phone').optional().isMobilePhone(),
  body('specialization').optional().isString(),
  body('bio').optional().isString().isLength({ max: 500 }),
  body('languages').optional().isArray(),
  body('availability').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { idToken } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ error: 'ID token is required' });
  }

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Extract profile data
    const { name, phone, specialization, bio, languages, availability } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (specialization) updateData.specialization = specialization;
    if (bio) updateData.bio = bio;
    if (languages) updateData.languages = languages;
    if (availability) updateData.availability = availability;
    
    updateData.profileComplete = true;

    // Update Firestore document
    await updateDocument(COLLECTIONS.USERS, decodedToken.uid, updateData);

    // Update Firebase Auth display name if changed
    if (name) {
      await auth.updateUser(decodedToken.uid, { displayName: name });
    }

    // Log profile update
    logAuthEvent(decodedToken.uid, 'PROFILE_UPDATE', { fields: Object.keys(updateData) });

    res.json({
      message: 'Profile updated successfully',
      user: {
        uid: decodedToken.uid,
        ...updateData
      }
    });

  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
}));

/**
 * Request password reset
 */
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    const auth = getAuth();
    await auth.generatePasswordResetLink(email);

    // Log password reset request
    logAuthEvent(null, 'PASSWORD_RESET_REQUEST', { email });

    res.json({ message: 'Password reset email sent' });

  } catch (error) {
    logger.error('Password reset error:', error);
    
    if (error.code === 'auth/user-not-found') {
      // Don't reveal if email exists for security
      return res.json({ message: 'Password reset email sent' });
    }

    res.status(500).json({ error: 'Password reset failed' });
  }
}));

/**
 * Delete user account
 */
router.delete('/account', asyncHandler(async (req, res) => {
  const { idToken, confirmDelete } = req.body;

  if (!idToken || !confirmDelete) {
    return res.status(400).json({ error: 'ID token and confirmation required' });
  }

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Mark user as deleted in Firestore (for audit purposes)
    await updateDocument(COLLECTIONS.USERS, decodedToken.uid, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      isBlocked: true
    });

    // Delete from Firebase Auth
    await auth.deleteUser(decodedToken.uid);

    // Log account deletion
    logAuthEvent(decodedToken.uid, 'ACCOUNT_DELETE', { email: decodedToken.email });

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    logger.error('Account deletion error:', error);
    res.status(500).json({ error: 'Account deletion failed' });
  }
}));

/**
 * Refresh user session
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    // Firebase handles refresh token validation internally
    // This endpoint is mainly for client-side token refresh
    res.json({ message: 'Use Firebase SDK for token refresh' });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
}));

module.exports = router;