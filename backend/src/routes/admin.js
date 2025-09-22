const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');

const { verifyFirebaseToken, requireAdmin, auditLog } = require('../middleware/auth');
const { db } = require('../config/firebase');
const { logger } = require('../utils/logger');

/**
 * @route GET /api/admin/users
 * @desc Get all users with pagination and filtering
 * @access Admin only
 */
router.get('/users', [
  verifyFirebaseToken,
  requireAdmin,
  auditLog('admin_view_users')
], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      approved, 
      blocked,
      search 
    } = req.query;

    let query = db.collection('users');

    // Apply filters
    if (role) {
      query = query.where('role', '==', role);
    }
    if (approved !== undefined) {
      query = query.where('approved', '==', approved === 'true');
    }
    if (blocked !== undefined) {
      query = query.where('blocked', '==', blocked === 'true');
    }

    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const usersSnapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(parseInt(limit))
      .get();

    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      // Remove sensitive information
      delete userData.password;
      users.push({
        id: doc.id,
        ...userData
      });
    });

    // Apply search filter if provided (client-side for simplicity)
    let filteredUsers = users;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      users: filteredUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

/**
 * @route GET /api/admin/pending-approvals
 * @desc Get pending counsellor approvals
 * @access Admin only
 */
router.get('/pending-approvals', [
  verifyFirebaseToken,
  requireAdmin,
  auditLog('admin_view_pending_approvals')
], async (req, res) => {
  try {
    const pendingSnapshot = await db.collection('users')
      .where('role', '==', 'counsellor')
      .where('approved', '==', false)
      .where('blocked', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    const pendingUsers = [];
    for (const doc of pendingSnapshot.docs) {
      const userData = doc.data();
      
      // Get counsellor profile data
      const profileDoc = await db.collection('counsellor_profiles').doc(doc.id).get();
      const profileData = profileDoc.exists ? profileDoc.data() : {};

      pendingUsers.push({
        id: doc.id,
        ...userData,
        profile: profileData
      });
    }

    res.json({
      success: true,
      pendingApprovals: pendingUsers,
      count: pendingUsers.length
    });

  } catch (error) {
    logger.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending approvals'
    });
  }
});

/**
 * @route GET /api/admin/college-head-requests
 * @desc Get pending college head approval requests
 * @access Admin only
 */
router.get('/college-head-requests', [
  verifyFirebaseToken,
  requireAdmin,
  auditLog('admin_view_college_head_requests')
], async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    let query = db.collection('college_head_requests');
    
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
    logger.error('Get college head requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get college head requests'
    });
  }
});

/**
 * @route POST /api/admin/college-head-requests/:requestId/process
 * @desc Process college head approval request (approve/reject)
 * @access Admin only
 */
