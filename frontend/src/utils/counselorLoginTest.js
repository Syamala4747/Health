// Simple test to debug counselor login issues
import { db } from '../config/firebase.js'
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore'

export const testCounselorLogin = async () => {
  console.log('🔧 Testing counselor login system...')
  
  try {
    // 1. Check if there are any counselors in the database
    console.log('📋 Checking for existing counselors...')
    const counselorsSnapshot = await getDocs(collection(db, 'counsellors'))
    
    console.log(`Found ${counselorsSnapshot.size} counselors in database`)
    
    counselorsSnapshot.forEach(doc => {
      const data = doc.data()
      console.log(`- ${data.email}: approved=${data.approved}, blocked=${data.blocked}`)
    })
    
    // 2. Create a test counselor if none exist
    if (counselorsSnapshot.size === 0) {
      console.log('🔧 No counselors found, creating test counselor...')
      await createTestCounselor()
    }
    
    // 3. Check environment
    console.log('🌍 Environment:', process.env.NODE_ENV)
    
    return {
      success: true,
      counselorCount: counselorsSnapshot.size,
      environment: process.env.NODE_ENV
    }
    
  } catch (error) {
    console.error('❌ Error testing counselor login:', error)
    return { success: false, error: error.message }
  }
}

export const createTestCounselor = async () => {
  try {
    const testCounselorData = {
      uid: 'test-counselor-123',
      email: 'test.counselor@example.com',
      name: 'Test Counselor',
      role: 'counsellor',
      specialization: 'Clinical Psychology',
      qualifications: ['PhD in Psychology'],
      experience: '5 years',
      languages: ['English'],
      college: {
        name: 'Test University',
        id: 'test-university'
      },
      collegeName: 'Test University',
      approved: true, // Pre-approved for testing
      blocked: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      testAccount: true
    }
    
    await setDoc(doc(db, 'counsellors', 'test-counselor-123'), testCounselorData)
    console.log('✅ Test counselor created successfully')
    console.log('📧 Email: test.counselor@example.com')
    console.log('🔑 You need to create this user in Firebase Auth with a password')
    
    return testCounselorData
  } catch (error) {
    console.error('❌ Error creating test counselor:', error)
    throw error
  }
}

// Make functions available in console
if (typeof window !== 'undefined') {
  window.testCounselorLogin = testCounselorLogin
  window.createTestCounselor = createTestCounselor
  console.log('🔧 Counselor test functions loaded. Use window.testCounselorLogin() in console.')
}