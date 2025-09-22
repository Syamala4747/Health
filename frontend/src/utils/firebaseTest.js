import { auth, db } from '../config/firebase.js'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore'

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...')
    console.log('Auth instance:', auth)
    console.log('Firestore instance:', db)
    console.log('Project ID:', auth.app.options.projectId)
    console.log('Auth Domain:', auth.app.options.authDomain)
    
    // Test Firebase config
    const config = auth.app.options
    console.log('Full Firebase Config:', {
      apiKey: config.apiKey ? '✅ Present' : '❌ Missing',
      authDomain: config.authDomain ? '✅ Present' : '❌ Missing',
      projectId: config.projectId ? '✅ Present' : '❌ Missing',
      storageBucket: config.storageBucket ? '✅ Present' : '❌ Missing',
      messagingSenderId: config.messagingSenderId ? '✅ Present' : '❌ Missing',
      appId: config.appId ? '✅ Present' : '❌ Missing'
    })
    
    // Test database connection
    console.log('Testing Firestore connection...')
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    console.log(`Found ${snapshot.size} users in database`)
    
    snapshot.forEach((doc) => {
      console.log('User:', doc.id, doc.data())
    })
    
    // If no users found, create sample data
    if (snapshot.size === 0) {
      console.log('No users found. Creating sample data...')
      await createSampleData()
    }
    
    return true
  } catch (error) {
    console.error('Firebase connection test failed:', error)
    return false
  }
}

export const testAuthConfig = () => {
  console.log('Firebase Auth Config:')
  console.log('- API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('- Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing')
  console.log('- Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing')
  console.log('- App ID:', import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing')
  
  // Show actual values (first few characters for security)
  console.log('Actual values:')
  console.log('- API Key starts with:', import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...')
  console.log('- Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID)
  console.log('- Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
}

export const createAdminUser = async () => {
  try {
    console.log('Creating admin user...')
    
    const adminEmail = 'syamala4747@gmail.com'
    const adminPassword = '0987654321'
    
    // Create admin user
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
    console.log('✅ Admin user created:', userCredential.user.uid)
    
    // Create admin document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: adminEmail,
      role: 'admin',
      name: 'System Administrator',
      createdAt: new Date(),
      isApproved: true,
      permissions: ['all']
    })
    
    console.log('✅ Admin user document created in Firestore')
    return { success: true, uid: userCredential.user.uid }
    
  } catch (error) {
    console.error('❌ Admin user creation failed:', error)
    if (error.code === 'auth/email-already-in-use') {
      console.log('📧 Admin user already exists')
      return { success: true, message: 'Admin user already exists' }
    }
    return { error: error.message, code: error.code }
  }
}

export const testAdminSignIn = async () => {
  try {
    console.log('🔐 Testing admin sign-in...')
    
    const adminEmail = 'syamala4747@gmail.com'
    const adminPassword = '0987654321'
    
    console.log('Attempting sign-in with:', adminEmail)
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
    console.log('✅ Admin sign-in successful!')
    console.log('User UID:', userCredential.user.uid)
    console.log('User email:', userCredential.user.email)
    console.log('Email verified:', userCredential.user.emailVerified)
    
    // Sign out immediately
    await auth.signOut()
    console.log('👋 Signed out for testing purposes')
    
    return { success: true, uid: userCredential.user.uid }
    
  } catch (error) {
    console.error('❌ Admin sign-in failed:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    
    // Provide specific guidance
    if (error.code === 'auth/wrong-password') {
      console.log('💡 The password might be incorrect')
    } else if (error.code === 'auth/user-not-found') {
      console.log('💡 The user might not exist')
    } else if (error.code === 'auth/too-many-requests') {
      console.log('💡 Too many failed attempts, wait a moment and try again')
    } else if (error.code === 'auth/network-request-failed') {
      console.log('💡 Network issue, check your connection')
    }
    
    return { success: false, error: error.message, code: error.code }
  }
}

export const createSampleData = async () => {
  try {
    const usersRef = collection(db, 'users')
    
    // Create sample admin
    await addDoc(usersRef, {
      name: 'Admin User',
      email: 'admin@zencare.app',
      role: 'admin',
      approved: true,
      blocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // Create sample counsellor (pending approval)
    await addDoc(usersRef, {
      name: 'Dr. Sarah Johnson',
      email: 'counsellor@zencare.app',
      role: 'counsellor',
      specialization: 'Clinical Psychology',
      qualifications: ['PhD in Clinical Psychology', 'Licensed Therapist'],
      experience: '8 years',
      languages: ['English', 'Hindi'],
      college: 'Indian Institute of Technology (IIT) Delhi',
      approved: false, // Pending approval
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
    })
    
    // Create sample approved counsellor
    await addDoc(usersRef, {
      name: 'Dr. Rajesh Kumar',
      email: 'counsellor2@zencare.app',
      role: 'counsellor',
      specialization: 'Anxiety and Depression',
      qualifications: ['Masters in Psychology', 'Certified Counsellor'],
      experience: '5 years',
      languages: ['English', 'Hindi', 'Tamil'],
      college: 'Anna University',
      approved: true,
      blocked: false,
      availability: {
        monday: { start: '10:00', end: '18:00' },
        tuesday: { start: '10:00', end: '18:00' },
        wednesday: { start: '10:00', end: '18:00' },
        thursday: { start: '10:00', end: '18:00' },
        friday: { start: '10:00', end: '16:00' }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // Create sample students
    await addDoc(usersRef, {
      name: 'Alex Student',
      email: 'student@zencare.app',
      role: 'student',
      age: 20,
      university: 'Indian Institute of Technology (IIT) Bombay',
      major: 'Computer Science',
      year: 'Sophomore',
      preferredLanguage: 'en',
      approved: true,
      blocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    await addDoc(usersRef, {
      name: 'Priya Sharma',
      email: 'student2@zencare.app',
      role: 'student',
      age: 19,
      university: 'Delhi Technological University',
      major: 'Electronics and Communication',
      year: 'Freshman',
      preferredLanguage: 'hi',
      approved: true,
      blocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    console.log('Sample data created successfully!')
    
  } catch (error) {
    console.error('Error creating sample data:', error)
  }
}