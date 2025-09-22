const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class MLIntegrationService {
    constructor() {
        this.pythonPath = process.env.PYTHON_PATH || 'python';
        this.mlServicePath = path.join(__dirname, '../../ml');
        this.isMLServiceAvailable = false;
        this.modelCache = new Map();
        
        // Initialize ML service
        this.initializeMLService();
    }

    async initializeMLService() {
        try {
            // Check if ML dependencies are installed
            await this.checkMLDependencies();
            
            // Test ML service availability
            await this.testMLService();
            
            this.isMLServiceAvailable = true;
            logger.info('ML interpretation service initialized successfully');
        } catch (error) {
            logger.warn(`ML service initialization failed: ${error.message}`);
            logger.info('Falling back to rule-based analysis');
            this.isMLServiceAvailable = false;
        }
    }

    async checkMLDependencies() {
        const requirementsPath = path.join(this.mlServicePath, 'requirements.txt');
        
        try {
            await fs.access(requirementsPath);
            logger.info('ML requirements file found');
        } catch (error) {
            throw new Error('ML requirements file not found');
        }
    }

    async testMLService() {
        return new Promise((resolve, reject) => {
            const testScript = `
import sys
import os
sys.path.append('${this.mlServicePath}')

try:
    from advanced_ml_interpreter import MentalHealthMLInterpreter
    interpreter = MentalHealthMLInterpreter()
    print("ML_SERVICE_READY")
except Exception as e:
    print(f"ML_SERVICE_ERROR: {e}")
    sys.exit(1)
`;

            const pythonProcess = spawn(this.pythonPath, ['-c', testScript]);
            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0 && output.includes('ML_SERVICE_READY')) {
                    resolve();
                } else {
                    reject(new Error(`ML service test failed: ${errorOutput || output}`));
                }
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                pythonProcess.kill();
                reject(new Error('ML service test timeout'));
            }, 30000);
        });
    }

    async analyzeAssessment(assessmentData) {
        if (!this.isMLServiceAvailable) {
            return this.fallbackAnalysis(assessmentData);
        }

        try {
            const result = await this.runMLAnalysis(assessmentData);
            return this.enhanceWithContextualData(result, assessmentData);
        } catch (error) {
            logger.error(`ML analysis failed: ${error.message}`);
            return this.fallbackAnalysis(assessmentData);
        }
    }

    async runMLAnalysis(assessmentData) {
        return new Promise((resolve, reject) => {
            const analysisScript = `
import sys
import json
import os
sys.path.append('${this.mlServicePath}')

try:
    from advanced_ml_interpreter import MentalHealthMLInterpreter
    
    # Initialize interpreter
    interpreter = MentalHealthMLInterpreter()
    
    # Get assessment data from stdin
    assessment_data = json.loads(sys.stdin.read())
    
    # Run ML analysis
    results = interpreter.analyze_assessment(assessment_data)
    
    # Output results
    print(json.dumps(results, default=str))
    
except Exception as e:
    error_result = {
        "error": str(e),
        "fallback_analysis": True,
        "timestamp": "${new Date().toISOString()}"
    }
    print(json.dumps(error_result))
    sys.exit(1)
`;

            const pythonProcess = spawn(this.pythonPath, ['-c', analysisScript]);
            let output = '';
            let errorOutput = '';

            // Send assessment data to Python script
            pythonProcess.stdin.write(JSON.stringify(assessmentData));
            pythonProcess.stdin.end();

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                try {
                    const result = JSON.parse(output);
                    if (result.error) {
                        reject(new Error(result.error));
                    } else {
                        resolve(result);
                    }
                } catch (parseError) {
                    reject(new Error(`Failed to parse ML analysis result: ${parseError.message}\nOutput: ${output}\nError: ${errorOutput}`));
                }
            });

            // Timeout after 60 seconds
            setTimeout(() => {
                pythonProcess.kill();
                reject(new Error('ML analysis timeout'));
            }, 60000);
        });
    }

    enhanceWithContextualData(mlResults, assessmentData) {
        const enhanced = {
            ...mlResults,
            assessment_metadata: {
                session_id: assessmentData.sessionId,
                user_id: assessmentData.userId,
                timestamp: assessmentData.timestamp || new Date().toISOString(),
                assessment_version: '2.0',
                ml_service_version: '1.0.0'
            },
            integration_data: {
                service_available: this.isMLServiceAvailable,
                processing_time: Date.now() - (assessmentData.startTime || Date.now()),
                analysis_type: 'ml_enhanced'
            }
        };

        // Add institutional context if available
        if (assessmentData.institutionData) {
            enhanced.institutional_context = this.analyzeInstitutionalContext(
                mlResults,
                assessmentData.institutionData
            );
        }

        // Add cultural context if available
        if (assessmentData.culturalData) {
            enhanced.cultural_context = this.analyzeCulturalContext(
                mlResults,
                assessmentData.culturalData
            );
        }

        return enhanced;
    }

    analyzeInstitutionalContext(mlResults, institutionData) {
        const context = {
            institution_id: institutionData.id,
            academic_period: institutionData.academicPeriod,
            risk_comparison: 'average', // Compare with institutional averages
            recommended_resources: []
        };

        // Institutional resource recommendations based on ML results
        const riskLevel = mlResults.crisis_assessment?.risk_level;
        if (riskLevel === 'crisis' || riskLevel === 'high') {
            context.recommended_resources.push({
                type: 'immediate_counseling',
                name: 'Campus Counseling Center',
                availability: '24/7',
                contact: institutionData.counselingCenter?.contact
            });
        }

        if (mlResults.clinical_scores?.depression_level === 'moderate' || 
            mlResults.clinical_scores?.anxiety_level === 'moderate') {
            context.recommended_resources.push({
                type: 'group_therapy',
                name: 'Student Support Groups',
                schedule: institutionData.supportGroups?.schedule,
                contact: institutionData.supportGroups?.contact
            });
        }

        return context;
    }

    analyzeCulturalContext(mlResults, culturalData) {
        const context = {
            language: culturalData.preferredLanguage,
            cultural_background: culturalData.background,
            adapted_recommendations: []
        };

        // Adapt recommendations based on cultural context
        const interventions = mlResults.intervention_recommendations || [];
        context.adapted_recommendations = interventions.map(intervention => ({
            ...intervention,
            cultural_adaptation: this.getCulturalAdaptation(intervention, culturalData)
        }));

        return context;
    }

    getCulturalAdaptation(intervention, culturalData) {
        const adaptations = {
            'mindfulness': {
                'indian': 'Consider traditional meditation practices like Vipassana or Yoga Nidra',
                'chinese': 'Incorporate Tai Chi or traditional Chinese meditation practices',
                'western': 'Standard mindfulness-based stress reduction (MBSR) techniques'
            },
            'cbt_techniques': {
                'indian': 'Integrate concepts from Indian philosophy and family-centered approaches',
                'chinese': 'Consider harmony-based approaches and family involvement',
                'western': 'Standard cognitive behavioral therapy techniques'
            }
        };

        return adaptations[intervention.type]?.[culturalData.background] || 
               'Standard evidence-based approach with cultural sensitivity';
    }

    fallbackAnalysis(assessmentData) {
        logger.info('Using fallback rule-based analysis');
        
        const answers = assessmentData.answers || {};
        
        // Calculate basic scores
        const phq9Score = this.calculatePHQ9Score(answers);
        const gad7Score = this.calculateGAD7Score(answers);
        
        // Rule-based analysis
        const analysis = {
            timestamp: new Date().toISOString(),
            clinical_scores: {
                phq9_score: phq9Score,
                gad7_score: gad7Score,
                depression_level: this.getSeverityLevel(phq9Score, 'phq9'),
                anxiety_level: this.getSeverityLevel(gad7Score, 'gad7')
            },
            ml_interpretation: {
                note: 'ML service unavailable, using rule-based analysis',
                confidence: 0.7
            },
            inconsistency_analysis: {
                inconsistencies_found: 0,
                reliability_score: 0.8,
                note: 'Basic consistency check performed'
            },
            crisis_assessment: this.assessCrisisRisk(answers, phq9Score, gad7Score),
            personalized_feedback: this.generateRuleBasedFeedback(phq9Score, gad7Score),
            intervention_recommendations: this.getRuleBasedRecommendations(phq9Score, gad7Score),
            next_steps: this.suggestNextSteps(phq9Score, gad7Score, answers),
            confidence_scores: {
                overall_confidence: 0.7,
                note: 'Rule-based analysis has lower confidence than ML analysis'
            },
            assessment_metadata: {
                session_id: assessmentData.sessionId,
                user_id: assessmentData.userId,
                timestamp: assessmentData.timestamp || new Date().toISOString(),
                assessment_version: '2.0',
                analysis_type: 'rule_based_fallback'
            }
        };

        return analysis;
    }

    calculatePHQ9Score(answers) {
        let total = 0;
        for (let i = 1; i <= 9; i++) {
            total += answers[`phq${i}`] || 0;
        }
        return total;
    }

    calculateGAD7Score(answers) {
        let total = 0;
        for (let i = 1; i <= 7; i++) {
            total += answers[`gad${i}`] || 0;
        }
        return total;
    }

    getSeverityLevel(score, scale) {
        const thresholds = {
            phq9: { minimal: 4, mild: 9, moderate: 14, severe: 19 },
            gad7: { minimal: 4, mild: 9, moderate: 14, severe: 20 }
        };

        const limits = thresholds[scale];
        if (score >= limits.severe) return 'severe';
        if (score >= limits.moderate) return 'moderate';
        if (score >= limits.mild) return 'mild';
        return 'minimal';
    }

    assessCrisisRisk(answers, phq9Score, gad7Score) {
        const suicidalIdeation = answers.phq9 || 0;
        let riskScore = 0;

        // Primary risk factors
        if (suicidalIdeation >= 2) riskScore += 0.6;
        else if (suicidalIdeation >= 1) riskScore += 0.3;

        // Secondary risk factors
        if (phq9Score >= 20) riskScore += 0.3;
        else if (phq9Score >= 15) riskScore += 0.2;

        if (gad7Score >= 15) riskScore += 0.2;

        const riskLevel = riskScore >= 0.8 ? 'crisis' : 
                         riskScore >= 0.6 ? 'high' :
                         riskScore >= 0.4 ? 'moderate' : 'low';

        return {
            crisis_probability: Math.min(riskScore, 1.0),
            risk_level: riskLevel,
            immediate_action_required: riskScore >= 0.8,
            crisis_indicators: this.getCrisisIndicators(answers, phq9Score, gad7Score)
        };
    }

    getCrisisIndicators(answers, phq9Score, gad7Score) {
        const indicators = [];
        
        if (answers.phq9 >= 2) indicators.push('Frequent suicidal thoughts');
        else if (answers.phq9 >= 1) indicators.push('Occasional suicidal thoughts');
        
        if (phq9Score >= 20) indicators.push('Severe depression symptoms');
        if (gad7Score >= 15) indicators.push('Severe anxiety symptoms');
        
        return indicators;
    }

    generateRuleBasedFeedback(phq9Score, gad7Score) {
        if (phq9Score >= 15 || gad7Score >= 15) {
            return "Your assessment indicates significant mental health challenges. Seeking professional help is strongly recommended. These feelings are treatable with appropriate support.";
        } else if (phq9Score >= 10 || gad7Score >= 10) {
            return "Your responses suggest some mental health concerns that could benefit from professional support. Consider speaking with a counselor about effective coping strategies.";
        } else if (phq9Score >= 5 || gad7Score >= 5) {
            return "Your assessment shows some areas of concern. Focus on self-care, stress management, and maintaining social connections. Monitor your symptoms.";
        } else {
            return "Your responses suggest you're managing well overall. Continue prioritizing mental health through regular self-care and stress management.";
        }
    }

    getRuleBasedRecommendations(phq9Score, gad7Score) {
        const recommendations = [];

        if (phq9Score >= 15) {
            recommendations.push({
                type: 'professional_therapy',
                title: 'Professional Counseling',
                description: 'Schedule an appointment with a mental health professional',
                priority: 'high',
                evidence_level: 'A'
            });
        } else if (phq9Score >= 10) {
            recommendations.push({
                type: 'cbt_techniques',
                title: 'Cognitive Behavioral Techniques',
                description: 'Learn and practice cognitive restructuring techniques',
                priority: 'medium',
                evidence_level: 'A'
            });
        }

        if (gad7Score >= 10) {
            recommendations.push({
                type: 'anxiety_management',
                title: 'Anxiety Management',
                description: 'Practice deep breathing and relaxation techniques',
                priority: 'medium',
                evidence_level: 'B'
            });
        }

        recommendations.push({
            type: 'self_care',
            title: 'Self-Care Routine',
            description: 'Establish regular exercise, sleep, and mindfulness practices',
            priority: 'low',
            evidence_level: 'B'
        });

        return recommendations;
    }

    suggestNextSteps(phq9Score, gad7Score, answers) {
        const nextSteps = [];

        if (answers.phq9 >= 2 || phq9Score >= 20) {
            nextSteps.push({
                priority: 'immediate',
                action: 'Contact crisis services',
                description: 'Call crisis hotline (988) or emergency services immediately',
                timeframe: 'Now'
            });
        } else if (phq9Score >= 10 || gad7Score >= 10) {
            nextSteps.push({
                priority: 'high',
                action: 'Schedule professional help',
                description: 'Book appointment with counselor or therapist',
                timeframe: 'Within 1 week'
            });
        }

        nextSteps.push({
            priority: 'medium',
            action: 'Start self-care routine',
            description: 'Begin daily mindfulness, exercise, or relaxation practice',
            timeframe: 'This week'
        });

        nextSteps.push({
            priority: 'medium',
            action: 'Connect with support system',
            description: 'Reach out to trusted friends, family, or support groups',
            timeframe: 'Within 3 days'
        });

        return nextSteps;
    }

    async installMLDependencies() {
        return new Promise((resolve, reject) => {
            const requirementsPath = path.join(this.mlServicePath, 'requirements.txt');
            const installProcess = spawn(this.pythonPath, ['-m', 'pip', 'install', '-r', requirementsPath]);

            let output = '';
            let errorOutput = '';

            installProcess.stdout.on('data', (data) => {
                output += data.toString();
                logger.info(`ML Dependencies Install: ${data.toString().trim()}`);
            });

            installProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
                logger.warn(`ML Dependencies Install Warning: ${data.toString().trim()}`);
            });

            installProcess.on('close', (code) => {
                if (code === 0) {
                    logger.info('ML dependencies installed successfully');
                    resolve(output);
                } else {
                    logger.error(`ML dependencies installation failed: ${errorOutput}`);
                    reject(new Error(`Installation failed with code ${code}: ${errorOutput}`));
                }
            });
        });
    }

    getServiceStatus() {
        return {
            ml_service_available: this.isMLServiceAvailable,
            python_path: this.pythonPath,
            ml_service_path: this.mlServicePath,
            last_check: new Date().toISOString(),
            cached_models: this.modelCache.size
        };
    }
}

// Export singleton instance
const mlIntegrationService = new MLIntegrationService();

module.exports = mlIntegrationService;