#!/usr/bin/env node
/**
 * Firebase Seeding Script for ZenCare
 * Creates initial users, sample data, and sets up Firestore collections
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './firebase-service-account.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account key not found!');
  console.log('Please download your Firebase service account key and save it as:');
  console.log('- firebase-service-account.json (in project root)');
  console.log('- Or set FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
  process.exit(1);
}

const serviceAccount = require(path.resolve(serviceAccountPath));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const auth = admin.auth();
const db = admin.firestore();

// Sample users to create
const sampleUsers = [
  {
    email: 'admin@zencare.app',
    password: 'ZenCare2024!',
    role: 'admin',
    displayName: 'ZenCare Administrator',
    customClaims: {
      role: 'admin',
      approved: true,
      blocked: false
    },
    profile: {
      name: 'ZenCare Administrator',
      role: 'admin',
      approved: true,
      blocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    email: 'counsellor@zencare.app',
    password: 'ZenCare2024!',
    role: 'counsellor',
    displayName: 'Dr. Sarah Johnson',
    customClaims: {
      role: 'counsellor',
      approved: true,
      blocked: false
    },
    profile: {
      name: 'Dr. Sarah Johnson',
      role: 'counsellor',
      specialization: 'Clinical Psychology',
      qualifications: ['PhD in Clinical Psychology', 'Licensed Therapist'],
      experience: '8 years',
      languages: ['English', 'Spanish'],
      approved: true,
      blocked: false,
      availability: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '15:00' }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    email: 'student@zencare.app',
    password: 'ZenCare2024!',
    role: 'student',
    displayName: 'Alex Student',
    customClaims: {
      role: 'student',
      approved: true,
      blocked: false
    },
    profile: {
      name: 'Alex Student',
      role: 'student',
      age: 20,
      university: 'Sample University',
      major: 'Computer Science',
      year: 'Sophomore',
      preferredLanguage: 'en',
      approved: true,
      blocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
];

// Sample resources
const sampleResources = [
  {
    title: 'Understanding Depression',
    type: 'article',
    language: 'en',
    category: 'depression',
    content: 'Depression is a common mental health condition...',
    url: 'https://example.com/depression-article',
    tags: ['depression', 'mental health', 'awareness'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Anxiety Management Techniques',
    type: 'video',
    language: 'en',
    category: 'anxiety',
    content: 'Learn effective techniques to manage anxiety...',
    url: 'https://example.com/anxiety-video',
    duration: '15:30',
    tags: ['anxiety', 'coping', 'techniques'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Mindfulness Meditation',
    type: 'audio',
    language: 'en',
    category: 'mindfulness',
    content: 'Guided mindfulness meditation for beginners...',
    url: 'https://example.com/mindfulness-audio',
    duration: '10:00',
    tags: ['mindfulness', 'meditation', 'relaxation'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function createUser(userData) {
  try {
    console.log(`Creating user: ${userData.email}`);
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      emailVerified: true
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, userData.customClaims);

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      ...userData.profile,
      uid: userRecord.uid,
      email: userData.email
    });

    // For counsellors, create additional profile data
    if (userData.role === 'counsellor') {
      await db.collection('counsellor_profiles').doc(userRecord.uid).set({
        uid: userRecord.uid,
        specialization: userData.profile.specialization || '',
        qualifications: userData.profile.qualifications || [],
        experience: userData.profile.experience || '',
        languages: userData.profile.languages || ['English'],
        availability: userData.profile.availability || {},
        approved: userData.profile.approved || false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    return userRecord;

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  User already exists: ${userData.email}`);
      
      // Update existing user's custom claims and profile
      const existingUser = await auth.getUserByEmail(userData.email);
      await auth.setCustomUserClaims(existingUser.uid, userData.customClaims);
      await db.collection('users').doc(existingUser.uid).set({
        ...userData.profile,
        uid: existingUser.uid,
        email: userData.email,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log(`✅ Updated user: ${userData.email}`);
      return existingUser;
    } else {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
      throw error;
    }
  }
}

async function createResources() {
  console.log('Creating sample resources...');
  
  for (const resource of sampleResources) {
    try {
      await db.collection('resources').add(resource);
      console.log(`✅ Created resource: ${resource.title}`);
    } catch (error) {
      console.error(`❌ Error creating resource ${resource.title}:`, error.message);
    }
  }
}

async function setupFirestoreRules() {
  console.log('Setting up Firestore security rules...');
  
  // Note: Firestore rules need to be deployed separately using Firebase CLI
  // This is just a reminder of what rules should be set
  
  const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        (request.auth.token.role == 'admin' || request.auth.token.role == 'counsellor');
    }
    
    // Resources are readable by authenticated users
    match /resources/{resourceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Sessions
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        (resource.data.studentId == request.auth.uid || 
         resource.data.counsellorId == request.auth.uid ||
         request.auth.token.role == 'admin');
    }
    
    // Messages within sessions
    match /sessions/{sessionId}/messages/{messageId} {
      allow read, write: if request.auth != null && 
        (get(/databases/$(database)/documents/sessions/$(sessionId)).data.studentId == request.auth.uid ||
         get(/databases/$(database)/documents/sessions/$(sessionId)).data.counsellorId == request.auth.uid ||
         request.auth.token.role == 'admin');
    }
    
    // Reports
    match /reports/{reportId} {
      allow read: if request.auth != null && 
        (resource.data.reporterId == request.auth.uid || request.auth.token.role == 'admin');
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Assessments
    match /assessments/{assessmentId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Bookings
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && 
        (resource.data.studentId == request.auth.uid || 
         resource.data.counsellorId == request.auth.uid ||
         request.auth.token.role == 'admin');
    }
  }
}`;

  console.log('📋 Firestore Security Rules:');
  console.log('Save the following rules to firestore.rules and deploy with: firebase deploy --only firestore:rules');
  console.log('─'.repeat(80));
  console.log(rules);
  console.log('─'.repeat(80));
}

async function main() {
  try {
    console.log('🚀 Starting ZenCare Firebase seeding...');
    console.log('Project ID:', serviceAccount.project_id);
    console.log('');

    // Create users
    console.log('👥 Creating users...');
    for (const userData of sampleUsers) {
      await createUser(userData);
    }
    console.log('');

    // Create resources
    await createResources();
    console.log('');

    // Setup Firestore rules reminder
    setupFirestoreRules();
    console.log('');

    console.log('✅ Firebase seeding completed successfully!');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('Admin: admin@zencare.app / ZenCare2024!');
    console.log('Counsellor: counsellor@zencare.app / ZenCare2024!');
    console.log('Student: student@zencare.app / ZenCare2024!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Deploy Firestore rules: firebase deploy --only firestore:rules');
    console.log('2. Update your .env files with the correct Firebase config');
    console.log('3. Start your applications and test the login');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seeding script
if (require.main === module) {
  main();
}

module.exports = { createUser, createResources };