router.post('/college-head-requests/:requestId/process', [
  verifyFirebaseToken,
  requireAdmin,
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  auditLog('admin_process_college_head_request')
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
    const requestDoc = await db.collection('college_head_requests').doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    const requestData = requestDoc.data();

    // Update the request status
    await db.collection('college_head_requests').doc(requestId).update({
      status: approved ? 'approved' : 'rejected',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: req.user.uid,
      adminNotes: reason || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (approved) {
      // Create user account in users collection
      const userDocRef = await db.collection('users').add({
        email: requestData.email,
        role: 'college_head',
        approved: true,
        blocked: false,
        profile: {
          firstName: requestData.firstName,
          lastName: requestData.lastName,
          phone: requestData.phone,
          position: requestData.position
        },
        college: {
          id: requestData.collegeId,
          name: requestData.collegeName,
          code: requestData.collegeCode,
          address: requestData.collegeAddress,
          type: requestData.collegeType
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
          role: 'college_head',
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
        type: 'college_head_approved',
        title: 'College Head Account Approved!',
        message: 'Your College Head account has been approved. You can now login and manage your institution.',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info(`College Head request approved: ${requestData.email} by admin ${req.user.uid}`);
    } else {
      // Create notification for rejected user
      await db.collection('notifications').add({
        email: requestData.email,
        type: 'college_head_rejected',
        title: 'College Head Application Update',
        message: `Your College Head application was not approved. ${reason || 'Please contact support for more information.'}`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info(`College Head request rejected: ${requestData.email} by admin ${req.user.uid}. Reason: ${reason}`);
    }

    res.json({
      success: true,
      message: `College Head request ${approved ? 'approved' : 'rejected'} successfully`
    });

  } catch (error) {
    logger.error('Process college head request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process college head request'
    });
  }
});

/**
 * @route POST /api/admin/approve-counsellor/:userId
 * @desc Approve a counsellor account
 * @access Admin only
 */
router.post('/approve-counsellor/:userId', [
  verifyFirebaseToken,
  requireAdmin,
  auditLog('admin_approve_counsellor')
], async (req, res) => {
  try {
    const { userId } = req.params;
    const { approved, reason } = req.body;

    // Update user document
    await db.collection('users').doc(userId).update({
      approved: approved === true,
      approvedAt: approved ? new Date() : null,
      approvedBy: req.user.uid,
      approvalReason: reason || null,
      updatedAt: new Date()
    });

    // Update counsellor profile
    await db.collection('counsellor_profiles').doc(userId).update({
      approved: approved === true,
      approvedAt: approved ? new Date() : null,
      approvedBy: req.user.uid,
      updatedAt: new Date()
    });

    // Set custom claims for approved counsellors
    if (approved) {
      await admin.auth().setCustomUserClaims(userId, {
        role: 'counsellor',
        approved: true,
        blocked: false
      });
    }

    // Create notification for the user
    await db.collection('notifications').add({
      userId,
      type: approved ? 'approval_granted' : 'approval_denied',
      title: approved ? 'Account Approved!' : 'Account Application Update',
      message: approved 
        ? 'Your counsellor account has been approved. You can now access all counsellor features.'
        : `Your counsellor application was not approved. ${reason || 'Please contact support for more information.'}`,
      read: false,
      createdAt: new Date()
    });

    logger.info(`Counsellor ${approved ? 'approved' : 'denied'}: ${userId} by admin ${req.user.uid}`);

    res.json({
      success: true,
      message: `Counsellor ${approved ? 'approved' : 'denied'} successfully`
    });

  } catch (error) {
    logger.error('Approve counsellor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update counsellor approval status'
    });
  }
});

/**
 * @route POST /api/admin/block-user/:userId
 * @desc Block or unblock a user account
 * @access Admin only
 */
router.post('/block-user/:userId', [
  verifyFirebaseToken,
  requireAdmin,
  body('blocked').isBoolean().withMessage('Blocked must be a boolean'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  auditLog('admin_block_user')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { blocked, reason } = req.body;

    // Update user document
    await db.collection('users').doc(userId).update({
      blocked,
      blockedAt: blocked ? new Date() : null,
      blockedBy: blocked ? req.user.uid : null,
      blockReason: blocked ? reason : null,
      unblockedAt: !blocked ? new Date() : null,
      updatedAt: new Date()
    });

    // Update custom claims
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    await admin.auth().setCustomUserClaims(userId, {
      role: userData.role,
      approved: userData.approved,
      blocked,
      blockReason: blocked ? reason : null
    });

    // Revoke all refresh tokens to force re-authentication
    if (blocked) {
      await admin.auth().revokeRefreshTokens(userId);
    }

    // Create notification
    await db.collection('notifications').add({
      userId,
      type: blocked ? 'account_blocked' : 'account_unblocked',
      title: blocked ? 'Account Blocked' : 'Account Unblocked',
      message: blocked 
        ? `Your account has been blocked. Reason: ${reason || 'Violation of terms of service'}`
        : 'Your account has been unblocked. You can now access the platform again.',
      read: false,
      createdAt: new Date()
    });

    logger.warn(`User ${blocked ? 'blocked' : 'unblocked'}: ${userId} by admin ${req.user.uid}. Reason: ${reason}`);

    res.json({
      success: true,
      message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`
    });

  } catch (error) {
    logger.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user block status'
    });
  }
});

/**
 * @route GET /api/admin/stats
 * @desc Get platform statistics
 * @access Admin only
 */
router.get('/stats', [
  verifyFirebaseToken,
  requireAdmin,
  auditLog('admin_view_stats')
], async (req, res) => {
  try {
    // Get user counts
    const [studentsSnapshot, counsellorsSnapshot, adminsSnapshot] = await Promise.all([
      db.collection('users').where('role', '==', 'student').get(),
      db.collection('users').where('role', '==', 'counsellor').get(),
      db.collection('users').where('role', '==', 'admin').get()
    ]);

    // Get pending approvals count
    const pendingSnapshot = await db.collection('users')
      .where('role', '==', 'counsellor')
      .where('approved', '==', false)
      .where('blocked', '==', false)
      .get();

    // Get recent activity counts
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentUsersSnapshot, recentSessionsSnapshot, recentReportsSnapshot] = await Promise.all([
      db.collection('users').where('createdAt', '>=', oneDayAgo).get(),
      db.collection('sessions').where('createdAt', '>=', oneWeekAgo).get(),
      db.collection('reports').where('createdAt', '>=', oneWeekAgo).get()
    ]);

    // Get crisis reports count
    const crisisReportsSnapshot = await db.collection('reports')
      .where('type', '==', 'crisis')
      .where('status', '==', 'open')
      .get();

    const stats = {
      users: {
        total: studentsSnapshot.size + counsellorsSnapshot.size + adminsSnapshot.size,
        students: studentsSnapshot.size,
        counsellors: counsellorsSnapshot.size,
        admins: adminsSnapshot.size,
        pendingApprovals: pendingSnapshot.size
      },
      activity: {
        newUsersToday: recentUsersSnapshot.size,
        sessionsThisWeek: recentSessionsSnapshot.size,
        reportsThisWeek: recentReportsSnapshot.size,
        openCrisisReports: crisisReportsSnapshot.size
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform statistics'
    });
  }
});

/**
 * @route GET /api/admin/reports
 * @desc Get all reports with filtering
 * @access Admin only
 */
router.get('/reports', [
  verifyFirebaseToken,
  requireAdmin,
  auditLog('admin_view_reports')
], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status,
      priority 
    } = req.query;

    let query = db.collection('reports');

    // Apply filters
    if (type) {
      query = query.where('type', '==', type);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    if (priority) {
      query = query.where('priority', '==', priority);
    }

    // Get total count
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const reportsSnapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(parseInt(limit))
      .get();

    const reports = [];
    for (const doc of reportsSnapshot.docs) {
      const reportData = doc.data();
      
      // Get reporter information
      let reporterInfo = null;
      if (reportData.reporterId) {
        const reporterDoc = await db.collection('users').doc(reportData.reporterId).get();
        if (reporterDoc.exists) {
          const reporterData = reporterDoc.data();
          reporterInfo = {
            name: reporterData.name,
            email: reporterData.email,
            role: reporterData.role
          };
        }
      }

      reports.push({
        id: doc.id,
        ...reportData,
        reporter: reporterInfo
      });
    }

    res.json({
      success: true,
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports'
    });
  }
});

/**
 * @route PUT /api/admin/reports/:reportId
 * @desc Update report status
 * @access Admin only
 */
router.put('/reports/:reportId', [
  verifyFirebaseToken,
  requireAdmin,
  body('status').isIn(['open', 'investigating', 'resolved', 'closed']).withMessage('Invalid status'),
  body('adminNotes').optional().isString().withMessage('Admin notes must be a string'),
  auditLog('admin_update_report')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    await db.collection('reports').doc(reportId).update({
      status,
      adminNotes: adminNotes || null,
      handledBy: req.user.uid,
      handledAt: new Date(),
      updatedAt: new Date()
    });

    logger.info(`Report ${reportId} updated to status ${status} by admin ${req.user.uid}`);

    res.json({
      success: true,
      message: 'Report updated successfully'
    });

  } catch (error) {
    logger.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report'
    });
  }
});

/**
 * @route DELETE /api/admin/users/:userId/complete
 * @desc Completely delete user from both Firebase Auth and Firestore
 * @access Admin only
 */
router.delete('/users/:userId/complete', [
  verifyFirebaseToken,
  requireAdmin,
  auditLog('admin_complete_delete_user')
], async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    logger.info(`Admin ${req.user.uid} attempting complete deletion of user ${userId}`);

    // Step 1: Get user data for audit log before deletion
    let userData = null;
    let userEmail = null;
    
    try {
      // Try to get user from Firestore
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        userData = userDoc.data();
        userEmail = userData.email;
      } else {
        // Try counsellors collection
        const counsellorDoc = await db.collection('counsellors').doc(userId).get();
        if (counsellorDoc.exists) {
          userData = counsellorDoc.data();
          userEmail = userData.email;
        }
      }

      // If no Firestore data, try to get email from Firebase Auth
      if (!userEmail) {
        try {
          const authUser = await admin.auth().getUser(userId);
          userEmail = authUser.email;
        } catch (authError) {
          logger.warn(`Could not get auth user data for ${userId}:`, authError.message);
        }
      }
    } catch (error) {
      logger.warn(`Could not get user data for ${userId}:`, error.message);
    }

    const deletionResults = {
      auth: { success: false, error: null },
      firestore: { success: false, collections: [], error: null }
    };

    // Step 2: Delete from Firebase Authentication
    try {
      await admin.auth().deleteUser(userId);
      deletionResults.auth.success = true;
      logger.info(`Successfully deleted user ${userId} from Firebase Auth`);
    } catch (authError) {
      deletionResults.auth.error = authError.message;
      logger.error(`Failed to delete user ${userId} from Firebase Auth:`, authError);
      
      // Continue with Firestore deletion even if auth fails
      if (authError.code !== 'auth/user-not-found') {
        // If it's not "user not found", it might be a real error
        logger.warn(`Auth deletion failed but continuing with Firestore deletion`);
      }
    }

    // Step 3: Delete from Firestore collections
    const collectionsToCheck = ['users', 'counsellors'];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const docRef = db.collection(collectionName).doc(userId);
        const docSnapshot = await docRef.get();
        
        if (docSnapshot.exists) {
          await docRef.delete();
          deletionResults.firestore.collections.push(collectionName);
          logger.info(`Successfully deleted user ${userId} from ${collectionName} collection`);
        }
      } catch (firestoreError) {
        deletionResults.firestore.error = firestoreError.message;
        logger.error(`Failed to delete user ${userId} from ${collectionName}:`, firestoreError);
      }
    }

    // Step 4: Delete related data (reports, sessions, etc.)
    try {
      // Delete user's reports
      const userReportsQuery = await db.collection('reports')
        .where('reportedUserId', '==', userId)
        .get();
      
      const reportedByQuery = await db.collection('reports')
        .where('reportedBy', '==', userId)
        .get();

      const batch = db.batch();
      
      userReportsQuery.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      reportedByQuery.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      logger.info(`Deleted related reports for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to delete related data for user ${userId}:`, error);
    }

    // Step 5: Create audit log
    try {
      await db.collection('audit_logs').add({
        action: 'COMPLETE_USER_DELETION',
        adminId: req.user.uid,
        targetUserId: userId,
        targetUserEmail: userEmail,
        reason: reason || 'No reason provided',
        deletionResults,
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (auditError) {
      logger.error('Failed to create audit log:', auditError);
    }

    // Determine overall success
    const overallSuccess = deletionResults.auth.success || deletionResults.firestore.collections.length > 0;

    if (overallSuccess) {
      res.json({
        success: true,
        message: 'User deletion completed',
        results: {
          userEmail: userEmail,
          authDeleted: deletionResults.auth.success,
          firestoreCollectionsDeleted: deletionResults.firestore.collections,
          totalOperations: (deletionResults.auth.success ? 1 : 0) + deletionResults.firestore.collections.length
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete user from both Auth and Firestore',
        error: {
          auth: deletionResults.auth.error,
          firestore: deletionResults.firestore.error
        }
      });
    }

  } catch (error) {
    logger.error('Complete user deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user completely',
      error: error.message
    });
  }
});

/**
 * @route POST /api/admin/cleanup/auth-firestore
 * @desc Find and clean up orphaned auth accounts or firestore documents
 * @access Admin only
 */
router.post('/cleanup/auth-firestore', [
  verifyFirebaseToken,
  requireAdmin,
  auditLog('admin_cleanup_auth_firestore')
], async (req, res) => {
  try {
    const { dryRun = true } = req.body;

    logger.info(`Starting auth-firestore cleanup (dry run: ${dryRun}) by admin ${req.user.uid}`);

    const cleanup = {
      orphanedAuthUsers: [],
      orphanedFirestoreUsers: [],
      orphanedFirestoreCounsellors: []
    };

    // Step 1: Get all Firebase Auth users
    const authUsers = new Map();
    let nextPageToken;
    
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      listUsersResult.users.forEach(user => {
        authUsers.set(user.uid, {
          uid: user.uid,
          email: user.email,
          creationTime: user.metadata.creationTime
        });
      });
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    // Step 2: Get all Firestore users
    const firestoreUsers = new Map();
    const usersSnapshot = await db.collection('users').get();
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      firestoreUsers.set(doc.id, {
        uid: doc.id,
        email: data.email,
        role: data.role
      });
    });

    // Step 3: Get all Firestore counsellors
    const firestoreCounsellors = new Map();
    const counsellorsSnapshot = await db.collection('counsellors').get();
    counsellorsSnapshot.forEach(doc => {
      const data = doc.data();
      firestoreCounsellors.set(doc.id, {
        uid: doc.id,
        email: data.email,
        role: data.role
      });
    });

    // Step 4: Find orphaned Auth users (auth exists but no firestore)
    for (const [uid, authUser] of authUsers) {
      const hasFirestoreUser = firestoreUsers.has(uid);
      const hasFirestoreCounsellor = firestoreCounsellors.has(uid);
      
      if (!hasFirestoreUser && !hasFirestoreCounsellor) {
        cleanup.orphanedAuthUsers.push(authUser);
      }
    }

    // Step 5: Find orphaned Firestore users (firestore exists but no auth)
    for (const [uid, firestoreUser] of firestoreUsers) {
      if (!authUsers.has(uid)) {
        cleanup.orphanedFirestoreUsers.push(firestoreUser);
      }
    }

    // Step 6: Find orphaned Firestore counsellors
    for (const [uid, firestoreCounsellor] of firestoreCounsellors) {
      if (!authUsers.has(uid)) {
        cleanup.orphanedFirestoreCounsellors.push(firestoreCounsellor);
      }
    }

    // Step 7: Perform cleanup if not dry run
    const cleanupResults = {
      authUsersDeleted: 0,
      firestoreUsersDeleted: 0,
      firestoreCounsellorsDeleted: 0
    };

    if (!dryRun) {
      // Delete orphaned auth users
      for (const authUser of cleanup.orphanedAuthUsers) {
        try {
          await admin.auth().deleteUser(authUser.uid);
          cleanupResults.authUsersDeleted++;
          logger.info(`Deleted orphaned auth user: ${authUser.email}`);
        } catch (error) {
          logger.error(`Failed to delete auth user ${authUser.uid}:`, error);
        }
      }

      // Delete orphaned firestore users
      for (const firestoreUser of cleanup.orphanedFirestoreUsers) {
        try {
          await db.collection('users').doc(firestoreUser.uid).delete();
          cleanupResults.firestoreUsersDeleted++;
          logger.info(`Deleted orphaned firestore user: ${firestoreUser.email}`);
        } catch (error) {
          logger.error(`Failed to delete firestore user ${firestoreUser.uid}:`, error);
        }
      }

      // Delete orphaned firestore counsellors
      for (const firestoreCounsellor of cleanup.orphanedFirestoreCounsellors) {
        try {
          await db.collection('counsellors').doc(firestoreCounsellor.uid).delete();
          cleanupResults.firestoreCounsellorsDeleted++;
          logger.info(`Deleted orphaned firestore counsellor: ${firestoreCounsellor.email}`);
        } catch (error) {
          logger.error(`Failed to delete firestore counsellor ${firestoreCounsellor.uid}:`, error);
        }
      }
    }

    res.json({
      success: true,
      message: dryRun ? 'Cleanup analysis completed' : 'Cleanup completed',
      analysis: {
        totalAuthUsers: authUsers.size,
        totalFirestoreUsers: firestoreUsers.size,
        totalFirestoreCounsellors: firestoreCounsellors.size,
        orphanedAuthUsers: cleanup.orphanedAuthUsers.length,
        orphanedFirestoreUsers: cleanup.orphanedFirestoreUsers.length,
        orphanedFirestoreCounsellors: cleanup.orphanedFirestoreCounsellors.length
      },
      orphans: cleanup,
      cleanupResults: dryRun ? null : cleanupResults
    });

  } catch (error) {
    logger.error('Auth-Firestore cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform cleanup',
      error: error.message
    });
  }
});

module.exports = router;