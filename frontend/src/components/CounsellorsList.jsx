import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Grid,
  Container,
  Paper,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material'
import {
  Person,
  School,
  Psychology,
  VideoCall,
  Message,
  Star,
  Close,
  Language,
  WorkOutline
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getCounsellorsByCollege, getStudentCollege } from '../services/counsellorService.js'

const CounsellorCard = ({ counsellor, onBookSession, onSendMessage }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Counsellor Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
            <Person sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" component="div">
              {counsellor.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {counsellor.specialization}
            </Typography>
          </Box>
        </Box>

        {/* College Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <School sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {counsellor.college}
          </Typography>
        </Box>

        {/* Experience */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WorkOutline sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {counsellor.experience} experience
          </Typography>
        </Box>

        {/* Languages */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Languages:
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {counsellor.languages?.slice(0, 3).map((language, index) => (
              <Chip
                key={index}
                label={language}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
            {counsellor.languages?.length > 3 && (
              <Chip
                label={`+${counsellor.languages.length - 3} more`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Qualifications */}
        {counsellor.qualifications?.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Qualifications:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              {counsellor.qualifications.slice(0, 2).join(', ')}
              {counsellor.qualifications.length > 2 && '...'}
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<VideoCall />}
            onClick={() => onBookSession(counsellor)}
            fullWidth
          >
            Book Session
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Message />}
            onClick={() => onSendMessage(counsellor)}
            fullWidth
          >
            Message
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

const CounsellorsList = ({ open, onClose }) => {
  const [counsellors, setCounsellors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [studentCollege, setStudentCollege] = useState('')
  const { user, userRole } = useAuth()

  useEffect(() => {
    const fetchCounsellors = async () => {
      if (!user || userRole !== 'student' || !open) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Get student's college
        const college = await getStudentCollege(user.uid)
        setStudentCollege(college)
        
        if (!college) {
          setError('No college information found in your profile')
          setLoading(false)
          return
        }

        // Get all counsellors from same college
        const counsellorsList = await getCounsellorsByCollege(college)
        setCounsellors(counsellorsList)

        if (counsellorsList.length === 0) {
          setError(`No counsellors available from ${college} yet`)
        }
      } catch (err) {
        console.error('Error fetching counsellors:', err)
        setError('Failed to fetch counsellors')
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchCounsellors()
    }
  }, [user, userRole, open])

  const handleBookSession = (counsellor) => {
    // TODO: Implement booking functionality
    console.log('Book session with:', counsellor.name)
    // For now, just show an alert
    alert(`Booking session with ${counsellor.name}. This feature will be implemented soon!`)
  }

  const handleSendMessage = (counsellor) => {
    // TODO: Implement messaging functionality
    console.log('Send message to:', counsellor.name)
    // For now, just show an alert
    alert(`Sending message to ${counsellor.name}. This feature will be implemented soon!`)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Psychology sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Counsellors from {studentCollege || 'Your College'}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Grid container spacing={3}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: 300 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Skeleton variant="circular" width={56} height={56} sx={{ mr: 2 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton variant="text" width="80%" />
                        <Skeleton variant="text" width="60%" />
                      </Box>
                    </Box>
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="90%" />
                    <Box sx={{ mt: 2 }}>
                      <Skeleton variant="rectangular" height={32} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {error && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {error}
            <br />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Counsellors from your college will appear here once they register and get approved.
            </Typography>
          </Alert>
        )}

        {!loading && !error && counsellors.length > 0 && (
          <Grid container spacing={3}>
            {counsellors.map((counsellor) => (
              <Grid item xs={12} sm={6} md={4} key={counsellor.id}>
                <CounsellorCard
                  counsellor={counsellor}
                  onBookSession={handleBookSession}
                  onSendMessage={handleSendMessage}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && !error && counsellors.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No counsellors available yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Counsellors from {studentCollege} will appear here once they register.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default CounsellorsList