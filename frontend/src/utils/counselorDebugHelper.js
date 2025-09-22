import { db } from '../config/firebase.js'
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'

/**
 * Debug helper to check counselor status and fix approval issues
 */
export const debugCounselorLogin = async (email) => {
  try {
    console.log('🔍 Debugging counselor login for:', email)
    
    // First, let's find the counselor by email
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    
    const counsellorsQuery = query(collection(db, 'counsellors'), where('email', '==', email))
    const counsellorsSnapshot = await getDocs(counsellorsQuery)
    
    if (counsellorsSnapshot.empty) {
      console.log('❌ No counselor found with email:', email)
      return { found: false, message: 'Counselor not found in database' }
    }
    
    const counsellorDoc = counsellorsSnapshot.docs[0]
    const counsellorData = counsellorDoc.data()
    
    console.log('✅ Found counselor:', counsellorData)
    console.log('- UID:', counsellorDoc.id)
    console.log('- Approved:', counsellorData.approved)
    console.log('- Blocked:', counsellorData.blocked)
    console.log('- College:', counsellorData.college || counsellorData.collegeName)
    
    return {
      found: true,
      uid: counsellorDoc.id,
      data: counsellorData,
      approved: counsellorData.approved,
      blocked: counsellorData.blocked
    }
    
  } catch (error) {
    console.error('❌ Error debugging counselor:', error)
    return { found: false, error: error.message }
  }
}

/**
 * Temporarily approve a counselor for testing purposes
 */
export const tempApproveCounselor = async (email) => {
  try {
    console.log('🔧 Temporarily approving counselor:', email)
    
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    
    const counsellorsQuery = query(collection(db, 'counsellors'), where('email', '==', email))
    const counsellorsSnapshot = await getDocs(counsellorsQuery)
    
    if (counsellorsSnapshot.empty) {
      console.log('❌ No counselor found with email:', email)
      return { success: false, message: 'Counselor not found' }
    }
    
    const counsellorDoc = counsellorsSnapshot.docs[0]
    
    await updateDoc(counsellorDoc.ref, {
      approved: true,
      updatedAt: new Date(),
      tempApproved: true // Flag to indicate this was a temporary approval
    })
    
    console.log('✅ Counselor temporarily approved')
    return { success: true, message: 'Counselor approved for testing' }
    
  } catch (error) {
    console.error('❌ Error approving counselor:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create a test counselor for development purposes
 */
export const createTestCounselor = async () => {
  try {
    console.log('🔧 Creating test counselor...')
    
    const testCounselorData = {
      uid: 'test-counselor-001',
      email: 'counselor@test.com',
      name: 'Test Counselor',
      firstName: 'Test',
      lastName: 'Counselor',
      role: 'counsellor',
      specialization: 'Clinical Psychology',
      qualifications: ['PhD in Clinical Psychology', 'Licensed Therapist'],
      experience: '5 years',
      languages: ['English', 'Hindi'],
      college: {
        name: 'Test University',
        id: 'test-university',
        code: 'TU001'
      },
      collegeName: 'Test University',
      phone: '+1234567890',
      approved: true, // Pre-approved for testing
      blocked: false,
      isActive: true,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      availability: {},
      bio: 'Test counselor for development purposes',
      licenseNumber: 'TEST123',
      totalSessions: 0,
      rating: 0,
      testAccount: true // Flag to indicate this is a test account
    }
    
    await setDoc(doc(db, 'counsellors', 'test-counselor-001'), testCounselorData)
    
    console.log('✅ Test counselor created successfully')
    console.log('📧 Email: counselor@test.com')
    console.log('🔑 Password: You need to create this user in Firebase Auth')
    
    return { 
      success: true, 
      message: 'Test counselor created',
      email: 'counselor@test.com',
      uid: 'test-counselor-001'
    }
    
  } catch (error) {
    console.error('❌ Error creating test counselor:', error)
    return { success: false, error: error.message }
  }
}

/**
 * List all counselors and their approval status
 */
export const listAllCounselors = async () => {
  try {
    console.log('📋 Listing all counselors...')
    
    const { collection, getDocs } = await import('firebase/firestore')
    
    const counsellorsSnapshot = await getDocs(collection(db, 'counsellors'))
    const counselors = []
    
    counsellorsSnapshot.forEach(doc => {
      const data = doc.data()
      counselors.push({
        uid: doc.id,
        email: data.email,
        name: data.name,
        approved: data.approved,
        blocked: data.blocked,
        college: data.college?.name || data.collegeName || 'Unknown'
      })
    })
    
    console.log('📊 Found counselors:', counselors)
    return { success: true, counselors }
    
  } catch (error) {
    console.error('❌ Error listing counselors:', error)
    return { success: false, error: error.message }
  }
}

// Export all functions for easy access in console
window.counselorDebug = {
  debugCounselorLogin,
  tempApproveCounselor,
  createTestCounselor,
  listAllCounselors
}

console.log('🔧 Counselor debug helper loaded. Use window.counselorDebug in console.')