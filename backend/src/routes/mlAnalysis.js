const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mlIntegrationService = require('../services/mlIntegrationService');
const logger = require('../utils/logger');

/**
 * @route POST /api/ml/analyze-assessment
 * @desc Analyze mental health assessment using ML models
 * @access Private
 */
router.post('/analyze-assessment', auth, async (req, res) => {
    try {
        const { answers, metadata, sessionId } = req.body;
        const userId = req.user.uid;

        // Validate input
        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({
                error: 'Assessment answers are required',
                code: 'INVALID_INPUT'
            });
        }

        // Prepare assessment data for ML analysis
        const assessmentData = {
            answers,
            metadata: {
                ...metadata,
                userId,
                sessionId: sessionId || `session_${Date.now()}`,
                timestamp: new Date().toISOString(),
                startTime: Date.now()
            },
            userId,
            sessionId
        };

        // Add institutional context if available
        if (req.user.institutionId) {
            assessmentData.institutionData = {
                id: req.user.institutionId,
                academicPeriod: metadata?.academicPeriod,
                counselingCenter: {
                    contact: process.env.COUNSELING_CENTER_CONTACT
                },
                supportGroups: {
                    schedule: process.env.SUPPORT_GROUPS_SCHEDULE,
                    contact: process.env.SUPPORT_GROUPS_CONTACT
                }
            };
        }

        // Add cultural context if available
        if (req.user.culturalData || metadata?.culturalPreferences) {
            assessmentData.culturalData = {
                preferredLanguage: req.user.culturalData?.language || metadata?.preferredLanguage || 'en',
                background: req.user.culturalData?.background || metadata?.culturalBackground || 'western'
            };
        }

        logger.info(`Starting ML analysis for user ${userId}, session ${sessionId}`);

        // Run ML analysis
        const analysisResults = await mlIntegrationService.analyzeAssessment(assessmentData);

        // Log analysis completion
        logger.info(`ML analysis completed for user ${userId}`, {
            sessionId,
            riskLevel: analysisResults.crisis_assessment?.risk_level,
            analysisType: analysisResults.assessment_metadata?.analysis_type,
            mlServiceAvailable: analysisResults.integration_data?.service_available
        });

        // Check for crisis situations and trigger alerts if needed
        if (analysisResults.crisis_assessment?.immediate_action_required) {
            await handleCrisisAlert(userId, analysisResults, req.user);
        }

        // Store analysis results (you might want to save to database)
        await storeAnalysisResults(userId, sessionId, analysisResults);

        // Return results
        res.json({
            success: true,
            sessionId,
            analysis: analysisResults,
            recommendations: formatRecommendations(analysisResults),
            next_steps: formatNextSteps(analysisResults),
            service_info: {
                ml_service_used: analysisResults.integration_data?.service_available || false,
                analysis_type: analysisResults.assessment_metadata?.analysis_type || 'unknown',
                processing_time: analysisResults.integration_data?.processing_time
            }
        });

    } catch (error) {
        logger.error('ML analysis failed:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message,
            code: 'ML_ANALYSIS_ERROR'
        });
    }
});

/**
 * @route GET /api/ml/service-status
 * @desc Get ML service status and capabilities
 * @access Private
 */
router.get('/service-status', auth, async (req, res) => {
    try {
        const status = mlIntegrationService.getServiceStatus();
        
        res.json({
            success: true,
            status,
            capabilities: {
                ml_interpretation: status.ml_service_available,
                crisis_detection: true,
                inconsistency_analysis: status.ml_service_available,
                personalized_feedback: true,
                intervention_recommendations: true,
                cultural_adaptation: true,
                institutional_integration: true
            },
            fallback_available: true
        });
    } catch (error) {
        logger.error('Failed to get ML service status:', error);
        res.status(500).json({
            error: 'Failed to get service status',
            message: error.message
        });
    }
});

/**
 * @route POST /api/ml/install-dependencies
 * @desc Install ML dependencies (admin only)
 * @access Private (Admin)
 */
router.post('/install-dependencies', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Admin access required',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        logger.info(`Admin ${req.user.uid} initiated ML dependencies installation`);

        // Install dependencies
        const installOutput = await mlIntegrationService.installMLDependencies();

        // Reinitialize ML service
        await mlIntegrationService.initializeMLService();

        res.json({
            success: true,
            message: 'ML dependencies installed successfully',
            output: installOutput,
            service_status: mlIntegrationService.getServiceStatus()
        });

    } catch (error) {
        logger.error('ML dependencies installation failed:', error);
        res.status(500).json({
            error: 'Installation failed',
            message: error.message,
            code: 'INSTALLATION_ERROR'
        });
    }
});

/**
 * @route GET /api/ml/analysis-history/:sessionId
 * @desc Get previous analysis results for a session
 * @access Private
 */
router.get('/analysis-history/:sessionId', auth, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.uid;

        // Retrieve analysis history from database
        const history = await getAnalysisHistory(userId, sessionId);

        if (!history) {
            return res.status(404).json({
                error: 'Analysis session not found',
                code: 'SESSION_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            sessionId,
            history
        });

    } catch (error) {
        logger.error('Failed to retrieve analysis history:', error);
        res.status(500).json({
            error: 'Failed to retrieve history',
            message: error.message
        });
    }
});

/**
 * @route POST /api/ml/feedback
 * @desc Submit feedback on ML analysis quality
 * @access Private
 */
