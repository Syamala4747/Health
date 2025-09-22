import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getStudentCollege, getAssignedCounsellor } from '../services/counsellorService.js'

/**
 * Custom hook to get assigned counsellor for the current student
 * @returns {Object} { counsellor, loading, error }
 */
export const useAssignedCounsellor = () => {
  const [counsellor, setCounsellor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, userRole } = useAuth()

  useEffect(() => {
    const fetchAssignedCounsellor = async () => {
      // Only fetch for students
      if (!user || userRole !== 'student') {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Get student's college
        const studentCollege = await getStudentCollege(user.uid)
        
        if (!studentCollege) {
          setError('No college information found for student')
          setLoading(false)
          return
        }

        // Get assigned counsellor from same college
        const assignedCounsellor = await getAssignedCounsellor(studentCollege)
        
        if (assignedCounsellor) {
          setCounsellor(assignedCounsellor)
        } else {
          setError('No counsellors available from your college yet')
        }
      } catch (err) {
        console.error('Error fetching assigned counsellor:', err)
        setError('Failed to fetch counsellor information')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignedCounsellor()
  }, [user, userRole])

  return { counsellor, loading, error }
}