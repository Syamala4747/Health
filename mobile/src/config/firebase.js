import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || 'demo-api-key',
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || 'demo-project.firebaseapp.com',
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || 'demo-project',
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || 'demo-project.appspot.com',
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || '123456789012',
  appId: Constants.expoConfig?.extra?.firebaseAppId || '1:123456789012:web:abcdef123456'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;