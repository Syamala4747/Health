import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase.js'

/**
 * Get college information for a user
 * @param {string} userId - The user's UID
 * @param {string} userRole - The user's role (college_head, counsellor, student)
 * @returns {Promise<Object|null>} College information or null if not found
 */
export const getUserCollege = async (userId, userRole) => {
  try {
    let userDoc = null
    
    // Determine which collection to check based on role
    switch (userRole) {
      case 'college_head':
        userDoc = await getDoc(doc(db, 'college_heads', userId))
        break
      case 'counsellor':
        userDoc = await getDoc(doc(db, 'counsellors', userId))
        break
      case 'student':
        userDoc = await getDoc(doc(db, 'users', userId))
        break
      default:
        console.warn('Unknown user role for college filtering:', userRole)
        return null
    }
    
    if (userDoc && userDoc.exists()) {
      const userData = userDoc.data()
      return userData.college || null
    }
    
    return null
  } catch (error) {
    console.error('Error getting user college:', error)
    return null
  }
}

/**
 * Create a Firestore query filtered by college
 * @param {string} collectionName - Name of the Firestore collection
 * @param {Object} college - College object with id and name
 * @param {Array} additionalFilters - Additional where clauses
 * @returns {Query} Filtered Firestore query
 */
export const createCollegeFilteredQuery = (collectionName, college, additionalFilters = []) => {
  if (!college || (!college.id && !college.name)) {
    throw new Error('College information is required for filtering')
  }
  
  let baseQuery = collection(db, collectionName)
  
  // Apply college filter - use id if available, otherwise use name
  let filteredQuery
  if (college.id) {
    filteredQuery = query(baseQuery, where('college.id', '==', college.id))
  } else if (college.name) {
    filteredQuery = query(baseQuery, where('college.name', '==', college.name))
  } else {
    filteredQuery = query(baseQuery, where('college', '==', college.name || college))
  }
  
  // Apply additional filters
  if (additionalFilters.length > 0) {
    filteredQuery = query(filteredQuery, ...additionalFilters)
  }
  
  return filteredQuery
}

/**
 * Get students filtered by college
 * @param {Object} college - College object with id and name
 * @param {Array} additionalFilters - Additional where clauses
 * @returns {Promise<Array>} Array of student documents
 */
export const getCollegeStudents = async (college, additionalFilters = []) => {
  try {
    const studentsQuery = createCollegeFilteredQuery('users', college, [
      where('role', '==', 'student'),
      ...additionalFilters
    ])
    
    const snapshot = await getDocs(studentsQuery)
    const students = []
    
    snapshot.forEach(doc => {
      students.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })
    })
    
    return students.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch (error) {
    console.error('Error fetching college students:', error)
    return []
  }
}

/**
 * Get counsellors filtered by college
 * @param {Object} college - College object with id and name
 * @param {Array} additionalFilters - Additional where clauses
 * @returns {Promise<Array>} Array of counsellor documents
 */
export const getCollegeCounsellors = async (college, additionalFilters = []) => {
  try {
    const counsellorsQuery = createCollegeFilteredQuery('counsellors', college, additionalFilters)
    
    const snapshot = await getDocs(counsellorsQuery)
    const counsellors = []
    
    snapshot.forEach(doc => {
      counsellors.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })
    })
    
    return counsellors.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch (error) {
    console.error('Error fetching college counsellors:', error)
    return []
  }
}

/**
 * Get reports filtered by college (reports involving users from the college)
 * @param {Object} college - College object with id and name
 * @returns {Promise<Array>} Array of report documents
 */
