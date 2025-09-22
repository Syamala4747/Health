import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase.js'

/**
 * Find counsellors from the same college as the student
 * @param {string} studentCollege - The student's college/university name
 * @returns {Promise<Array>} Array of counsellors from the same college
 */
export const getCounsellorsByCollege = async (studentCollege) => {
  try {
    if (!studentCollege) {
      console.log('No college provided for counsellor matching')
      return []
    }

    // Query counsellors collection where college matches and role is counsellor
    const counsellorsRef = collection(db, 'users')
    const q = query(
      counsellorsRef,
      where('role', '==', 'counsellor'),
      where('college', '==', studentCollege.trim()),
      where('approved', '==', true) // Only approved counsellors
    )

    const querySnapshot = await getDocs(q)
    const counsellors = []

    querySnapshot.forEach((doc) => {
      const counsellorData = doc.data()
      counsellors.push({
        id: doc.id,
        name: counsellorData.name,
        email: counsellorData.email,
        college: counsellorData.college,
        specialization: counsellorData.specialization,
        experience: counsellorData.experience,
        languages: counsellorData.languages || [],
        qualifications: counsellorData.qualifications || []
      })
    })

    console.log(`Found ${counsellors.length} counsellors from ${studentCollege}`)
    return counsellors
  } catch (error) {
    console.error('Error fetching counsellors by college:', error)
    return []
  }
}

/**
 * Get a random counsellor from the same college
 * @param {string} studentCollege - The student's college/university name
 * @returns {Promise<Object|null>} A random counsellor from the same college
 */
export const getAssignedCounsellor = async (studentCollege) => {
  try {
    const counsellors = await getCounsellorsByCollege(studentCollege)
    
    if (counsellors.length === 0) {
      return null
    }

    // Return a random counsellor from the same college
    const randomIndex = Math.floor(Math.random() * counsellors.length)
    return counsellors[randomIndex]
  } catch (error) {
    console.error('Error getting assigned counsellor:', error)
    return null
  }
}

/**
 * Get student's college from their profile
 * @param {string} userId - The student's user ID
 * @returns {Promise<string|null>} The student's college/university
 */
export const getStudentCollege = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.university || userData.college || null
    }
    
    return null
  } catch (error) {
    console.error('Error fetching student college:', error)
    return null
  }
}

/**
 * Get counsellor information by ID
 * @param {string} counsellorId - The counsellor's user ID
 * @returns {Promise<Object|null>} Counsellor information
 */
export const getCounsellorById = async (counsellorId) => {
  try {
    const counsellorDoc = await getDoc(doc(db, 'users', counsellorId))
    
    if (counsellorDoc.exists()) {
      const counsellorData = counsellorDoc.data()
      return {
        id: counsellorDoc.id,
        name: counsellorData.name,
        email: counsellorData.email,
        college: counsellorData.college,
        specialization: counsellorData.specialization,
        experience: counsellorData.experience,
        languages: counsellorData.languages || [],
        qualifications: counsellorData.qualifications || []
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching counsellor by ID:', error)
    return null
  }
}