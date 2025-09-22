import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Button, Avatar, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress,
  Container, useTheme, alpha, Rating, FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import {
  Psychology, Star, Schedule, VideoCall, Chat, Phone, Person, School, Language
} from '@mui/icons-material'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function CounselorBooking() {
  const theme = useTheme()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [counselors, setCounselors] = useState([])
  const [selectedCounselor, setSelectedCounselor] = useState(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [bookingData, setBookingData] = useState({
    scheduledAt: '',
    sessionType: 'both',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCounselors()
  }, [])

  const fetchCounselors = async () => {
    try {
      setLoading(true)
      
      // Get user's college info first
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', user.email),
        where('role', '==', 'student')
      )
      
      const userSnapshot = await getDocs(userQuery)
      if (userSnapshot.empty) {
        toast.error('Unable to determine your college affiliation')
        return
      }
      
      const userData = userSnapshot.docs[0].data()
      const userCollege = userData.college
      
      // Fetch counselors from same college
      const counselorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'counselor'),
        where('college.id', '==', userCollege.id),
        where('approved', '==', true),
        where('blocked', '==', false)
      )
      
      const counselorsSnapshot = await getDocs(counselorsQuery)
      const counselorsList = []
      
      counselorsSnapshot.forEach((doc) => {
        counselorsList.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      setCounselors(counselorsList)
    } catch (error) {
      console.error('Error fetching counselors:', error)
      toast.error('Failed to load counselors')
    } finally {
      setLoading(false)
    }
  }

  const handleBookCounselor = (counselor) => {
    setSelectedCounselor(counselor)
    setBookingDialogOpen(true)
  }

  const handleBookingSubmit = async () => {
    try {
      setSubmitting(true)
      
      await addDoc(collection(db, 'bookings'), {
        studentId: user.uid,
        counselorId: selectedCounselor.id,
        status: 'pending',
        scheduledAt: new Date(bookingData.scheduledAt),
        sessionType: bookingData.sessionType,
        notes: bookingData.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Create notification for counselor
      await addDoc(collection(db, 'notifications'), {
        userId: selectedCounselor.id,
        type: 'new_booking_request',
        title: 'New Booking Request',
        message: 'A student has requested a counseling session with you',
        read: false,
        createdAt: serverTimestamp()
      })
      
      toast.success('Booking request sent successfully!')
      setBookingDialogOpen(false)
      setBookingData({ scheduledAt: '', sessionType: 'both', notes: '' })
      
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error('Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={48} />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Book a Counselor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect with qualified mental health professionals from your college
        </Typography>
      </Box>

      {/* Counselors Grid */}
      {counselors.length === 0 ? (
        <Alert severity="info">
          No counselors are currently available from your college. Please check back later.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {counselors.map((counselor) => (
            <Grid item xs={12} md={6} lg={4} key={counselor.id}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56, mr: 2 }}>
                      <Psychology />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {counselor.profile?.firstName} {counselor.profile?.lastName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={4.5} size="small" readOnly />
                        <Typography variant="body2" color="text.secondary">
                          (4.5)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Specialization:</strong> {counselor.profile?.specialization}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Experience:</strong> {counselor.profile?.experience}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Languages:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {counselor.profile?.languages?.map((language) => (
                        <Chip key={language} label={language} size="small" />
                      ))}
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Schedule />}
                    onClick={() => handleBookCounselor(counselor)}
                    sx={{ borderRadius: 2 }}
                  >
                    Book Session
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Book Session with {selectedCounselor?.profile?.firstName} {selectedCounselor?.profile?.lastName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Preferred Date & Time"
              value={bookingData.scheduledAt}
              onChange={(e) => setBookingData(prev => ({ ...prev, scheduledAt: e.target.value }))}
              sx={{ mb: 3 }}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Session Type</InputLabel>
              <Select
                value={bookingData.sessionType}
                onChange={(e) => setBookingData(prev => ({ ...prev, sessionType: e.target.value }))}
                label="Session Type"
              >
                <MenuItem value="chat">Chat Only</MenuItem>
                <MenuItem value="audio">Audio Call Only</MenuItem>
                <MenuItem value="both">Chat + Audio Call</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Additional Notes (Optional)"
              value={bookingData.notes}
              onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Describe what you'd like to discuss or any specific concerns..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleBookingSubmit}
            disabled={!bookingData.scheduledAt || submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}