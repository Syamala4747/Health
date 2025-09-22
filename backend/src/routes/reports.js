const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const { createDocument, queryDocuments, updateDocument, getDocument, COLLECTIONS } = require('../config/firebase');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * Create a new report
 */
router.post('/', [
  authMiddleware,
  body('reportedId').isString(),
  body('reason').isString().isLength({ min: 10, max: 1000 }),
  body('type').isIn(['inappropriate_behavior', 'harassment', 'spam', 'crisis_detection', 'other']),
  body('sessionId').optional().isString(),
  body('messageId').optional().isString(),
  body('evidence').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { reportedId, reason, type, sessionId, messageId, evidence } = req.body;
  const reporterId = req.user.uid;

  try {
    // Validate that reported user exists
    const reportedUser = await getDocument(COLLECTIONS.USERS, reportedId);
    if (!reportedUser) {
      return res.status(404).json({ error: 'Reported user not found' });
    }

    // Check if user is trying to report themselves
    if (reporterId === reportedId) {
      return res.status(400).json({ error: 'Cannot report yourself' });
    }

    // Determine priority based on type and content
    let priority = 'medium';
    if (type === 'crisis_detection' || reason.toLowerCase().includes('suicide') || reason.toLowerCase().includes('harm')) {
      priority = 'high';
    } else if (type === 'spam' || type === 'other') {
      priority = 'low';
    }

    const reportData = {
      reporterId,
      reportedId,
      reason,
      type,
      priority,
      status: 'open',
      sessionId: sessionId || null,
      messageId: messageId || null,
      evidence: evidence || null,
      createdAt: new Date().toISOString()
    };

    const reportId = await createDocument(COLLECTIONS.REPORTS, reportData);

    // Log the report creation
    logger.info('Report created', {
      reportId,
      reporterId,
      reportedId,
      type,
      priority
    });

    // If high priority, create notification for admins
    if (priority === 'high') {
      await createDocument(COLLECTIONS.NOTIFICATIONS, {
        type: 'high_priority_report',
        title: 'High Priority Report Created',
        message: `A high priority report has been created for user ${reportedUser.name}`,
        data: { reportId, type },
        recipients: ['admin'],
        read: false
      });
    }

    res.status(201).json({
      message: 'Report submitted successfully',
      reportId,
      priority,
      status: 'open'
    });

  } catch (error) {
    logger.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
}));

/**
 * Get user's reports (reports they created)
 */
router.get('/my-reports', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  try {
    const reports = await queryDocuments(COLLECTIONS.REPORTS, [
      { field: 'reporterId', operator: '==', value: userId }
    ], { field: 'createdAt', direction: 'desc' });

    // Enrich with reported user info
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      const reportedUser = await getDocument(COLLECTIONS.USERS, report.reportedId);
      return {
        ...report,
        reportedUser: reportedUser ? {
          name: reportedUser.name,
          role: reportedUser.role
        } : null
      };
    }));

    res.json({ reports: enrichedReports });
  } catch (error) {
    logger.error('Get my reports error:', error);
    res.status(500).json({ error: 'Failed to retrieve reports' });
  }
}));

/**
 * Get reports about a user (for counsellors to see reports about their students)
 */
router.get('/about/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.uid;
  const requesterRole = req.user.role;

  try {
    // Only admins and the user themselves can see reports about a user
    if (requesterRole !== 'admin' && requesterId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const reports = await queryDocuments(COLLECTIONS.REPORTS, [
      { field: 'reportedId', operator: '==', value: userId }
    ], { field: 'createdAt', direction: 'desc' });

    // For non-admins, filter out sensitive information
    let filteredReports = reports;
    if (requesterRole !== 'admin') {
      filteredReports = reports.map(report => ({
        id: report.id,
        type: report.type,
        status: report.status,
        createdAt: report.createdAt,
        // Hide sensitive details for non-admins
        reason: 'Details hidden for privacy'
      }));
    }

    res.json({ reports: filteredReports });
  } catch (error) {
    logger.error('Get reports about user error:', error);
    res.status(500).json({ error: 'Failed to retrieve reports' });
  }
}));

/**
 * Update report status (for users to withdraw reports)
 */
