/**
 * Institutional Crisis Management Service
 * Integrates crisis detection with college infrastructure for immediate response
 */

const { createDocument, updateDocument, queryDocuments, COLLECTIONS } = require('../config/firebase');
const { logger, logCrisisDetection } = require('../utils/logger');
const nodemailer = require('nodemailer');

class InstitutionalCrisisManager {
  constructor() {
    this.emergencyContacts = this.loadEmergencyContacts();
    this.institutionalProtocols = this.loadInstitutionalProtocols();
    this.emailTransporter = this.setupEmailService();
    
    logger.info('Institutional Crisis Manager initialized');
  }

  loadEmergencyContacts() {
    return {
      'Kashmir Valley': {
        campusCounsellor: '+91-194-2345678',
        campusSecurity: '+91-194-2345679',
        deanOfStudents: '+91-194-2345680',
        localHospital: '+91-194-2345681',
        policeStation: '+91-194-100',
        crisisHelpline: '+91-194-2345682'
      },
      'Jammu Region': {
        campusCounsellor: '+91-191-2345678',
        campusSecurity: '+91-191-2345679',
        deanOfStudents: '+91-191-2345680',
        localHospital: '+91-191-2345681',
        policeStation: '+91-191-100',
        crisisHelpline: '+91-191-2345682'
      },
      'Ladakh': {
        campusCounsellor: '+91-1982-234567',
        campusSecurity: '+91-1982-234568',
        deanOfStudents: '+91-1982-234569',
        localHospital: '+91-1982-234570',
        policeStation: '+91-1982-100',
        crisisHelpline: '+91-1982-234571'
      }
    };
  }

  loadInstitutionalProtocols() {
    return {
      'high': {
        immediateActions: [
          'notify_campus_counsellor',
          'alert_security',
          'inform_dean',
          'contact_emergency_services'
        ],
        timeframe: '5 minutes',
        followUp: 'mandatory_24h_checkin'
      },
      'medium': {
        immediateActions: [
          'notify_campus_counsellor',
          'schedule_urgent_appointment'
        ],
        timeframe: '30 minutes',
        followUp: 'checkin_within_48h'
      },
      'low': {
        immediateActions: [
          'send_resources',
          'schedule_counsellor_appointment'
        ],
        timeframe: '2 hours',
        followUp: 'weekly_checkin'
      }
    };
  }