export const getCollegeReports = async (college) => {
  try {
    // Get all users from the college first
    const students = await getCollegeStudents(college)
    const counsellors = await getCollegeCounsellors(college)
    
    const collegeUserIds = [
      ...students.map(s => s.id),
      ...counsellors.map(c => c.id)
    ]
    
    if (collegeUserIds.length === 0) {
      return []
    }
    
    // Get reports where either reporter or reported user is from this college
    const reportsRef = collection(db, 'reports')
    const reportsSnapshot = await getDocs(reportsRef)
    
    const collegeReports = []
    
    reportsSnapshot.forEach(doc => {
      const reportData = doc.data()
      
      // Check if either the reporter or reported user is from this college
      if (collegeUserIds.includes(reportData.reporterUserId) || 
          collegeUserIds.includes(reportData.reportedUserId)) {
        collegeReports.push({
          id: doc.id,
          ...reportData,
          createdAt: reportData.createdAt?.toDate?.() || new Date()
        })
      }
    })
    
    return collegeReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch (error) {
    console.error('Error fetching college reports:', error)
    return []
  }
}

/**
 * Calculate college-specific statistics
 * @param {Object} college - College object with id and name
 * @returns {Promise<Object>} Statistics object
 */
export const getCollegeStats = async (college) => {
  try {
    const students = await getCollegeStudents(college)
    const counsellors = await getCollegeCounsellors(college)
    const reports = await getCollegeReports(college)
    
    const stats = {
      totalStudents: students.length,
      totalCounsellors: counsellors.length,
      activeCounsellors: counsellors.filter(c => c.approved && !c.blocked).length,
      pendingCounsellorApprovals: counsellors.filter(c => !c.approved && !c.blocked).length,
      blockedStudents: students.filter(s => s.blocked).length,
      blockedCounsellors: counsellors.filter(c => c.blocked).length,
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      resolvedReports: reports.filter(r => r.status === 'resolved').length,
      
      // Calculate new users this week
      oneWeekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      newStudentsThisWeek: students.filter(s => s.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
      newCounsellorsThisWeek: counsellors.filter(c => c.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    }
    
    // Calculate total blocked users
    stats.totalBlockedUsers = stats.blockedStudents + stats.blockedCounsellors
    
    // Calculate active users
    stats.activeUsers = (stats.totalStudents - stats.blockedStudents) + stats.activeCounsellors
    
    return stats
  } catch (error) {
    console.error('Error calculating college stats:', error)
    return {
      totalStudents: 0,
      totalCounsellors: 0,
      activeCounsellors: 0,
      pendingCounsellorApprovals: 0,
      blockedStudents: 0,
      blockedCounsellors: 0,
      totalBlockedUsers: 0,
      activeUsers: 0,
      totalReports: 0,
      pendingReports: 0,
      resolvedReports: 0,
      newStudentsThisWeek: 0,
      newCounsellorsThisWeek: 0
    }
  }
}

/**
 * Validate if a user has access to college data
 * @param {string} userId - The user's UID
 * @param {string} userRole - The user's role
 * @param {Object} targetCollege - The college being accessed
 * @returns {Promise<boolean>} True if user has access, false otherwise
 */
export const validateCollegeAccess = async (userId, userRole, targetCollege) => {
  try {
    // Admins have access to all colleges
    if (userRole === 'admin') {
      return true
    }
    
    // Get user's college
    const userCollege = await getUserCollege(userId, userRole)
    
    if (!userCollege || !targetCollege) {
      return false
    }
    
    // Check if user's college matches target college
    return userCollege.id === targetCollege.id
  } catch (error) {
    console.error('Error validating college access:', error)
    return false
  }
}

/**
 * Middleware function to ensure college-based access control
 * @param {string} userId - The user's UID
 * @param {string} userRole - The user's role
 * @param {Object} requestedCollege - The college being accessed
 * @returns {Promise<Object>} Access result with college info or error
 */
export const enforceCollegeAccess = async (userId, userRole, requestedCollege = null) => {
  try {
    // Admins bypass college filtering
    if (userRole === 'admin') {
      return {
        hasAccess: true,
        college: requestedCollege,
        bypassFiltering: true,
        userRole: 'admin'
      }
    }
    
    // Get user's college
    const userCollege = await getUserCollege(userId, userRole)
    
    if (!userCollege) {
      return {
        hasAccess: false,
        error: 'User college information not found',
        college: null
      }
    }
    
    // If specific college requested, validate access
    if (requestedCollege && requestedCollege.id !== userCollege.id) {
      return {
        hasAccess: false,
        error: 'Access denied: Cannot access data from other colleges',
        college: userCollege
      }
    }
    
    return {
      hasAccess: true,
      college: userCollege,
      bypassFiltering: false,
      userRole
    }
  } catch (error) {
    console.error('Error enforcing college access:', error)
    return {
      hasAccess: false,
      error: 'Access validation failed',
      college: null
    }
  }
}