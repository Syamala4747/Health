const admin = require('firebase-admin');
const { logger } = require('../utils/logger');

let db = null;
let auth = null;

const initializeFirebase = () => {
  try {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      // In production, use service account key
      // In development, use environment variables or emulator
      if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
      } else {
        // Use default credentials or emulator
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
      }
    }

    db = admin.firestore();
    auth = admin.auth();

    // Configure Firestore settings
    if (process.env.NODE_ENV === 'development') {
      // Use emulator in development
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        logger.info('🔥 Using Firestore Emulator');
      }
    }

    logger.info('✅ Firebase initialized successfully');
    return { db, auth };
  } catch (error) {
    logger.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};

const getFirestore = () => {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return db;
};

const getAuth = () => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebase() first.');
  }
  return auth;
};

// Firestore collections
const COLLECTIONS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  BOOKINGS: 'bookings',
  REPORTS: 'reports',
  RESOURCES: 'resources',
  AUDIT_LOGS: 'auditLogs',
  NOTIFICATIONS: 'notifications'
};

// Helper functions for common Firestore operations
const createDocument = async (collection, data, docId = null) => {
  try {
    const db = getFirestore();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const docData = { ...data, createdAt: timestamp, updatedAt: timestamp };
    
    if (docId) {
      await db.collection(collection).doc(docId).set(docData);
      return docId;
    } else {
      const docRef = await db.collection(collection).add(docData);
      return docRef.id;
    }
  } catch (error) {
    logger.error(`Error creating document in ${collection}:`, error);
    throw error;
  }
};

const updateDocument = async (collection, docId, data) => {
  try {
    const db = getFirestore();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const updateData = { ...data, updatedAt: timestamp };
    
    await db.collection(collection).doc(docId).update(updateData);
    return docId;
  } catch (error) {
    logger.error(`Error updating document ${docId} in ${collection}:`, error);
    throw error;
  }
};

const getDocument = async (collection, docId) => {
  try {
    const db = getFirestore();
    const doc = await db.collection(collection).doc(docId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logger.error(`Error getting document ${docId} from ${collection}:`, error);
    throw error;
  }
};

const queryDocuments = async (collection, filters = [], orderBy = null, limit = null) => {
  try {
    const db = getFirestore();
    let query = db.collection(collection);
    
    // Apply filters
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });
    
    // Apply ordering
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logger.error(`Error querying documents from ${collection}:`, error);
    throw error;
  }
};

const deleteDocument = async (collection, docId) => {
  try {
    const db = getFirestore();
    await db.collection(collection).doc(docId).delete();
    return true;
  } catch (error) {
    logger.error(`Error deleting document ${docId} from ${collection}:`, error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  get db() { return getFirestore(); },
  get auth() { return getAuth(); },
  COLLECTIONS,
  createDocument,
  updateDocument,
  getDocument,
  queryDocuments,
  deleteDocument,
  admin
};