const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');

const { verifyFirebaseToken, requireCollegeHead, auditLog } = require('../middleware/auth');
const { db } = require('../config/firebase');
const { logger } = require('../utils/logger');

/**
 * @route POST /api/counselor-requests
 * @desc Submit counselor registration request
 * @access Public
 */
router.post('/', [
  // Validation middleware
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('specialization').trim().isLength({ min: 3 }).withMessage('Specialization is required'),
  body('experience').trim().isLength({ min: 1 }).withMessage('Experience is required'),
  body('collegeId').trim().isLength({ min: 2 }).withMessage('College ID is required'),
  body('collegeName').trim().isLength({ min: 3 }).withMessage('College name is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('qualifications').isArray().withMessage('Qualifications must be an array'),
  body('languages').isArray().withMessage('Languages must be an array')
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
      specialization,
      experience,
      qualifications,
      languages,
      collegeId,
      collegeName,
      collegeCode,
      idProofType,
      idProofUrl
    } = req.body;

    // Check if email already exists in requests
    const existingRequestQuery = await db.collection('counselor_requests')
      .where('email', '==', email.toLowerCase())
      .get();

    if (!existingRequestQuery.empty) {
      return res.status(409).json({
        success: false,
        message: 'A counselor request with this email already exists'
      });
    }

    // Check if email already exists as approved counselor
    const existingUserQuery = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .where('role', '==', 'counselor')
      .get();

    if (!existingUserQuery.empty) {
      return res.status(409).json({
        success: false,
        message: 'A counselor account with this email already exists'
      });
    }

    // Create the counselor request
    const requestData = {
      // Personal Information
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      
      // Professional Information
      specialization: specialization.trim(),
      experience: experience.trim(),
      qualifications: qualifications.map(q => q.trim()).filter(q => q),
      languages: languages.map(l => l.trim()).filter(l => l),
      
      // College Information
      collegeId: collegeId.trim(),
      collegeName: collegeName.trim(),
      collegeCode: collegeCode?.trim() || null,
      
      // Verification
      idProofType: idProofType || null,
      idProofUrl: idProofUrl || null,
      
      // Request metadata
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const docRef = await db.collection('counselor_requests').add(requestData);

    // Log the registration request
    logger.info(`New counselor registration request: ${email} for ${collegeName}`);

    // Create a notification for college heads
    await db.collection('college_head_notifications').add({
      type: 'new_counselor_request',
      title: 'New Counselor Application',
      message: `${firstName} ${lastName} has applied to be a counselor at ${collegeName}`,
      requestId: docRef.id,
      email: email,
      collegeName: collegeName,
      collegeId: collegeId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      success: true,
      message: 'Counselor registration request submitted successfully',
      requestId: docRef.id,
      data: {
        email: email,
        collegeName: collegeName,
        status: 'pending'
      }
    });

  } catch (error) {
    logger.error('Counselor registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit counselor registration request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route GET /api/counselor-requests/college/:collegeId
 * @desc Get counselor requests for a specific college
 * @access College Head only
 */
router.get('/college/:collegeId', [
  verifyFirebaseToken,
  requireCollegeHead,
  auditLog('college_head_view_counselor_requests')
], async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { status = 'pending' } = req.query;

    // Verify college head has access to this college
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().college?.id !== collegeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view requests for your college.'
      });
    }

    let query = db.collection('counselor_requests')
      .where('collegeId', '==', collegeId);
    
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    const requestsSnapshot = await query
      .orderBy('createdAt', 'desc')
      .get();

    const requests = [];
    requestsSnapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      requests,
      count: requests.length
    });

  } catch (error) {
    logger.error('Get counselor requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get counselor requests'
    });
  }
});

/**
 * @route POST /api/counselor-requests/:requestId/process
 * @desc Process counselor request (approve/reject) by College Head
 * @access College Head only
 */
router.post('/:requestId/process', [
  verifyFirebaseToken,
  requireCollegeHead,
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  auditLog('college_head_process_counselor_request')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { requestId } = req.params;
    const { action, reason } = req.body;
    const approved = action === 'approve';

    // Get the request data
    const requestDoc = await db.collection('counselor_requests').doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    const requestData = requestDoc.data();

    // Verify college head has access to this request
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().college?.id !== requestData.collegeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only process requests for your college.'
      });
    }

    // Update the request status
    await db.collection('counselor_requests').doc(requestId).update({
      status: approved ? 'approved' : 'rejected',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: req.user.uid,
      collegeHeadNotes: reason || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (approved) {
      // Create user account in users collection
      const userDocRef = await db.collection('users').add({
        email: requestData.email,
        role: 'counselor',
        approved: true,
        blocked: false,
        profile: {
          firstName: requestData.firstName,
          lastName: requestData.lastName,
          phone: requestData.phone,
          specialization: requestData.specialization,
          experience: requestData.experience,
          qualifications: requestData.qualifications,
          languages: requestData.languages
        },
        college: {
          id: requestData.collegeId,
          name: requestData.collegeName,
          code: requestData.collegeCode
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: req.user.uid
      });

      // Set custom claims for the user (if they have a Firebase Auth account)
      try {
        const userRecord = await admin.auth().getUserByEmail(requestData.email);
        await admin.auth().setCustomUserClaims(userRecord.uid, {
          role: 'counselor',
          approved: true,
          blocked: false,
          collegeId: requestData.collegeId
        });
      } catch (authError) {
        // User doesn't exist in Firebase Auth yet, they'll get claims when they first login
        logger.info(`User ${requestData.email} not found in Firebase Auth, will set claims on first login`);
      }

      // Create notification for approved user
      await db.collection('notifications').add({
        email: requestData.email,
        type: 'counselor_approved',
        title: 'Counselor Account Approved!',
        message: 'Your counselor account has been approved by your College Head. You can now login and start providing counseling services.',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info(`Counselor request approved: ${requestData.email} by college head ${req.user.uid}`);
    } else {
      // Create notification for rejected user
      await db.collection('notifications').add({
        email: requestData.email,
        type: 'counselor_rejected',
        title: 'Counselor Application Update',
        message: `Your counselor application was not approved by your College Head. ${reason || 'Please contact your college administration for more information.'}`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info(`Counselor request rejected: ${requestData.email} by college head ${req.user.uid}. Reason: ${reason}`);
    }

    res.json({
      success: true,
      message: `Counselor request ${approved ? 'approved' : 'rejected'} successfully`
    });

  } catch (error) {
    logger.error('Process counselor request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process counselor request'
    });
  }
});

/**
 * @route GET /api/counselor-requests/status/:email
 * @desc Check counselor registration status by email
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
    const requestQuery = await db.collection('counselor_requests')
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
      .where('role', '==', 'counselor')
      .get();

    if (!userQuery.empty) {
      return res.json({
        success: true,
        status: 'approved',
        message: 'Your counselor account has been approved and is active'
      });
    }

    // No record found
    res.json({
      success: true,
      status: 'not_found',
      message: 'No counselor registration request found for this email'
    });

  } catch (error) {
    logger.error('Check counselor registration status error:', error);
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
      return 'Your counselor registration request is being reviewed by your College Head';
    case 'approved':
      return 'Your counselor registration has been approved! You can now login to your account';
    case 'rejected':
      return 'Your counselor registration request was not approved. Please contact your college administration';
    default:
      return 'Unknown status';
  }
}

module.exports = router;