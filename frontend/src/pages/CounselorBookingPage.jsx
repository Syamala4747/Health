import React, { useState } from 'react'
import { Box, Container, Typography, Button, Alert, Snackbar } from '@mui/material'
import { School, CalendarToday } from '@mui/icons-material'
import CounselorBooking from './CounselorBooking'

/**
 * Example usage of the Counselor Booking System
 * This component demonstrates how to integrate the booking system into your app
 */
const CounselorBookingPage = () => {
  const [showBookingSystem, setShowBookingSystem] = useState(true)
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' })

  // Mock user data - replace with actual user context
  const mockUser = {
    id: 'student_123',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@iitd.ac.in',
    phone: '+91-9876543210',
    college: {
      id: 'college_1',
      name: 'Indian Institute of Technology Delhi'
    },
    course: 'Computer Science Engineering',
    year: '3rd Year'
  }

  const handleNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity })
  }

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false })
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarToday sx={{ mr: 2, fontSize: 40 }} />
          Mental Health Counseling
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Book appointments with qualified counselors from your college
        </Typography>
        
        {/* User Info */}
        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="body1">
            <strong>Welcome, {mockUser.name}!</strong><br />
            College: {mockUser.college.name}<br />
            Course: {mockUser.course} - {mockUser.year}
          </Typography>
        </Alert>
      </Box>

      {/* Main Counselor Booking Component */}
      {showBookingSystem && (
        <CounselorBooking 
          userCollege={mockUser.college}
          userProfile={mockUser}
          onNotification={handleNotification}
        />
      )}

      {/* Instructions */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          How to Use the Counselor Booking System:
        </Typography>
        <Typography variant="body1" paragraph>
          1. <strong>Browse Counselors:</strong> View all verified counselors from your college
        </Typography>
        <Typography variant="body1" paragraph>
          2. <strong>Filter & Search:</strong> Use filters to find counselors by specialization, language, or availability
        </Typography>
        <Typography variant="body1" paragraph>
          3. <strong>View Profiles:</strong> Click "View Profile" to see detailed information, reviews, and qualifications
        </Typography>
        <Typography variant="body1" paragraph>
          4. <strong>Book Appointment:</strong> Select date, time, and session details to book your appointment
        </Typography>
        <Typography variant="body1" paragraph>
          5. <strong>Manage Bookings:</strong> Track your appointments and receive confirmations
        </Typography>

        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Emergency Support:</strong> If you're experiencing a mental health crisis, 
            please contact emergency services immediately or call the National Suicide Prevention Lifeline at 988.
          </Typography>
        </Alert>
      </Box>

      {/* Integration Code Example */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Integration Example:
        </Typography>
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', bgcolor: 'white', p: 2, borderRadius: 1 }}>
          <pre>{`// Basic integration
import CounselorBooking from './components/CounselorBooking'

// In your component
<CounselorBooking 
  userCollege={{
    id: 'your_college_id',
    name: 'Your College Name'
  }}
  userProfile={{
    id: 'student_id',
    name: 'Student Name',
    email: 'student@college.edu'
  }}
/>

// With Firebase integration
import { counselorService } from './services/counselorBookingService'

// Fetch counselors
const counselors = await counselorService.getCounselorsByCollege(collegeId)

// Book appointment
const appointmentId = await appointmentService.bookAppointment({
  counselorId: 'counselor_id',
  studentId: 'student_id',
  scheduledTime: new Date(),
  sessionType: 'Individual Counseling',
  sessionMode: 'Video call'
})`}</pre>
        </Box>
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default CounselorBookingPage