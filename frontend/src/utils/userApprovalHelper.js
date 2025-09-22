import { db } from '../config/firebase.js'
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'

export const approveUserByUID = async (uid, currentUserId = null, userRole = null) => {
  try {
    console.log('🔍 Looking for user with UID:', uid)
    
    // Get current user's college if they are a college head
    let currentUserCollege = null
    if (userRole === 'college_head' && currentUserId) {
      currentUserCollege = await getCurrentUserCollege(currentUserId)
    }
    
    // Check users collection first (only admins can approve users)
    if (userRole === 'admin') {
      const userDocRef = doc(db, 'users', uid)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        console.log('Found user in users collection:', userData)
        
        if (!userData.approved) {
          await updateDoc(userDocRef, {
            approved: true,
            updatedAt: new Date()
          })
          console.log('✅ User approved in users collection')
          return { success: true, role: userData.role, collection: 'users' }
        } else {
          console.log('ℹ️ User already approved in users collection')
          return { success: true, role: userData.role, collection: 'users', alreadyApproved: true }
        }
      }
    }
    
    // Check counsellors collection
    const counsellorDocRef = doc(db, 'counsellors', uid)
    const counsellorDoc = await getDoc(counsellorDocRef)
    
    if (counsellorDoc.exists()) {
      const counsellorData = counsellorDoc.data()
      console.log('Found user in counsellors collection:', counsellorData)
      
      // If current user is college head, check if counsellor belongs to same college
      if (userRole === 'college_head' && currentUserCollege) {
        const counsellorCollege = counsellorData.college?.name || counsellorData.collegeName || counsellorData.college
        if (counsellorCollege !== currentUserCollege?.name && counsellorCollege !== currentUserCollege) {
          console.error('❌ College head cannot approve counsellor from different college')
          return { success: false, error: 'You can only approve counsellors from your own college' }
        }
      }
      
      if (!counsellorData.approved) {
        await updateDoc(counsellorDocRef, {
          approved: true,
          updatedAt: new Date()
        })
        console.log('✅ Counsellor approved in counsellors collection')
        return { success: true, role: 'counsellor', collection: 'counsellors' }
      } else {
        console.log('ℹ️ Counsellor already approved in counsellors collection')
        return { success: true, role: 'counsellor', collection: 'counsellors', alreadyApproved: true }
      }
    }
    
    // Check college_heads collection (only admins can approve college heads)
    if (userRole === 'admin') {
      const collegeHeadDocRef = doc(db, 'college_heads', uid)
      const collegeHeadDoc = await getDoc(collegeHeadDocRef)
      
      if (collegeHeadDoc.exists()) {
        const collegeHeadData = collegeHeadDoc.data()
        console.log('Found user in college_heads collection:', collegeHeadData)
        
        if (!collegeHeadData.approved) {
          await updateDoc(collegeHeadDocRef, {
            approved: true,
            updatedAt: new Date()
          })
          console.log('✅ College head approved in college_heads collection')
          return { success: true, role: 'college_head', collection: 'college_heads' }
        } else {
          console.log('ℹ️ College head already approved in college_heads collection')
          return { success: true, role: 'college_head', collection: 'college_heads', alreadyApproved: true }
        }
      }
    }
    
    console.error('❌ User not found in any collection with UID:', uid)
    return { success: false, error: 'User not found in any collection' }
    
  } catch (error) {
    console.error('❌ Error approving user:', error)
    return { success: false, error: error.message }
  }
}

