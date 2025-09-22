import { auth, db } from '../config/firebase.js'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

let adminSetupInProgress = false
let adminSetupCompleted = false

export const setupAdminUser = async () => {
  if (adminSetupInProgress) {
    console.log('Admin setup already in progress, skipping...')
    return null
  }
  
  if (adminSetupCompleted) {
    console.log('Admin setup already completed, skipping...')
    return null
  }

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@zencare.app'
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'ZenCare2024!'
  
  try {
    adminSetupInProgress = true
    console.log('Setting up admin user:', adminEmail)
    
    let adminUser = null
    let adminUID = null
    
    try {
      // Try to create the admin user in Firebase Auth
      console.log('Creating admin user in Firebase Auth...')
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
      adminUser = userCredential.user
      adminUID = adminUser.uid
      console.log('Admin user created in Firebase Auth with UID:', adminUID)
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        console.log('Admin user already exists in Firebase Auth, trying to sign in...')
        try {
          const signInResult = await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
          adminUser = signInResult.user
          adminUID = adminUser.uid
          console.log('Successfully signed in existing admin user with UID:', adminUID)
        } catch (signInError) {
          console.error('Failed to sign in existing admin user:', signInError)
          throw signInError
        }
      } else {
        console.error('Failed to create admin user:', authError)
        throw authError
      }
    }
    
    // Check if admin document exists in Firestore
    const adminDocRef = doc(db, 'users', adminUID)
    const adminDoc = await getDoc(adminDocRef)
    
    if (adminDoc.exists()) {
      console.log('Admin user document already exists in Firestore')
      adminSetupInProgress = false
      adminSetupCompleted = true
      return adminDoc.data()
    }
    
    // Create admin document in Firestore
    const adminData = {
      uid: adminUID,
      email: adminEmail,
      name: 'ZenCare Administrator',
      role: 'admin',
      approved: true,
      blocked: false,
      isActive: true,
      profileCompleted: true,
      permissions: ['all'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await setDoc(doc(db, 'users', adminUID), adminData)
    console.log('Admin user document created in Firestore')
    
    adminSetupInProgress = false
    adminSetupCompleted = true
    return adminData
    
  } catch (error) {
    console.error('Error setting up admin user:', error)
    adminSetupInProgress = false
    throw error
  }
}

export const createCounsellorUser = async (email, password, userData) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    
    const counsellorData = {
      uid: result.user.uid,
      email: email,
      name: userData.name,
      role: 'counsellor',
      approved: false, // Counsellors need approval
      blocked: false,
      specialization: userData.specialization,
      experience: userData.experience,
      qualifications: userData.qualifications || [],
      languages: userData.languages || ['English'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await setDoc(doc(db, 'users', result.user.uid), counsellorData)
    
    // Also create counsellor profile
    await setDoc(doc(db, 'counsellor_profiles', result.user.uid), {
      uid: result.user.uid,
      specialization: userData.specialization || '',
      qualifications: userData.qualifications || [],
      experience: userData.experience || '',
      languages: userData.languages || ['English'],
      availability: userData.availability || {},
      approved: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return result.user
  } catch (error) {
    console.error('Error creating counsellor user:', error)
    throw error
  }
}