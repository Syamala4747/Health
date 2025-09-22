const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware, requireCounsellor } = require('../middleware/auth');
const { queryDocuments, getDocument, updateDocument, COLLECTIONS } = require('../config/firebase');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * Get user profile
 */
router.get('/profile/:userId?', authMiddleware, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.uid;
  const requesterRole = req.user.role;
  
  // If no userId provided, return requester's own profile
  const targetUserId = userId || requesterId;

  try {
    const user = await getDocument(COLLECTIONS.USERS, targetUserId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check permissions
    const canViewFullProfile = (
      targetUserId === requesterId || // Own profile
      requesterRole === 'admin' || // Admin can view all
      (requesterRole === 'counsellor' && user.role === 'student') // Counsellor can view student profiles
    );

    if (!canViewFullProfile) {
      // Return limited public profile
      return res.json({
        id: user.id,
        name: user.name,
        role: user.role,
        specialization: user.specialization,
        languages: user.languages,
        isBlocked: user.isBlocked
      });
    }

    // Return full profile (excluding sensitive data)
    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      specialization: user.specialization,
      bio: user.bio,
      languages: user.languages,
      availability: user.availability,
      isBlocked: user.isBlocked,
      approved: user.approved,
      profileComplete: user.profileComplete,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      // Assessment history for students
      lastPHQScore: user.role === 'student' ? user.lastPHQScore : undefined,
      lastPHQSeverity: user.role === 'student' ? user.lastPHQSeverity : undefined,
      lastPHQDate: user.role === 'student' ? user.lastPHQDate : undefined,
      lastGADScore: user.role === 'student' ? user.lastGADScore : undefined,
      lastGADSeverity: user.role === 'student' ? user.lastGADSeverity : undefined,
      lastGADDate: user.role === 'student' ? user.lastGADDate : undefined
    };

    res.json({ user: profile });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
}));

/**
 * Update user profile
 */
router.put('/profile', [
  authMiddleware,
  body('name').optional().isString().isLength({ min: 2, max: 50 }),
  body('phone').optional().isMobilePhone(),
  body('bio').optional().isString().isLength({ max: 500 }),
  body('specialization').optional().isString(),
  body('languages').optional().isArray(),
  body('availability').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.user.uid;
  const { name, phone, bio, specialization, languages, availability } = req.body;

  try {
    const updateData = {};
    
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (bio) updateData.bio = bio;
    if (specialization) updateData.specialization = specialization;
    if (languages) updateData.languages = languages;
    if (availability) updateData.availability = availability;
    
    updateData.profileComplete = true;

    await updateDocument(COLLECTIONS.USERS, userId, updateData);

    logger.info('User profile updated', { userId, fields: Object.keys(updateData) });

    res.json({ 
      message: 'Profile updated successfully',
      updatedFields: Object.keys(updateData)
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}));

/**
 * Get counsellors list (for students to book)
 */
router.get('/counsellors', [
  authMiddleware,
  query('specialization').optional().isString(),
  query('language').optional().isString(),
  query('available').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const { specialization, language, available } = req.query;

  try {
    let filters = [
      { field: 'role', operator: '==', value: 'counsellor' },
      { field: 'approved', operator: '==', value: true },
      { field: 'isBlocked', operator: '==', value: false },
      { field: 'isDeleted', operator: '!=', value: true }
    ];

    if (specialization) {
      filters.push({ field: 'specialization', operator: '==', value: specialization });
    }

    const counsellors = await queryDocuments(COLLECTIONS.USERS, filters);

    // Filter by language and availability (client-side filtering for complex queries)
    let filteredCounsellors = counsellors;

    if (language) {
      filteredCounsellors = filteredCounsellors.filter(counsellor => 
        counsellor.languages && counsellor.languages.includes(language)
      );
    }

    if (available === 'true') {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const currentTime = now.getHours() * 60 + now.getMinutes();

      filteredCounsellors = filteredCounsellors.filter(counsellor => {
        if (!counsellor.availability || !counsellor.availability[currentDay]) {
          return false;
        }
        
        const dayAvailability = counsellor.availability[currentDay];
        return dayAvailability.some(slot => {
          const startTime = parseTime(slot.start);
          const endTime = parseTime(slot.end);
          return currentTime >= startTime && currentTime <= endTime;
        });
      });
    }

    // Return public counsellor information
    const publicCounsellors = filteredCounsellors.map(counsellor => ({
      id: counsellor.id,
      name: counsellor.name,
      specialization: counsellor.specialization,
      bio: counsellor.bio,
      languages: counsellor.languages,
      availability: counsellor.availability,
      rating: counsellor.rating || 0,
      totalSessions: counsellor.totalSessions || 0
    }));

    res.json({ counsellors: publicCounsellors });
  } catch (error) {
    logger.error('Get counsellors error:', error);
    res.status(500).json({ error: 'Failed to retrieve counsellors' });
  }
}));

/**
 * Get random counsellor
 */
router.get('/counsellors/random', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const counsellors = await queryDocuments(COLLECTIONS.USERS, [
      { field: 'role', operator: '==', value: 'counsellor' },
      { field: 'approved', operator: '==', value: true },
      { field: 'isBlocked', operator: '==', value: false },
      { field: 'isDeleted', operator: '!=', value: true }
    ]);

    if (counsellors.length === 0) {
      return res.status(404).json({ error: 'No available counsellors found' });
    }

    const randomCounsellor = counsellors[Math.floor(Math.random() * counsellors.length)];

    res.json({
      counsellor: {
        id: randomCounsellor.id,
        name: randomCounsellor.name,
        specialization: randomCounsellor.specialization,
        bio: randomCounsellor.bio,
        languages: randomCounsellor.languages,
        availability: randomCounsellor.availability
      }
    });
  } catch (error) {
    logger.error('Get random counsellor error:', error);
    res.status(500).json({ error: 'Failed to get random counsellor' });
  }
}));