export const approveUserByEmail = async (email, currentUserId = null, userRole = null) => {
  try {
    console.log('🔍 Looking for user with email:', email)
    
    // Get current user's college if they are a college head
    let currentUserCollege = null
    if (userRole === 'college_head' && currentUserId) {
      currentUserCollege = await getCurrentUserCollege(currentUserId)
    }
    
    // Search in users collection (only admins can approve users)
    if (userRole === 'admin') {
      const usersQuery = query(collection(db, 'users'), where('email', '==', email))
      const usersSnapshot = await getDocs(usersQuery)
      
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0]
        const userData = userDoc.data()
        console.log('Found user in users collection:', userData)
        
        if (!userData.approved) {
          await updateDoc(userDoc.ref, {
            approved: true,
            updatedAt: new Date()
          })
          console.log('✅ User approved in users collection')
          return { success: true, role: userData.role, collection: 'users', uid: userDoc.id }
        } else {
          console.log('ℹ️ User already approved in users collection')
          return { success: true, role: userData.role, collection: 'users', uid: userDoc.id, alreadyApproved: true }
        }
      }
    }
    
    // Search in counsellors collection
    const counsellorsQuery = query(collection(db, 'counsellors'), where('email', '==', email))
    const counsellorsSnapshot = await getDocs(counsellorsQuery)
    
    if (!counsellorsSnapshot.empty) {
      const counsellorDoc = counsellorsSnapshot.docs[0]
      const counsellorData = counsellorDoc.data()
      console.log('Found user in counsellors collection:', counsellorData)
      
      // If current user is college head, check if counsellor belongs to same college
      if (userRole === 'college_head' && currentUserCollege) {
        const counsellorCollege = counsellorData.college?.name || counsellorData.collegeName || counsellorData.college
        if (counsellorCollege !== currentUserCollege?.name && counsellorCollege !== currentUserCollege) {
          console.error('❌ College head cannot approve counsellor from different college')
          return { success: false, error: 'You can only approve counsellors from your own college' }
        }
      }
      
      if (!counsellorData.approved) {
        await updateDoc(counsellorDoc.ref, {
          approved: true,
          updatedAt: new Date()
        })
        console.log('✅ Counsellor approved in counsellors collection')
        return { success: true, role: 'counsellor', collection: 'counsellors', uid: counsellorDoc.id }
      } else {
        console.log('ℹ️ Counsellor already approved in counsellors collection')
        return { success: true, role: 'counsellor', collection: 'counsellors', uid: counsellorDoc.id, alreadyApproved: true }
      }
    }
    
    // Search in college_heads collection (only admins can approve college heads)
    if (userRole === 'admin') {
      const collegeHeadsQuery = query(collection(db, 'college_heads'), where('email', '==', email))
      const collegeHeadsSnapshot = await getDocs(collegeHeadsQuery)
      
      if (!collegeHeadsSnapshot.empty) {
        const collegeHeadDoc = collegeHeadsSnapshot.docs[0]
        const collegeHeadData = collegeHeadDoc.data()
        console.log('Found user in college_heads collection:', collegeHeadData)
        
        if (!collegeHeadData.approved) {
          await updateDoc(collegeHeadDoc.ref, {
            approved: true,
            updatedAt: new Date()
          })
          console.log('✅ College head approved in college_heads collection')
          return { success: true, role: 'college_head', collection: 'college_heads', uid: collegeHeadDoc.id }
        } else {
          console.log('ℹ️ College head already approved in college_heads collection')
          return { success: true, role: 'college_head', collection: 'college_heads', uid: collegeHeadDoc.id, alreadyApproved: true }
        }
      }
    }
    
    console.error('❌ User not found in any collection with email:', email)
    return { success: false, error: 'User not found in any collection' }
    
  } catch (error) {
    console.error('❌ Error approving user:', error)
    return { success: false, error: error.message }
  }
}

// Get current user's college information
const getCurrentUserCollege = async (currentUserId) => {
  try {
    const collegeHeadDoc = await getDoc(doc(db, 'college_heads', currentUserId))
    if (collegeHeadDoc.exists()) {
      const data = collegeHeadDoc.data()
      return data.college
    }
    return null
  } catch (error) {
    console.error('Error getting current user college:', error)
    return null
  }
}

export const listPendingApprovals = async (currentUserId = null, userRole = null) => {
  try {
    const pendingUsers = []
    
    // If current user is a college head, get their college information
    let currentUserCollege = null
    if (userRole === 'college_head' && currentUserId) {
      currentUserCollege = await getCurrentUserCollege(currentUserId)
      console.log('Current college head college:', currentUserCollege)
    }
    
    // Check users collection (only for admins)
    if (userRole === 'admin') {
      const usersQuery = query(collection(db, 'users'), where('approved', '==', false))
      const usersSnapshot = await getDocs(usersQuery)
      usersSnapshot.forEach(doc => {
        const data = doc.data()
        pendingUsers.push({
          uid: doc.id,
          ...data, // Include all user data
          collection: 'users',
          createdAt: data.createdAt
        })
      })
    }
    
    // Check counsellors collection
    const counsellorsQuery = query(collection(db, 'counsellors'), where('approved', '==', false))
    const counsellorsSnapshot = await getDocs(counsellorsQuery)
    counsellorsSnapshot.forEach(doc => {
      const data = doc.data()
      
      // If current user is college head, only show counsellors from same college
      if (userRole === 'college_head' && currentUserCollege) {
        const counsellorCollege = data.college?.name || data.collegeName || data.college
        if (counsellorCollege !== currentUserCollege?.name && counsellorCollege !== currentUserCollege) {
          return // Skip this counsellor
        }
      }
      
      pendingUsers.push({
        uid: doc.id,
        ...data, // Include all counsellor data
        role: 'counsellor',
        collection: 'counsellors',
        createdAt: data.createdAt
      })
    })
    
    // Check college_heads collection (only for admins)
    if (userRole === 'admin') {
      const collegeHeadsQuery = query(collection(db, 'college_heads'), where('approved', '==', false))
      const collegeHeadsSnapshot = await getDocs(collegeHeadsQuery)
      collegeHeadsSnapshot.forEach(doc => {
        const data = doc.data()
        pendingUsers.push({
          uid: doc.id,
          ...data, // Include all college head data
          role: 'college_head',
          collection: 'college_heads',
          createdAt: data.createdAt
        })
      })
    }
    
    return pendingUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
  } catch (error) {
    console.error('❌ Error listing pending approvals:', error)
    return []
  }
}