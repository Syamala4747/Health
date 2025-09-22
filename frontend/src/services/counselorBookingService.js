/**
 * Firebase service for counselor booking system
 * Handles CRUD operations for counselors and appointments
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'

// Collection names
const COLLECTIONS = {
  COUNSELORS: 'counselors',
  APPOINTMENTS: 'appointments',
  REVIEWS: 'reviews',
  COLLEGES: 'colleges'
}

// Counselor operations
export const counselorService = {
  // Get all counselors from a specific college
  async getCounselorsByCollege(collegeId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.COUNSELORS),
        where('college.id', '==', collegeId),
        where('isActive', '==', true),
        orderBy('rating', 'desc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching counselors:', error)
      throw error
    }
  },

  // Get counselor by ID
  async getCounselorById(counselorId) {
    try {
      const docRef = doc(db, COLLECTIONS.COUNSELORS, counselorId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        }
      } else {
        throw new Error('Counselor not found')
      }
    } catch (error) {
      console.error('Error fetching counselor:', error)
      throw error
    }
  },

  // Search counselors by specialization, language, etc.
  async searchCounselors(collegeId, filters = {}) {
    try {
      let q = query(
        collection(db, COLLECTIONS.COUNSELORS),
        where('college.id', '==', collegeId),
        where('isActive', '==', true)
      )

      // Add additional filters
      if (filters.specialization) {
        q = query(q, where('specializations', 'array-contains', filters.specialization))
      }
      
      if (filters.language) {
        q = query(q, where('languages', 'array-contains', filters.language))
      }
      
      if (filters.sessionMode) {
        q = query(q, where('sessionModes', 'array-contains', filters.sessionMode))
      }
      
      if (filters.emergencyAvailable) {
        q = query(q, where('bookingSettings.emergencyAvailable', '==', true))
      }
      
      if (filters.instantBooking) {
        q = query(q, where('bookingSettings.instantBooking', '==', true))
      }

      // Add sorting
      if (filters.sortBy) {
        const direction = filters.sortDirection || 'desc'
        q = query(q, orderBy(filters.sortBy, direction))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error searching counselors:', error)
      throw error
    }
  },

  // Add new counselor (admin function)
  async addCounselor(counselorData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.COUNSELORS), {
        ...counselorData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding counselor:', error)
      throw error
    }
  },

  // Update counselor profile
  async updateCounselor(counselorId, updateData) {
    try {
      const docRef = doc(db, COLLECTIONS.COUNSELORS, counselorId)
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error updating counselor:', error)
      throw error
    }
  },

  // Listen to counselor changes (real-time updates)
  subscribeToCounselorUpdates(counselorId, callback) {
    const docRef = doc(db, COLLECTIONS.COUNSELORS, counselorId)
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data()
        })
      }
    })
  }
}

// Appointment operations
export const appointmentService = {
  // Book new appointment
  async bookAppointment(appointmentData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.APPOINTMENTS), {
        ...appointmentData,
        scheduledTime: Timestamp.fromDate(new Date(appointmentData.scheduledTime)),
        bookedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      
      // Update counselor's last booking time
      await counselorService.updateCounselor(appointmentData.counselorId, {
        lastBooking: Timestamp.now()
      })
      
      return docRef.id
    } catch (error) {
      console.error('Error booking appointment:', error)
      throw error
    }
  },

  // Get appointments for a student
  async getStudentAppointments(studentId, options = {}) {
    try {
      let q = query(
        collection(db, COLLECTIONS.APPOINTMENTS),
        where('studentId', '==', studentId),
        orderBy('scheduledTime', 'desc')
      )

      if (options.status) {
        q = query(q, where('status', '==', options.status))
      }

      if (options.limit) {
        q = query(q, limit(options.limit))
      }

      const querySnapshot = await getDocs(q)
      const appointments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledTime: doc.data().scheduledTime.toDate(),
        bookedAt: doc.data().bookedAt.toDate()
      }))

      // Fetch counselor details for each appointment
      const appointmentsWithCounselors = await Promise.all(
        appointments.map(async (appointment) => {
          const counselor = await counselorService.getCounselorById(appointment.counselorId)
          return {
            ...appointment,
            counselor
          }
        })
      )

      return appointmentsWithCounselors
    } catch (error) {
      console.error('Error fetching student appointments:', error)
      throw error
    }
  },

  // Get appointments for a counselor
  async getCounselorAppointments(counselorId, options = {}) {
    try {
      let q = query(
        collection(db, COLLECTIONS.APPOINTMENTS),
        where('counselorId', '==', counselorId),
        orderBy('scheduledTime', 'asc')
      )

      if (options.status) {
        q = query(q, where('status', '==', options.status))
      }

      if (options.date) {
        const startOfDay = new Date(options.date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(options.date)
        endOfDay.setHours(23, 59, 59, 999)
        
        q = query(
          q,
          where('scheduledTime', '>=', Timestamp.fromDate(startOfDay)),
          where('scheduledTime', '<=', Timestamp.fromDate(endOfDay))
        )
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledTime: doc.data().scheduledTime.toDate(),
        bookedAt: doc.data().bookedAt.toDate()
      }))
    } catch (error) {
      console.error('Error fetching counselor appointments:', error)
      throw error
    }
  },

  // Update appointment status
  async updateAppointmentStatus(appointmentId, status, notes = '') {
    try {
      const docRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId)
      await updateDoc(docRef, {
        status,
        counselorNotes: notes,
        updatedAt: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error updating appointment status:', error)
      throw error
    }
  },

  // Cancel appointment
  async cancelAppointment(appointmentId, reason = '') {
    try {
      const docRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId)
      await updateDoc(docRef, {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      throw error
    }
  },

  // Check for conflicting appointments
  async checkTimeSlotAvailability(counselorId, scheduledTime, duration = 50) {
    try {
      const startTime = new Date(scheduledTime)
      const endTime = new Date(startTime.getTime() + (duration * 60000))
      
      const q = query(
        collection(db, COLLECTIONS.APPOINTMENTS),
        where('counselorId', '==', counselorId),
        where('status', 'in', ['pending', 'confirmed']),
        where('scheduledTime', '>=', Timestamp.fromDate(startTime)),
        where('scheduledTime', '<=', Timestamp.fromDate(endTime))
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.empty // true if available, false if conflicting
    } catch (error) {
      console.error('Error checking time slot availability:', error)
      throw error
    }
  },

  // Listen to appointment updates
  subscribeToAppointmentUpdates(appointmentId, callback) {
    const docRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId)
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
          scheduledTime: doc.data().scheduledTime.toDate(),
          bookedAt: doc.data().bookedAt.toDate()
        })
      }
    })
  }
}

// Review operations
export const reviewService = {
  // Add review for counselor
  async addReview(reviewData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.REVIEWS), {
        ...reviewData,
        createdAt: Timestamp.now(),
        helpful: 0,
        reported: false
      })

      // Update counselor's rating
      await updateCounselorRating(reviewData.counselorId)
      
      return docRef.id
    } catch (error) {
      console.error('Error adding review:', error)
      throw error
    }
  },

  // Get reviews for counselor
  async getCounselorReviews(counselorId, options = {}) {
    try {
      let q = query(
        collection(db, COLLECTIONS.REVIEWS),
        where('counselorId', '==', counselorId),
        where('reported', '==', false),
        orderBy('createdAt', 'desc')
      )

      if (options.limit) {
        q = query(q, limit(options.limit))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      }))
    } catch (error) {
      console.error('Error fetching reviews:', error)
      throw error
    }
  },

  // Mark review as helpful
  async markReviewHelpful(reviewId) {
    try {
      const docRef = doc(db, COLLECTIONS.REVIEWS, reviewId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const currentHelpful = docSnap.data().helpful || 0
        await updateDoc(docRef, {
          helpful: currentHelpful + 1
        })
      }
      return true
    } catch (error) {
      console.error('Error marking review helpful:', error)
      throw error
    }
  }
}

// Helper function to update counselor rating
async function updateCounselorRating(counselorId) {
  try {
    const reviews = await reviewService.getCounselorReviews(counselorId)
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = totalRating / reviews.length
      
      await counselorService.updateCounselor(counselorId, {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: reviews.length
      })
    }
  } catch (error) {
    console.error('Error updating counselor rating:', error)
  }
}

// College operations
export const collegeService = {
  // Get college info
  async getCollegeById(collegeId) {
    try {
      const docRef = doc(db, COLLECTIONS.COLLEGES, collegeId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        }
      } else {
        throw new Error('College not found')
      }
    } catch (error) {
      console.error('Error fetching college:', error)
      throw error
    }
  },

  // Get all colleges
  async getAllColleges() {
    try {
      const q = query(collection(db, COLLECTIONS.COLLEGES), orderBy('name', 'asc'))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching colleges:', error)
      throw error
    }
  }
}

// Utility functions
export const utilityService = {
  // Get available time slots for a counselor on a specific date
  async getAvailableSlots(counselorId, date) {
    try {
      const counselor = await counselorService.getCounselorById(counselorId)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const daySchedule = counselor.availability.schedule[dayName]
      
      if (!daySchedule || !daySchedule.available) {
        return []
      }

      // Get existing appointments for this date
      const appointments = await appointmentService.getCounselorAppointments(counselorId, { date })
      const bookedSlots = appointments
        .filter(apt => apt.status === 'confirmed' || apt.status === 'pending')
        .map(apt => apt.scheduledTime.toTimeString().substring(0, 5))

      // Filter out booked slots
      const availableSlots = daySchedule.slots.filter(slot => !bookedSlots.includes(slot))
      
      // Filter out past times for today
      if (date.toDateString() === new Date().toDateString()) {
        const currentHour = new Date().getHours()
        return availableSlots.filter(slot => {
          const slotHour = parseInt(slot.split(':')[0])
          return slotHour > currentHour
        })
      }

      return availableSlots
    } catch (error) {
      console.error('Error getting available slots:', error)
      throw error
    }
  },

  // Send notification (placeholder for future implementation)
  async sendNotification(userId, type, data) {
    // This would integrate with Firebase Cloud Messaging or email service
    console.log('Notification sent:', { userId, type, data })
  }
}

export default {
  counselorService,
  appointmentService,
  reviewService,
  collegeService,
  utilityService
}