router.put('/:reportId', [
  authMiddleware,
  body('action').isIn(['withdraw', 'update']),
  body('reason').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { reportId } = req.params;
  const { action, reason } = req.body;
  const userId = req.user.uid;

  try {
    const report = await getDocument(COLLECTIONS.REPORTS, reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Only the reporter can withdraw their own report
    if (report.reporterId !== userId) {
      return res.status(403).json({ error: 'Can only modify your own reports' });
    }

    // Can't modify reports that are already resolved or closed
    if (report.status === 'resolved' || report.status === 'closed') {
      return res.status(400).json({ error: 'Cannot modify resolved or closed reports' });
    }

    let updateData = {};

    if (action === 'withdraw') {
      updateData = {
        status: 'withdrawn',
        withdrawnAt: new Date().toISOString(),
        withdrawReason: reason || 'Withdrawn by reporter'
      };
    } else if (action === 'update' && reason) {
      updateData = {
        reason: reason,
        updatedAt: new Date().toISOString()
      };
    }

    await updateDocument(COLLECTIONS.REPORTS, reportId, updateData);

    logger.info('Report updated by user', {
      reportId,
      userId,
      action,
      newStatus: updateData.status
    });

    res.json({ 
      message: `Report ${action}ed successfully`,
      status: updateData.status || report.status
    });

  } catch (error) {
    logger.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
}));

/**
 * Get report statistics for user
 */
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  try {
    // Get reports created by user
    const myReports = await queryDocuments(COLLECTIONS.REPORTS, [
      { field: 'reporterId', operator: '==', value: userId }
    ]);

    // Get reports about user (if any)
    const reportsAboutMe = await queryDocuments(COLLECTIONS.REPORTS, [
      { field: 'reportedId', operator: '==', value: userId }
    ]);

    const stats = {
      reportsCreated: {
        total: myReports.length,
        open: myReports.filter(r => r.status === 'open').length,
        resolved: myReports.filter(r => r.status === 'resolved').length,
        withdrawn: myReports.filter(r => r.status === 'withdrawn').length
      },
      reportsAboutMe: {
        total: reportsAboutMe.length,
        open: reportsAboutMe.filter(r => r.status === 'open').length,
        resolved: reportsAboutMe.filter(r => r.status === 'resolved').length
      }
    };

    res.json(stats);
  } catch (error) {
    logger.error('Get report stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve report statistics' });
  }
}));

/**
 * Report types and guidelines
 */
router.get('/types', (req, res) => {
  const reportTypes = {
    inappropriate_behavior: {
      name: 'Inappropriate Behavior',
      description: 'User is behaving inappropriately or unprofessionally',
      examples: ['Rude language', 'Unprofessional conduct', 'Boundary violations']
    },
    harassment: {
      name: 'Harassment',
      description: 'User is harassing or bullying others',
      examples: ['Repeated unwanted contact', 'Threatening behavior', 'Discriminatory language']
    },
    spam: {
      name: 'Spam',
      description: 'User is sending spam or irrelevant content',
      examples: ['Promotional messages', 'Repetitive content', 'Off-topic messages']
    },
    crisis_detection: {
      name: 'Crisis Detection',
      description: 'System detected potential crisis language',
      examples: ['Suicidal ideation', 'Self-harm mentions', 'Crisis keywords']
    },
    other: {
      name: 'Other',
      description: 'Other issues not covered by the above categories',
      examples: ['Technical issues', 'Privacy concerns', 'Other violations']
    }
  };

  const guidelines = {
    beforeReporting: [
      'Try to resolve the issue directly with the user if safe to do so',
      'Document specific incidents with dates and times',
      'Save screenshots or evidence if available',
      'Consider if the behavior violates community guidelines'
    ],
    whatToInclude: [
      'Specific description of the incident',
      'Date and time of occurrence',
      'Any evidence or screenshots',
      'Impact on your wellbeing or safety'
    ],
    afterReporting: [
      'You will receive updates on the report status',
      'Additional information may be requested',
      'Reports are handled confidentially',
      'False reports may result in account restrictions'
    ]
  };

  res.json({ reportTypes, guidelines });
});

module.exports = router;