/**
 * Get user statistics
 */
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const userRole = req.user.role;

  try {
    let stats = {};

    if (userRole === 'student') {
      // Student statistics
      const sessions = await queryDocuments(COLLECTIONS.SESSIONS, [
        { field: 'studentId', operator: '==', value: userId }
      ]);

      const bookings = await queryDocuments(COLLECTIONS.BOOKINGS, [
        { field: 'studentId', operator: '==', value: userId }
      ]);

      stats = {
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        totalBookings: bookings.length,
        upcomingBookings: bookings.filter(b => 
          b.status === 'confirmed' && new Date(b.scheduledAt) > new Date()
        ).length,
        assessmentsCompleted: {
          phq9: req.user.lastPHQDate ? 1 : 0,
          gad7: req.user.lastGADDate ? 1 : 0
        }
      };
    } else if (userRole === 'counsellor') {
      // Counsellor statistics
      const sessions = await queryDocuments(COLLECTIONS.SESSIONS, [
        { field: 'counsellorId', operator: '==', value: userId }
      ]);

      const bookings = await queryDocuments(COLLECTIONS.BOOKINGS, [
        { field: 'counsellorId', operator: '==', value: userId }
      ]);

      stats = {
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        upcomingBookings: bookings.filter(b => 
          b.status === 'confirmed' && new Date(b.scheduledAt) > new Date()
        ).length,
        averageRating: req.user.rating || 0
      };
    }

    res.json({ stats });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve user statistics' });
  }
}));

/**
 * Search users (admin and counsellor only)
 */
router.get('/search', [
  requireCounsellor,
  query('q').isString().isLength({ min: 2 }),
  query('role').optional().isIn(['student', 'counsellor']),
  query('limit').optional().isInt({ min: 1, max: 50 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { q, role, limit = 20 } = req.query;
  const searcherRole = req.user.role;

  try {
    let filters = [
      { field: 'isDeleted', operator: '!=', value: true }
    ];

    if (role) {
      filters.push({ field: 'role', operator: '==', value: role });
    }

    // Counsellors can only search students
    if (searcherRole === 'counsellor') {
      filters.push({ field: 'role', operator: '==', value: 'student' });
    }

    const users = await queryDocuments(COLLECTIONS.USERS, filters);

    // Client-side search (for simplicity)
    const searchTerm = q.toLowerCase();
    const matchedUsers = users.filter(user => 
      user.name?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm)
    ).slice(0, parseInt(limit));

    // Return limited user information
    const searchResults = matchedUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: searcherRole === 'admin' ? user.email : undefined,
      role: user.role,
      specialization: user.specialization,
      isBlocked: user.isBlocked,
      approved: user.approved
    }));

    res.json({ users: searchResults, total: matchedUsers.length });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
}));

// Helper function to parse time string (HH:MM) to minutes
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

module.exports = router;