router.post('/feedback', auth, async (req, res) => {
    try {
        const { sessionId, rating, feedback, helpful_recommendations } = req.body;
        const userId = req.user.uid;

        // Validate input
        if (!sessionId || rating === undefined) {
            return res.status(400).json({
                error: 'Session ID and rating are required',
                code: 'INVALID_INPUT'
            });
        }

        // Store feedback for ML model improvement
        await storeFeedback(userId, sessionId, {
            rating,
            feedback,
            helpful_recommendations,
            timestamp: new Date().toISOString()
        });

        logger.info(`Feedback received for session ${sessionId}`, {
            userId,
            rating,
            hasTextFeedback: !!feedback
        });

        res.json({
            success: true,
            message: 'Feedback recorded successfully'
        });

    } catch (error) {
        logger.error('Failed to record feedback:', error);
        res.status(500).json({
            error: 'Failed to record feedback',
            message: error.message
        });
    }
});

// Helper functions

async function handleCrisisAlert(userId, analysisResults, userInfo) {
    try {
        const alertData = {
            userId,
            timestamp: new Date().toISOString(),
            riskLevel: analysisResults.crisis_assessment.risk_level,
            crisisIndicators: analysisResults.crisis_assessment.crisis_indicators,
            userInfo: {
                email: userInfo.email,
                name: userInfo.name,
                institution: userInfo.institutionId
            }
        };

        // Log crisis alert
        logger.error('CRISIS ALERT TRIGGERED', alertData);

        // Here you would implement crisis intervention protocols:
        // 1. Notify counselors/administrators
        // 2. Send emergency contact information
        // 3. Trigger automated crisis support resources
        // 4. Store crisis event for follow-up

        // Example: Send email to crisis team
        if (process.env.CRISIS_TEAM_EMAIL) {
            // await sendCrisisAlert(alertData);
        }

        // Example: Create crisis event record
        // await createCrisisEvent(alertData);

    } catch (error) {
        logger.error('Failed to handle crisis alert:', error);
        // Don't throw - crisis detection should not fail the analysis
    }
}

async function storeAnalysisResults(userId, sessionId, results) {
    try {
        // In a real implementation, you would store this in your database
        // For now, we'll just log the storage operation
        logger.info(`Storing analysis results for user ${userId}, session ${sessionId}`, {
            riskLevel: results.crisis_assessment?.risk_level,
            phq9Score: results.clinical_scores?.phq9_score,
            gad7Score: results.clinical_scores?.gad7_score
        });

        // Example database storage:
        // await db.collection('analysis_results').add({
        //     userId,
        //     sessionId,
        //     results,
        //     timestamp: new Date()
        // });

    } catch (error) {
        logger.error('Failed to store analysis results:', error);
        // Don't throw - storage failure should not fail the analysis
    }
}

async function getAnalysisHistory(userId, sessionId) {
    try {
        // In a real implementation, retrieve from database
        // For now, return mock data
        return {
            sessionId,
            userId,
            timestamp: new Date().toISOString(),
            message: 'Analysis history retrieval not yet implemented'
        };
    } catch (error) {
        logger.error('Failed to get analysis history:', error);
        return null;
    }
}

async function storeFeedback(userId, sessionId, feedbackData) {
    try {
        // Store feedback for ML model improvement
        logger.info(`Storing feedback for session ${sessionId}`, {
            userId,
            rating: feedbackData.rating
        });

        // Example database storage:
        // await db.collection('ml_feedback').add({
        //     userId,
        //     sessionId,
        //     ...feedbackData
        // });

    } catch (error) {
        logger.error('Failed to store feedback:', error);
        throw error;
    }
}

function formatRecommendations(analysisResults) {
    const recommendations = analysisResults.intervention_recommendations || [];
    
    return recommendations.map(rec => ({
        ...rec,
        priority_score: getPriorityScore(rec),
        estimated_duration: rec.duration || 'Varies',
        accessibility: 'Check with your institution for availability'
    }));
}

function formatNextSteps(analysisResults) {
    const nextSteps = analysisResults.next_steps || [];
    
    return nextSteps.map(step => ({
        ...step,
        resources: getResourcesForStep(step),
        tracking_suggestions: getTrackingSuggestions(step)
    }));
}

function getPriorityScore(recommendation) {
    const priorityMap = {
        'immediate': 10,
        'high': 8,
        'medium': 5,
        'low': 2
    };
    return priorityMap[recommendation.priority] || 5;
}

function getResourcesForStep(step) {
    const resourceMap = {
        'Contact crisis services': [
            'National Suicide Prevention Lifeline: 988',
            'Crisis Text Line: Text HOME to 741741',
            'Emergency Services: 911'
        ],
        'Schedule professional help': [
            'Campus Counseling Center',
            'Local mental health clinics',
            'Psychology Today therapist finder'
        ],
        'Start self-care routine': [
            'Meditation apps (Headspace, Calm)',
            'Exercise apps (Nike Training, Yoga with Adriene)',
            'Sleep tracking apps'
        ]
    };
    
    return resourceMap[step.action] || ['Speak with a counselor for specific resources'];
}

function getTrackingSuggestions(step) {
    const trackingMap = {
        'Start self-care routine': [
            'Daily mood tracking',
            'Activity completion checklist',
            'Sleep and exercise log'
        ],
        'Connect with support system': [
            'Weekly check-ins with friends/family',
            'Support group attendance',
            'Social activity participation'
        ]
    };
    
    return trackingMap[step.action] || ['Regular self-assessment'];
}

module.exports = router;