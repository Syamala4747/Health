const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');
const { db } = require('../config/firebase');
const { logger } = require('../utils/logger');

// Create booking
router.post('/', [
  body('counselorId').isString().withMessage('Counselor ID is required'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date is required'),
  body('sessionType').isIn(['chat', 'audio', 'both']).withMessage('Valid session type required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { counselorId, scheduledAt, sessionType, notes } = req.body;
    
    const booking = await db.collection('bookings').add({
      studentId: req.user?.uid || 'anonymous',
      counselorId,
      status: 'pending',
      scheduledAt: new Date(scheduledAt),
      sessionType,
      notes: notes || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Notify counselor
    await db.collection('notifications').add({
      userId: counselorId,
      type: 'new_booking_request',
      title: 'New Booking Request',
      message: 'A student has requested a counseling session with you',
      bookingId: booking.id,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, bookingId: booking.id });
  } catch (error) {
    logger.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

// Get user bookings
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const bookingsSnapshot = await db.collection('bookings')
      .where('studentId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const bookings = [];
    bookingsSnapshot.forEach(doc => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, bookings });
  } catch (error) {
    logger.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get bookings' });
  }
});

// Update booking status
router.put('/:bookingId/status', [
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Valid status required')
], async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    await db.collection('bookings').doc(bookingId).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Update booking status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
});

module.exports = router;