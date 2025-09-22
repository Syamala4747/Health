import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Get user role from custom claims or Firestore
          const idTokenResult = await user.getIdTokenResult();
          const role = idTokenResult.claims.role || 'student';
          const blocked = idTokenResult.claims.blocked || false;
          
          setUserRole(role);
          setIsBlocked(blocked);
          
          // Store user data locally
          await AsyncStorage.setItem('userRole', role);
          await AsyncStorage.setItem('userId', user.uid);
        } catch (error) {
          console.error('Error getting user role:', error);
          setUserRole('student'); // fallback
        }
      } else {
        setUserRole(null);
        setIsBlocked(false);
        await AsyncStorage.multiRemove(['userRole', 'userId']);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, userData) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore with additional data
      await createUserDocument(result.user.uid, userData);
      
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const createUserDocument = async (uid, userData) => {
    try {
      const { db } = require('../config/firebase');
      const { doc, setDoc } = require('firebase/firestore');
      
      const userDoc = {
        uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        approved: userData.role === 'student' ? true : false, // Students auto-approved, counsellors need approval
        blocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...userData
      };

      // Create user document
      await setDoc(doc(db, 'users', uid), userDoc);
      
      // For counsellors, create additional profile data
      if (userData.role === 'counsellor') {
        await setDoc(doc(db, 'counsellor_profiles', uid), {
          uid,
          specialization: userData.specialization || '',
          qualifications: userData.qualifications || [],
          experience: userData.experience || '',
          languages: userData.languages || ['English'],
          availability: userData.availability || {},
          approved: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.multiRemove(['userRole', 'userId']);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    isBlocked,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};