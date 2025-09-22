import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../config/firebase.js'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth'
import fallbackAuth from '../utils/fallbackAuth.js'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userExists, setUserExists] = useState(false)
  const [userApproved, setUserApproved] = useState(false)
  const [isFallbackMode, setIsFallbackMode] = useState(false)

  useEffect(() => {
    // Clear any problematic cached data on app start
    const initializeAuth = async () => {
      console.log('🔄 Initializing authentication...')
      
      // Clear fallback auth if it exists (prevents auto-admin login)
      if (fallbackAuth.isFallbackMode()) {
        console.log('🧹 Clearing fallback authentication...')
        fallbackAuth.logout()
      }
      
      // Clear any cached user roles that might be stale
      const keys = Object.keys(sessionStorage)
      keys.forEach(key => {
        if (key.startsWith('userRole_')) {
          sessionStorage.removeItem(key)
          console.log('🗑️ Cleared cached role:', key)
        }
      })
      
      console.log('✅ Auth initialization complete')
    }
    
    initializeAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        // Validate user exists in database and get their status
        const userValidation = await validateUserInDatabase(user.uid, user.email)
        
        if (!userValidation.exists) {
          console.error('❌ User not found in database:', user.email)
          setUserExists(false)
          setUserApproved(false)
          setUserRole(null)
          setLoading(false)
          // Sign out user who doesn't exist in database
          await signOut(auth)
          return
        }
        
        if (userValidation.blocked) {
          console.error('❌ User account is blocked:', user.email)
          setUserExists(true)
          setUserApproved(false)
          setUserRole(null)
          setLoading(false)
          // Sign out blocked user
          await signOut(auth)
          return
        }
        
        if (!userValidation.approved) {
          console.warn('⚠️ User account pending approval:', user.email, 'Role:', userValidation.role)
          setUserExists(true)
          setUserApproved(false)
          setUserRole(userValidation.role)
          setLoading(false)
          
          // Sign out unapproved users to prevent any access
          await signOut(auth)
          return
        }
        
        // User exists, is approved, and not blocked
        setUserExists(true)
        setUserApproved(true)
        setUserRole(userValidation.role)
        setLoading(false)
        
        // Cache the role for faster subsequent loads
        sessionStorage.setItem(`userRole_${user.uid}`, userValidation.role)
        console.log('✅ User validated and authenticated:', user.email, 'Role:', userValidation.role)
      } else {
        setUserExists(false)
        setUserApproved(false)
        setUserRole(null)
        setIsFallbackMode(false)
        setLoading(false)
        // Clear cached role when user logs out
        const keys = Object.keys(sessionStorage)
        keys.forEach(key => {
          if (key.startsWith('userRole_')) {
            sessionStorage.removeItem(key)
          }
        })
        // Clear fallback mode
        fallbackAuth.logout()
      }
    })

    return unsubscribe
  }, [])

  // Function to validate if user exists in database and check their status
  const validateUserInDatabase = async (uid, email) => {
    try {
      const { db } = await import('../config/firebase.js')
      const { doc, getDoc } = await import('firebase/firestore')
      
      // First check users collection (for students and admins)
      const userDoc = await getDoc(doc(db, 'users', uid))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        console.log('User data from users collection:', userData)
        
        return {
          exists: true,
          approved: userData.approved || false,
          blocked: userData.blocked || false,
          role: userData.role || 'student'
        }
      }
      
      // Then check counsellors collection
      const counsellorDoc = await getDoc(doc(db, 'counsellors', uid))
      
      if (counsellorDoc.exists()) {
        const counsellorData = counsellorDoc.data()
        console.log('User data from counsellors collection:', counsellorData)
        
        return {
          exists: true,
          approved: counsellorData.approved || false,
          blocked: counsellorData.blocked || false,
          role: counsellorData.role || 'counsellor'
        }
      }
      
      // Check college_heads collection
      const collegeHeadDoc = await getDoc(doc(db, 'college_heads', uid))
      
      if (collegeHeadDoc.exists()) {
        const collegeHeadData = collegeHeadDoc.data()
        console.log('User data from college_heads collection:', collegeHeadData)
        
        return {
          exists: true,
          approved: collegeHeadData.approved || false,
          blocked: collegeHeadData.blocked || false,
          role: collegeHeadData.role || 'college_head'
        }
      }
      
      // Special handling for admin setup scenario
      if (email === 'admin@zencare.app' && uid === '56D6MtYaU8cticqSviIVJ4fmWnh2') {
        console.log('🔧 Admin user detected during setup, triggering admin setup...')
        
        // Try to setup admin user automatically
        const { setupAdminUser } = await import('../utils/adminSetup.js')
        const adminData = await setupAdminUser()
        
        if (adminData) {
          console.log('✅ Admin setup completed successfully')
          return {
            exists: true,
            approved: true,
            blocked: false,
            role: 'admin'
          }
        }
      }
      
      console.warn('User document not found in any collection for UID:', uid)
      return { exists: false, approved: false, blocked: false, role: null }
      
    } catch (error) {
      console.error('Error validating user in database:', error)
      return { exists: false, approved: false, blocked: false, role: null }
    }
  }

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login with email:', email)
      
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ Firebase authentication successful! User UID:', result.user.uid)
      
      // Validate user exists in database and check their status
      const userValidation = await validateUserInDatabase(result.user.uid, email)
      
      if (!userValidation.exists) {
        console.error('❌ User not found in database:', email)
        await signOut(auth) // Sign out user who doesn't exist in database
        throw new Error('Access denied: User account not found in system database. Please contact administrator.')
      }
      
      if (userValidation.blocked) {
        console.error('❌ User account is blocked:', email)
        await signOut(auth) // Sign out blocked user
        throw new Error('Access denied: Your account has been blocked. Please contact administrator.')
      }
      
      if (!userValidation.approved) {
        console.warn('⚠️ User account pending approval:', email, 'Role:', userValidation.role)
        await signOut(auth) // Sign out unapproved user to prevent access
        
        // Provide role-specific messages
        if (userValidation.role === 'counsellor') {
          throw new Error('Your counsellor account is not approved by the admin yet. Please wait for approval before you can access the system.')
        } else if (userValidation.role === 'admin') {
          throw new Error('Your admin account is pending approval. Please contact the system administrator.')
        } else {
          throw new Error('Your account is pending approval. Please wait for administrator approval before you can access the system.')
        }
      }
      
      // Cache the role immediately for approved users
      sessionStorage.setItem(`userRole_${result.user.uid}`, userValidation.role)
      console.log('✅ User validated and role cached:', userValidation.role)
      
      return result.user
    } catch (error) {
      console.error('❌ Login failed with error:', error)
      
      // Check if this is a network connectivity issue
      if (error.code === 'auth/network-request-failed' || 
          error.message.includes('network') || 
          error.message.includes('timeout') || 
          error.message.includes('QUIC_PROTOCOL_ERROR')) {
        
        console.log('🔧 Network issue detected, attempting fallback authentication...')
        
        try {
          const fallbackResult = await fallbackAuth.login(email, password)
          console.log('✅ Fallback authentication successful!')
          
          setUser(fallbackResult)
          setUserRole(fallbackAuth.getUserRole())
          setUserExists(true)
          setUserApproved(true)
          setIsFallbackMode(true)
          
          return fallbackResult
        } catch (fallbackError) {
          console.error('❌ Fallback authentication also failed:', fallbackError)
          throw new Error('Network connection failed and offline authentication failed. Please check your credentials or try again when you have internet access.')
        }
      }
      
      // Re-throw our custom validation errors
      if (error.message.includes('Access denied') || error.message.includes('Account pending')) {
        throw error
      }
      
      // Handle Firebase auth errors
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network connection failed. Please check your internet connection and try again. If the problem persists, there may be a firewall blocking Firebase services.')
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials and try again.')
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.')
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.')
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact administrator.')
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please wait a few minutes and try again.')
      } else {
        console.error('Full Firebase error:', error)
        throw new Error(`Login failed: ${error.message || 'Please check your credentials and try again.'}`)
      }
    }
  }

  const register = async (email, password, userData) => {
    try {
      console.log('📝 Creating new user account:', email)
      
      const result = await createUserWithEmailAndPassword(auth, email, password)
      console.log('✅ Firebase user created successfully! UID:', result.user.uid)
      
      // Create user document in Firestore with additional data
      console.log('📄 Creating user document in Firestore...')
      await createUserDocument(result.user.uid, userData)
      console.log('✅ User document created successfully')
      
      // Determine if user needs approval based on role
      const requiresApproval = userData.role !== 'student'
      
      if (requiresApproval) {
        // Sign out users who need approval (counsellors, admins)
        await signOut(auth)
        console.log('ℹ️ User signed out - account pending approval')
        
        return {
          success: true,
          message: 'Account created successfully! Please wait for administrator approval before you can log in.',
          requiresApproval: true
        }
      } else {
        // Students are auto-approved and can proceed
        console.log('✅ Student account auto-approved')
        return result.user
      }
      
    } catch (error) {
      console.error('❌ Registration failed:', error)
      
      // Handle Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists.')
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please choose a stronger password.')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.')
      } else {
        throw new Error('Registration failed. Please try again.')
      }
    }
  }

  const createUserDocument = async (uid, userData) => {
    try {
      const { db } = await import('../config/firebase.js')
      const { doc, setDoc, addDoc, collection } = await import('firebase/firestore')
      
      if (userData.role === 'student') {
        // Create student document in users collection
        const studentDoc = {
          uid,
          email: userData.email,
          name: userData.name,
          role: 'student',
          age: userData.age || null,
          university: userData.university || null,
          major: userData.major || null,
          year: userData.year || null,
          phone: userData.phone || null,
          gender: userData.gender || null,
          preferredLanguage: userData.preferredLanguage || 'en',
          approved: true, // Students auto-approved
          blocked: false,
          isActive: true,
          profileCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        await setDoc(doc(db, 'users', uid), studentDoc)
        
      } else if (userData.role === 'counsellor') {
        // Create counsellor document in counsellors collection
        const counsellorDoc = {
          uid,
          email: userData.email,
          name: userData.name,
          role: 'counsellor',
          specialization: userData.specialization || null,
          qualifications: userData.qualifications || [],
          experience: userData.experience || null,
          languages: userData.languages || ['English'],
          college: userData.college || null,
          phone: userData.phone || null,
          approved: false, // Counsellors need approval
          blocked: false,
          isActive: true,
          profileCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          availability: userData.availability || {},
          bio: userData.bio || null,
          licenseNumber: userData.licenseNumber || null,
          totalSessions: 0,
          rating: 0
        }
        
        await setDoc(doc(db, 'counsellors', uid), counsellorDoc)
        
      } else if (userData.role === 'college_head') {
        // Create college head document in college_heads collection
        const collegeHeadDoc = {
          uid,
          email: userData.email,
          name: userData.name,
          role: 'college_head',
          college: userData.college || null,
          phone: userData.phone || null,
          designation: userData.designation || null,
          department: userData.department || null,
          idProofUrl: userData.idProofUrl || null,
          idProofType: userData.idProofType || null,
          approved: false, // College heads need admin approval
          blocked: false,
          isActive: true,
          profileCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          totalCounsellors: 0,
          totalStudents: 0
        }
        
        await setDoc(doc(db, 'college_heads', uid), collegeHeadDoc)
        
      } else if (userData.role === 'admin') {
        // Keep admin in users collection
        const adminDoc = {
          uid,
          email: userData.email,
          name: userData.name,
          role: 'admin',
          approved: true,
          blocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: ['all']
        }
        
        await setDoc(doc(db, 'users', uid), adminDoc)
      }

    } catch (error) {
      console.error('Error creating user document:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      if (isFallbackMode) {
        // Handle fallback mode logout
        fallbackAuth.logout()
        setUser(null)
        setUserRole(null)
        setUserExists(false)
        setUserApproved(false)
        setIsFallbackMode(false)
        console.log('📴 Logged out from fallback mode')
      } else {
        // Handle Firebase logout
        await signOut(auth)
        setUserRole(null)
      }
      
      // Clear all cached roles
      const keys = Object.keys(sessionStorage)
      keys.forEach(key => {
        if (key.startsWith('userRole_')) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (error) {
      throw error
    }
  }

  const getUserRole = async (userId) => {
    try {
      // First check cache for faster response
      const cachedRole = sessionStorage.getItem(`userRole_${userId}`)
      if (cachedRole) {
        console.log('📦 Using cached role for user:', userId, '→', cachedRole)
        return cachedRole
      }

      console.log('🔍 Fetching role from database for user:', userId)
      
      // If not cached, fetch from Firestore
      const { db } = await import('../config/firebase.js')
      const { doc, getDoc } = await import('firebase/firestore')
      
      // First check users collection (for students and admins)
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const role = userData.role
        
        // Check if user is blocked
        if (userData.blocked) {
          throw new Error('Access denied: Your account has been blocked. Please contact administrator.')
        }
        
        // Cache and return role
        sessionStorage.setItem(`userRole_${userId}`, role)
        return { role, ...userData }
      }
      
      // Then check counsellors collection
      const counsellorDoc = await getDoc(doc(db, 'counsellors', userId))
      if (counsellorDoc.exists()) {
        const counsellorData = counsellorDoc.data()
        const role = 'counsellor'
        
        // Check if user is blocked
        if (counsellorData.blocked) {
          throw new Error('Access denied: Your account has been blocked. Please contact administrator.')
        }
        
        // Check if counsellor is approved
        if (!counsellorData.approved) {
          throw new Error('Your counsellor account is not approved by the admin yet. Please wait for approval before you can access the system.')
        }
        
        // Cache and return role
        sessionStorage.setItem(`userRole_${userId}`, role)
        return { role, ...counsellorData }
      }
      
      // Special handling for admin user during setup
      if (userId === '56D6MtYaU8cticqSviIVJ4fmWnh2') {
        console.log('🔧 Admin user detected, attempting setup...')
        
        // Try to setup admin user automatically
        const { setupAdminUser } = await import('../utils/adminSetup.js')
        const adminData = await setupAdminUser()
        
        if (adminData) {
          console.log('✅ Admin setup completed, returning admin role')
          sessionStorage.setItem(`userRole_${userId}`, 'admin')
          return { role: 'admin', ...adminData }
        }
      }
      
      console.warn('⚠️ User document not found in any collection for:', userId)
      throw new Error('User account not found in system database.')
      
    } catch (error) {
      console.error('❌ Error fetching user role:', error)
      
      // Re-throw approval/access errors
      if (error.message.includes('approved') || error.message.includes('blocked') || error.message.includes('Access denied')) {
        throw error
      }
      
      // For other errors, return a generic error
      throw new Error('Unable to verify account access. Please try logging in again.')
    }
  }

  const clearRoleCache = (userId) => {
    if (userId) {
      sessionStorage.removeItem(`userRole_${userId}`)
      console.log('🗑️ Cleared cached role for user:', userId)
    }
  }

  const value = {
    user,
    userRole,
    userExists,
    userApproved,
    isFallbackMode,
    login,
    register,
    logout,
    clearRoleCache,
    getUserRole,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}