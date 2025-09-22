// Database migration script to separate users into students and counsellors collections
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'

// Your Firebase config (replace with actual values)
const firebaseConfig = {
  // Add your config here
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export const migrateUsersToSeparateCollections = async () => {
  try {
    console.log('🚀 Starting migration to separate collections...')
    
    // Get all users from current users collection
    const usersRef = collection(db, 'users')
    const usersSnapshot = await getDocs(usersRef)
    
    let studentsKept = 0
    let counsellorsCreated = 0
    let adminsRemoved = 0
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      const userId = userDoc.id
      
      if (userData.role === 'student') {
        // Keep student in users collection but clean up data to remove counsellor fields
        const studentData = {
          uid: userId,
          name: userData.name,
          email: userData.email,
          role: 'student',
          age: userData.age || null,
          university: userData.university || userData.college || null,
          major: userData.major || null,
          year: userData.year || null,
          gender: userData.gender || null,
          phone: userData.phone || null,
          preferredLanguage: userData.preferredLanguage || 'en',
          approved: userData.approved !== false, // Default to true for students
          blocked: userData.blocked || false,
          isActive: userData.isActive !== false,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt || userData.createdAt,
          lastActive: userData.lastActive || null,
          // Student-specific fields
          academicStress: userData.academicStress || null,
          mentalHealthHistory: userData.mentalHealthHistory || null,
          emergencyContact: userData.emergencyContact || null,
          guardianContact: userData.guardianContact || null,
          profileCompleted: userData.profileCompleted || false
        }
        
        // Update the existing student document in users collection
        await updateDoc(doc(db, 'users', userId), studentData)
        studentsKept++
        
      } else if (userData.role === 'counsellor') {
        // Move counsellor to counsellors collection
        const counsellorData = {
          uid: userId,
          name: userData.name,
          email: userData.email,
          role: 'counsellor',
          phone: userData.phone || null,
          specialization: userData.specialization || null,
          qualifications: userData.qualifications || [],
          experience: userData.experience || null,
          languages: userData.languages || ['English'],
          college: userData.college || userData.university || null,
          approved: userData.approved || false, // Default to false for counsellors (need approval)
          blocked: userData.blocked || false,
          isActive: userData.isActive !== false,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt || userData.createdAt,
          lastActive: userData.lastActive || null,
          // Counsellor-specific fields
          licenseNumber: userData.licenseNumber || null,
          availability: userData.availability || {},
          sessionRate: userData.sessionRate || null,
          bio: userData.bio || null,
          profileImage: userData.profileImage || null,
          totalSessions: userData.totalSessions || 0,
          rating: userData.rating || 0,
          reviews: userData.reviews || [],
          certifications: userData.certifications || [],
          profileCompleted: userData.profileCompleted || false
        }
        
        await addDoc(collection(db, 'counsellors'), counsellorData)
        counsellorsCreated++
        
        // Remove counsellor from users collection
        await deleteDoc(doc(db, 'users', userId))
        
      } else if (userData.role === 'admin') {
        // Remove admin from users collection (admins should be managed separately)
        await deleteDoc(doc(db, 'users', userId))
        adminsRemoved++
      }
    }
    
    console.log('✅ Migration completed successfully!')
    console.log(`👥 Students kept in users table: ${studentsKept}`)
    console.log(`🧠 Counsellors moved to counsellors table: ${counsellorsCreated}`)
    console.log(`🔧 Admins removed: ${adminsRemoved}`)
    
    return {
      success: true,
      studentsCreated: studentsKept,
      counsellorsCreated,
      adminsKept: adminsRemoved
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    
    console.log('✅ Migration completed successfully!')
    console.log(`� Students kept in users table: ${studentsKept}`)
    console.log(`🧠 Counsellors moved to counsellors table: ${counsellorsCreated}`)
    console.log(`🔧 Admins removed: ${adminsRemoved}`)
    
    return {
      success: true,
      studentsCreated: studentsKept,
      counsellorsCreated,
      adminsKept: adminsRemoved
    }
    
  } try{}catch (error) {
    console.error('❌ Migration failed:', error)
    throw new Error(`Migration failed: ${error.message}`)
  }
}

// Utility function to get students (from users collection where role='student')
export const getStudents = async () => {
  try {
    const usersRef = collection(db, 'users')
    const studentsQuery = query(usersRef, where('role', '==', 'student'))
    const snapshot = await getDocs(studentsQuery)
    const students = []
    
    snapshot.forEach(doc => {
      students.push({ id: doc.id, ...doc.data() })
    })
    
    return students
  } catch (error) {
    console.error('Error fetching students:', error)
    return []
  }
}

// Utility function to get counsellors
export const getCounsellors = async () => {
  try {
    const counsellorsRef = collection(db, 'counsellors')
    const snapshot = await getDocs(counsellorsRef)
    const counsellors = []
    
    snapshot.forEach(doc => {
      counsellors.push({ id: doc.id, ...doc.data() })
    })
    
    return counsellors
  } catch (error) {
    console.error('Error fetching counsellors:', error)
    return []
  }
}

// Utility function to get admins
export const getAdmins = async () => {
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('role', '==', 'admin'))
    const snapshot = await getDocs(q)
    const admins = []
    
    snapshot.forEach(doc => {
      admins.push({ id: doc.id, ...doc.data() })
    })
    
    return admins
  } catch (error) {
    console.error('Error fetching admins:', error)
    return []
  }
}

// Function to create a new student
export const createStudent = async (studentData) => {
  try {
    const cleanStudentData = {
      uid: studentData.uid,
      name: studentData.name,
      email: studentData.email,
      age: studentData.age || null,
      university: studentData.university || null,
      major: studentData.major || null,
      year: studentData.year || null,
      preferredLanguage: studentData.preferredLanguage || 'en',
      approved: true, // Students are auto-approved
      blocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const docRef = await addDoc(collection(db, 'students'), cleanStudentData)
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Error creating student:', error)
    return { success: false, error: error.message }
  }
}

// Function to create a new counsellor
export const createCounsellor = async (counsellorData) => {
  try {
    const cleanCounsellorData = {
      uid: counsellorData.uid,
      name: counsellorData.name,
      email: counsellorData.email,
      specialization: counsellorData.specialization || null,
      qualifications: counsellorData.qualifications || [],
      experience: counsellorData.experience || null,
      languages: counsellorData.languages || ['English'],
      college: counsellorData.college || null,
      approved: false, // Counsellors need approval
      blocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      licenseNumber: counsellorData.licenseNumber || null,
      availability: counsellorData.availability || {},
      bio: counsellorData.bio || null
    }
    
    const docRef = await addDoc(collection(db, 'counsellors'), cleanCounsellorData)
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Error creating counsellor:', error)
    return { success: false, error: error.message }
  }
}