  setupEmailService() {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async handleCrisisDetection(userId, crisisData) {
    try {
      const user = await this.getUserDetails(userId);
      const region = this.determineRegion(user);
      const severity = this.assessCrisisSeverity(crisisData);
      
      // Create crisis incident record
      const incidentId = await this.createCrisisIncident(userId, crisisData, severity, region);
      
      // Execute institutional response protocol
      await this.executeEmergencyProtocol(incidentId, user, region, severity);
      
      // Schedule follow-up actions
      await this.scheduleFollowUp(incidentId, user, severity);
      
      logger.info(`Crisis intervention initiated for user ${userId}`, {
        incidentId,
        severity,
        region,
        confidence: crisisData.confidence
      });

      return {
        incidentId,
        severity,
        immediateActions: this.institutionalProtocols[severity].immediateActions,
        emergencyContacts: this.emergencyContacts[region],
        followUpScheduled: true
      };

    } catch (error) {
      logger.error('Crisis intervention failed:', error);
      throw error;
    }
  }

  async createCrisisIncident(userId, crisisData, severity, region) {
    const incidentData = {
      userId,
      severity,
      region,
      confidence: crisisData.confidence,
      originalMessage: crisisData.message?.substring(0, 200), // Truncated for privacy
      detectionMethod: crisisData.method,
      status: 'active',
      institutionalResponse: 'initiated',
      emergencyContactsNotified: [],
      followUpScheduled: false,
      resolvedAt: null,
      createdAt: new Date().toISOString()
    };

    return await createDocument(COLLECTIONS.CRISIS_INCIDENTS, incidentData);
  }

  async executeEmergencyProtocol(incidentId, user, region, severity) {
    const protocol = this.institutionalProtocols[severity];
    const contacts = this.emergencyContacts[region];
    const notifiedContacts = [];

    for (const action of protocol.immediateActions) {
      try {
        switch (action) {
          case 'notify_campus_counsellor':
            await this.notifyCampusCounsellor(user, contacts, incidentId);
            notifiedContacts.push('campus_counsellor');
            break;
            
          case 'alert_security':
            await this.alertCampusSecurity(user, contacts, incidentId);
            notifiedContacts.push('campus_security');
            break;
            
          case 'inform_dean':
            await this.informDeanOfStudents(user, contacts, incidentId);
            notifiedContacts.push('dean_of_students');
            break;
            
          case 'contact_emergency_services':
            await this.contactEmergencyServices(user, contacts, incidentId);
            notifiedContacts.push('emergency_services');
            break;
            
          case 'schedule_urgent_appointment':
            await this.scheduleUrgentAppointment(user, incidentId);
            break;
        }
      } catch (error) {
        logger.error(`Failed to execute ${action}:`, error);
      }
    }

    // Update incident with notification status
    await updateDocument(COLLECTIONS.CRISIS_INCIDENTS, incidentId, {
      emergencyContactsNotified: notifiedContacts,
      protocolExecutedAt: new Date().toISOString()
    });
  }

  async notifyCampusCounsellor(user, contacts, incidentId) {
    const message = `URGENT: Crisis detected for student ${user.name} (ID: ${user.id}). 
    Immediate intervention required. Incident ID: ${incidentId}. 
    Please contact student immediately at ${user.phone || user.email}.`;

    // Send SMS (implement SMS service)
    await this.sendSMS(contacts.campusCounsellor, message);
    
    // Send email
    await this.sendEmail(
      process.env.CAMPUS_COUNSELLOR_EMAIL,
      'URGENT: Student Crisis Intervention Required',
      message
    );

    // Create notification in system
    await createDocument(COLLECTIONS.NOTIFICATIONS, {
      type: 'crisis_alert',
      title: 'URGENT: Student Crisis Detected',
      message: `Crisis intervention needed for student. Incident: ${incidentId}`,
      recipients: ['campus_counsellor'],
      priority: 'critical',
      read: false,
      incidentId
    });
  }

  async alertCampusSecurity(user, contacts, incidentId) {
    const message = `SECURITY ALERT: Student crisis detected. Student: ${user.name}. 
    Location assistance may be required. Incident: ${incidentId}. 
    Coordinate with counselling team.`;

    await this.sendSMS(contacts.campusSecurity, message);
    
    await createDocument(COLLECTIONS.NOTIFICATIONS, {
      type: 'security_alert',
      title: 'Student Crisis - Security Assistance',
      message,
      recipients: ['campus_security'],
      priority: 'high',
      read: false,
      incidentId
    });
  }

  async informDeanOfStudents(user, contacts, incidentId) {
    const emailContent = `
    Dear Dean of Students,
    
    This is an automated alert regarding a student crisis situation:
    
    Student: ${user.name}
    Student ID: ${user.id}
    Incident ID: ${incidentId}
    Time: ${new Date().toLocaleString()}
    
    Our AI system has detected concerning language indicating potential mental health crisis.
    Campus counsellor and security have been notified.
    
    This incident requires administrative awareness for potential follow-up actions.
    
    Best regards,
    Student Wellness System
    `;

    await this.sendEmail(
      process.env.DEAN_EMAIL,
      'Student Crisis Alert - Administrative Notification',
      emailContent
    );
  }

  async scheduleFollowUp(incidentId, user, severity) {
    const protocol = this.institutionalProtocols[severity];
    const followUpTime = this.calculateFollowUpTime(protocol.followUp);

    await createDocument(COLLECTIONS.FOLLOW_UPS, {
      incidentId,
      userId: user.id,
      type: protocol.followUp,
      scheduledAt: followUpTime,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString()
    });

    // Update incident
    await updateDocument(COLLECTIONS.CRISIS_INCIDENTS, incidentId, {
      followUpScheduled: true,
      followUpType: protocol.followUp,
      followUpScheduledAt: followUpTime
    });
  }

  calculateFollowUpTime(followUpType) {
    const now = new Date();
    switch (followUpType) {
      case 'mandatory_24h_checkin':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'checkin_within_48h':
        return new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
      case 'weekly_checkin':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  determineRegion(user) {
    // Determine region based on user's college/location
    const college = user.college?.toLowerCase() || '';
    const location = user.location?.toLowerCase() || '';
    
    if (college.includes('kashmir') || location.includes('srinagar') || location.includes('kashmir')) {
      return 'Kashmir Valley';
    } else if (college.includes('ladakh') || location.includes('leh') || location.includes('ladakh')) {
      return 'Ladakh';
    } else {
      return 'Jammu Region';
    }
  }

  assessCrisisSeverity(crisisData) {
    const confidence = crisisData.confidence;
    const keywords = crisisData.matchedKeywords || [];
    
    // High severity indicators
    const highSeverityKeywords = ['suicide', 'kill myself', 'end my life', 'want to die'];
    const hasHighSeverityKeywords = keywords.some(keyword => 
      highSeverityKeywords.some(severe => keyword.toLowerCase().includes(severe))
    );
    
    if (confidence >= 0.9 || hasHighSeverityKeywords) {
      return 'high';
    } else if (confidence >= 0.7) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  async getUserDetails(userId) {
    // Get user details from database
    const user = await getDocument(COLLECTIONS.USERS, userId);
    return user;
  }

  async sendSMS(phoneNumber, message) {
    // Implement SMS service (Twilio, AWS SNS, etc.)
    logger.info(`SMS sent to ${phoneNumber}: ${message.substring(0, 50)}...`);
    // TODO: Implement actual SMS service
  }

  async sendEmail(to, subject, content) {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        text: content
      });
      logger.info(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      logger.error('Email sending failed:', error);
    }
  }

  // Get crisis statistics for admin dashboard
  async getCrisisStatistics(timeframe = '30d') {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    const incidents = await queryDocuments(COLLECTIONS.CRISIS_INCIDENTS, [
      { field: 'createdAt', operator: '>=', value: startDate.toISOString() }
    ]);

    return {
      totalIncidents: incidents.length,
      byRegion: this.groupByRegion(incidents),
      bySeverity: this.groupBySeverity(incidents),
      responseTime: this.calculateAverageResponseTime(incidents),
      resolved: incidents.filter(i => i.status === 'resolved').length,
      active: incidents.filter(i => i.status === 'active').length
    };
  }

  groupByRegion(incidents) {
    return incidents.reduce((acc, incident) => {
      acc[incident.region] = (acc[incident.region] || 0) + 1;
      return acc;
    }, {});
  }

  groupBySeverity(incidents) {
    return incidents.reduce((acc, incident) => {
      acc[incident.severity] = (acc[incident.severity] || 0) + 1;
      return acc;
    }, {});
  }

  calculateAverageResponseTime(incidents) {
    const responseTimes = incidents
      .filter(i => i.protocolExecutedAt)
      .map(i => new Date(i.protocolExecutedAt) - new Date(i.createdAt));
    
    if (responseTimes.length === 0) return 0;
    
    const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return Math.round(average / 1000 / 60); // Convert to minutes
  }
}

module.exports = { InstitutionalCrisisManager };