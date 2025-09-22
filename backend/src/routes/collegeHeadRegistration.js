const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');

const { db } = require('../config/firebase');
const { logger } = require('../utils/logger');

/**
 * @route POST /api/college-head-registration
 * @desc Submit college head registration request
 * @access Public
 */
router.post('/', [
  // Validation middleware
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('position').trim().isLength({ min: 2 }).withMessage('Position is required'),
  body('collegeName').trim().isLength({ min: 3 }).withMessage('College name must be at least 3 characters'),
  body('collegeCode').trim().isLength({ min: 2 }).withMessage('College code is required'),
  body('collegeId').trim().isLength({ min: 2 }).withMessage('College ID is required'),
  body('collegeAddress').trim().isLength({ min: 10 }).withMessage('College address must be at least 10 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('collegeType').optional().isString().withMessage('College type must be a string'),
  body('additionalInfo').optional().isString().withMessage('Additional info must be a string')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      collegeName,
      collegeCode,
      collegeId,
      collegeAddress,
      collegeType,
      additionalInfo,
      idProofUrl
    } = req.body;

    // Check if email already exists in requests
    const existingRequestQuery = await db.collection('college_head_requests')
      .where('email', '==', email.toLowerCase())
      .get();

    if (!existingRequestQuery.empty) {
      return res.status(409).json({
        success: false,
        message: 'A registration request with this email already exists'
      });
    }

    // Check if email already exists as approved college head
    const existingUserQuery = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .where('role', '==', 'college_head')
      .get();

    if (!existingUserQuery.empty) {
      return res.status(409).json({
        success: false,
        message: 'A college head account with this email already exists'
      });
    }

    // Check if college ID is already taken
    const existingCollegeQuery = await db.collection('college_head_requests')
      .where('collegeId', '==', collegeId)
      .where('status', 'in', ['pending', 'approved'])
      .get();

    if (!existingCollegeQuery.empty) {
      return res.status(409).json({
        success: false,
        message: 'This college ID is already registered or has a pending request'
      });
    }

    // Create the registration request
    const requestData = {
      // Personal Information
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      position: position.trim(),
      
      // College Information
      collegeName: collegeName.trim(),
      collegeCode: collegeCode.trim().toUpperCase(),
      collegeId: collegeId.trim(),
      collegeAddress: collegeAddress.trim(),
      collegeType: collegeType?.trim() || null,
      
      // Additional Information
      additionalInfo: additionalInfo?.trim() || null,
      idProofUrl: idProofUrl || null,
      
      // Request metadata
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const docRef = await db.collection('college_head_requests').add(requestData);

    // Log the registration request
    logger.info(`New college head registration request: ${email} for ${collegeName}`);

    // Create a notification for admins
    await db.collection('admin_notifications').add({
      type: 'new_college_head_request',
      title: 'New College Head Registration',
      message: `${firstName} ${lastName} from ${collegeName} has submitted a registration request`,
      requestId: docRef.id,
      email: email,
      collegeName: collegeName,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      success: true,
      message: 'Registration request submitted successfully',
      requestId: docRef.id,
      data: {
        email: email,
        collegeName: collegeName,
        status: 'pending'
      }
    });

  } catch (error) {
    logger.error('College head registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit registration request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route GET /api/college-head-registration/status/:email
 * @desc Check registration status by email
 * @access Public (rate limited)
 */
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    // Check in requests collection
    const requestQuery = await db.collection('college_head_requests')
      .where('email', '==', email.toLowerCase())
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!requestQuery.empty) {
      const requestDoc = requestQuery.docs[0];
      const requestData = requestDoc.data();
      
      return res.json({
        success: true,
        status: requestData.status,
        submittedAt: requestData.createdAt,
        processedAt: requestData.processedAt || null,
        message: getStatusMessage(requestData.status)
      });
    }

    // Check if already approved and in users collection
    const userQuery = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .where('role', '==', 'college_head')
      .get();

    if (!userQuery.empty) {
      return res.json({
        success: true,
        status: 'approved',
        message: 'Your account has been approved and is active'
      });
    }

    // No record found
    res.json({
      success: true,
      status: 'not_found',
      message: 'No registration request found for this email'
    });

  } catch (error) {
    logger.error('Check registration status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check registration status'
    });
  }
});

/**
 * Helper function to get status message
 */
function getStatusMessage(status) {
  switch (status) {
    case 'pending':
      return 'Your registration request is being reviewed by our admin team';
    case 'approved':
      return 'Your registration has been approved! You can now login to your account';
    case 'rejected':
      return 'Your registration request was not approved. Please contact support for more information';
    default:
      return 'Unknown status';
  }
}

module.exports = router;