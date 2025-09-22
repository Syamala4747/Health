import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setError(null);
      
      if (user) {
        // Set loading to false immediately for faster navigation
        setLoading(false);
        
        // Fetch role asynchronously
        const fetchRole = async () => {
          try {
            // Get user role from custom claims first, then from Firestore
            const idTokenResult = await user.getIdTokenResult();
            let role = idTokenResult.claims.role;
            
            if (!role) {
              // If no custom claims, get from Firestore
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                role = userData.role;
              }
            }
            
            if (role) {
              console.log('Setting user role:', role, 'for user:', user.email);
              setUserRole(role);
            } else {
              console.log('No role found for user:', user.email);
              setUserRole(null);
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
            setError(error.message);
          }
        };
        
        fetchRole();
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, userData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user data to Firestore
      if (userData) {
        await setDoc(doc(db, 'users', result.user.uid), {
          ...userData,
          email,
          createdAt: new Date(),
          uid: result.user.uid
        });
      }
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateUserRole = (role) => {
    setUserRole(role);
  };

  const value = {
    user,
    userRole,
    loading,
    error,
    login,
    register,
    logout,
    setUserRole: updateUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};