/**
 * Fallback authentication for network connectivity issues
 */

// Temporary user storage for offline/network-issue scenarios
const TEMP_USERS = [
  {
    uid: 'temp-admin-001',
    email: 'admin@zencare.app',
    password: 'ZenCare2024!',
    role: 'admin',
    name: 'ZenCare Administrator',
    approved: true,
    blocked: false
  },
  {
    uid: 'temp-college-head-001',
    email: 'dean@gmail.com',
    password: 'Dean@123',
    role: 'college_head',
    name: 'College Head Dean',
    college: {
      name: 'SRKR Engineering College , Bhimavaram',
      id: 'SRKR Engineering College , Bhimavaram'
    },
    approved: true,
    blocked: false
  },
  {
    uid: 'temp-student-001', 
    email: 'syamala4747@gmail.com',
    password: 'Student@123',
    role: 'student',
    name: 'Syamala Student',
    college: {
      name: 'SRKR Engineering College , Bhimavaram',
      id: 'SRKR Engineering College , Bhimavaram'
    },
    approved: true,
    blocked: false
  },
  {
    uid: 'temp-counsellor-001',
    email: 'geethika@gmail.com', 
    password: 'Counsellor@123',
    role: 'counsellor',
    name: 'Geethika Counsellor',
    college: {
      name: 'SRKR Engineering College , Bhimavaram',
      id: 'SRKR Engineering College , Bhimavaram'
    },
    approved: true,
    blocked: false
  }
]

export const fallbackAuth = {
  /**
   * Attempt login with temporary credentials when Firebase is unavailable
   */
  login: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = TEMP_USERS.find(u => u.email === email && u.password === password)
        
        if (user) {
          // Store user in session storage
          sessionStorage.setItem('fallback_user', JSON.stringify(user))
          sessionStorage.setItem('fallback_mode', 'true')
          resolve({
            uid: user.uid,
            email: user.email,
            displayName: user.name
          })
        } else {
          reject(new Error('Invalid credentials'))
        }
      }, 100) // Simulate network delay
    })
  },

  /**
   * Get current user from session storage
   */
  getCurrentUser: () => {
    const userStr = sessionStorage.getItem('fallback_user')
    return userStr ? JSON.parse(userStr) : null
  },

  /**
   * Check if we're in fallback mode
   */
  isFallbackMode: () => {
    return sessionStorage.getItem('fallback_mode') === 'true'
  },

  /**
   * Logout from fallback mode
   */
  logout: () => {
    sessionStorage.removeItem('fallback_user')
    sessionStorage.removeItem('fallback_mode')
  },

  /**
   * Get user role for fallback user
   */
  getUserRole: () => {
    const user = fallbackAuth.getCurrentUser()
    return user ? user.role : null
  }
}

export default fallbackAuth