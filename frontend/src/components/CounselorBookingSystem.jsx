import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Psychology,
  Star,
  Schedule,
  Language,
  School,
  Phone,
  VideoCall,
  Chat,
  FilterList,
  BookOnline
} from '@mui/icons-material'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function CounselorBookingSystem() {
  const { user } = useAuth()
  const [counselors, setCounselors] = useState([])
  const [filteredCounselors, setFilteredCounselors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCounselor, setSelectedCounselor] = useState(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [bookingType, setBookingType] = useState('chat')
  const [bookingMessage, setBookingMessage] = useState('')
  const [processing, setProcessing] = useState(false)
  const [userCollege, setUserCollege] = useState(null)
  const [filters, setFilters] = useState({
    specialization: '',
    language: '',
    rating: 0,
    availability: 'all'
  })

  useEffect(() => {
    if (user) {
      fetchUserCollege()
    }
  }, [user])

  useEffect(() => {
    if (userCollege) {
      fetchCounselors()
    }
  }, [userCollege])

  useEffect(() => {
    applyFilters()
  }, [counselors, filters])

  const fetchUserCollege = async () => {
    try {
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', user.email),
        where('role', '==', 'student')
      )
      
      const userSnapshot = await getDocs(userQuery)
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data()
        setUserCollege(userData.college)
      }
    } catch (error) {
      console.error('Error fetching user college:', error)
      toast.error('Unable to determine your college affiliation')
    }
  }

  const fetchCounselors = async () => {
    try {
      setLoading(true)
      
      // Fetch approved counselors from the same college
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'counselor'),
        where('college.id', '==', userCollege.id),
        where('approved', '==', true),
        where('blocked', '==', false)
      )
      
      const querySnapshot = await getDocs(q)
      const counselorsList = []
      
      for (const docSnapshot of querySnapshot.docs) {
        const counselorData = docSnapshot.data()
        
        // Fetch ratings and feedback
        const ratingsQuery = query(
          collection(db, 'counselor_ratings'),
          where('counselorId', '==', docSnapshot.id)
        )
        const ratingsSnapshot = await getDocs(ratingsQuery)
        
        let totalRating = 0
        let ratingCount = 0
        const recentFeedback = []
        
        ratingsSnapshot.forEach((ratingDoc) => {
          const rating = ratingDoc.data()
          totalRating += rating.rating
          ratingCount++
          if (rating.feedback) {
            recentFeedback.push(rating.feedback)
          }
        })
        
        const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0
        
        counselorsList.push({
          id: docSnapshot.id,
          ...counselorData,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingCount,
          recentFeedback: recentFeedback.slice(0, 3) // Last 3 feedback comments
        })
      }
      
      // Sort by rating and then by name
      counselorsList.sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating
        }
        return (a.profile?.firstName || '').localeCompare(b.profile?.firstName || '')
      })
      
      setCounselors(counselorsList)
    } catch (error) {
      console.error('Error fetching counselors:', error)
      toast.error('Failed to load counselors')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...counselors]
    
    if (filters.specialization) {
      filtered = filtered.filter(c => 
        c.profile?.specialization?.toLowerCase().includes(filters.specialization.toLowerCase())
      )
    }
    
    if (filters.language) {
      filtered = filtered.filter(c => 
        c.profile?.languages?.some(lang => 
          lang.toLowerCase().includes(filters.language.toLowerCase())
        )
      )
    }
    
    if (filters.rating > 0) {
      filtered = filtered.filter(c => c.averageRating >= filters.rating)
    }
    
    setFilteredCounselors(filtered)
  }

  const handleBookingRequest = async () => {
    if (!selectedCounselor || !bookingType) return
    
    try {
      setProcessing(true)
      
      // Create booking request
      const bookingData = {
        studentId: user.uid,
        studentEmail: user.email,
        counselorId: selectedCounselor.id,
        counselorEmail: selectedCounselor.email,
        type: bookingType, // 'chat', 'audio', 'both'
        message: bookingMessage.trim(),
        status: 'pending',
        requestedAt: new Date(),
        createdAt: new Date()
      }
      
      const bookingRef = await addDoc(collection(db, 'counselor_bookings'), bookingData)
      
      // Create notification for counselor
      await addDoc(collection(db, 'notifications'), {
        userId: selectedCounselor.id,
        type: 'booking_request',
        title: 'New Counseling Session Request',
        message: `A student has requested a ${bookingType} session with you.`,
        bookingId: bookingRef.id,
        read: false,
        createdAt: new Date()
      })
      
      toast.success('Booking request sent successfully!')
      setBookingDialogOpen(false)
      setBookingMessage('')
      setSelectedCounselor(null)
      
    } catch (error) {
      console.error('Error creating booking request:', error)
      toast.error('Failed to send booking request')
    } finally {
      setProcessing(false)
    }
  }

  const handleRandomBooking = async () => {
    if (filteredCounselors.length === 0) {
      toast.error('No counselors available for random booking')
      return
    }
    
    const randomCounselor = filteredCounselors[Math.floor(Math.random() * filteredCounselors.length)]
    setSelectedCounselor(randomCounselor)
    setBookingType('chat')
    setBookingMessage('I would like to schedule a counseling session.')
    setBookingDialogOpen(true)
  }

  const getSpecializations = () => {
    const specs = new Set()
    counselors.forEach(c => {
      if (c.profile?.specialization) {
        specs.add(c.profile.specialization)
      }
    })
    return Array.from(specs)
  }

  const getLanguages = () => {
    const langs = new Set()
    counselors.forEach(c => {
      if (c.profile?.languages) {
        c.profile.languages.forEach(lang => langs.add(lang))
      }
    })
    return Array.from(langs)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Book a Counseling Session
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect with qualified counselors from {userCollege?.name}
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Quick Booking Options
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get matched with an available counselor instantly
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              size="large"
              startIcon={<BookOnline />}
              onClick={handleRandomBooking}
              disabled={filteredCounselors.length === 0}
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Random Match
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList />
          Filter Counselors
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Specialization</InputLabel>
              <Select
                value={filters.specialization}
                onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
                label="Specialization"
              >
                <MenuItem value="">All Specializations</MenuItem>
                {getSpecializations().map((spec) => (
                  <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Language</InputLabel>
              <Select
                value={filters.language}
                onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                label="Language"
              >
                <MenuItem value="">All Languages</MenuItem>
                {getLanguages().map((lang) => (
                  <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Minimum Rating</InputLabel>
              <Select
                value={filters.rating}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                label="Minimum Rating"
              >
                <MenuItem value={0}>Any Rating</MenuItem>
                <MenuItem value={3}>3+ Stars</MenuItem>
                <MenuItem value={4}>4+ Stars</MenuItem>
                <MenuItem value={4.5}>4.5+ Stars</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              onClick={() => setFilters({ specialization: '', language: '', rating: 0, availability: 'all' })}
              fullWidth
              sx={{ height: '40px' }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Counselors List */}
      {filteredCounselors.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Psychology sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No Counselors Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or check back later
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredCounselors.map((counselor) => (
            <Grid item xs={12} md={6} lg={4} key={counselor.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 8
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main',
                        width: 56,
                        height: 56,
                        mr: 2
                      }}
                    >
                      <Psychology />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {counselor.profile?.firstName} {counselor.profile?.lastName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating 
                          value={counselor.averageRating} 
                          precision={0.1} 
                          size="small" 
                          readOnly 
                        />
                        <Typography variant="body2" color="text.secondary">
                          ({counselor.ratingCount})
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Specialization */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Specialization
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                    {counselor.profile?.specialization || 'General Counseling'}
                  </Typography>

                  {/* Experience */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Experience
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                    {counselor.profile?.experience || 'Not specified'}
                  </Typography>

                  {/* Languages */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Languages
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {counselor.profile?.languages?.slice(0, 3).map((language) => (
                      <Chip 
                        key={language}
                        label={language} 
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {counselor.profile?.languages?.length > 3 && (
                      <Chip 
                        label={`+${counselor.profile.languages.length - 3}`} 
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {/* Recent Feedback */}
                  {counselor.recentFeedback.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Recent Feedback
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontStyle: 'italic',
                          color: 'text.secondary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        "{counselor.recentFeedback[0]}"
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ mb: 2 }} />

                  {/* Booking Options */}
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Chat />}
                        onClick={() => {
                          setSelectedCounselor(counselor)
                          setBookingType('chat')
                          setBookingDialogOpen(true)
                        }}
                        fullWidth
                        sx={{ borderRadius: 2 }}
                      >
                        Chat
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Phone />}
                        onClick={() => {
                          setSelectedCounselor(counselor)
                          setBookingType('audio')
                          setBookingDialogOpen(true)
                        }}
                        fullWidth
                        sx={{ borderRadius: 2 }}
                      >
                        Audio
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Booking Dialog */}
      <Dialog 
        open={bookingDialogOpen} 
        onClose={() => setBookingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Book Session with {selectedCounselor?.profile?.firstName} {selectedCounselor?.profile?.lastName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Counselor Info */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Psychology />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedCounselor?.profile?.firstName} {selectedCounselor?.profile?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCounselor?.profile?.specialization}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Rating 
                      value={selectedCounselor?.averageRating || 0} 
                      precision={0.1} 
                      size="small" 
                      readOnly 
                    />
                    <Typography variant="caption" color="text.secondary">
                      ({selectedCounselor?.ratingCount || 0} reviews)
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Session Type */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Session Type</InputLabel>
              <Select
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value)}
                label="Session Type"
              >
                <MenuItem value="chat">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chat />
                    Text Chat Only
                  </Box>
                </MenuItem>
                <MenuItem value="audio">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone />
                    Audio Call Only
                  </Box>
                </MenuItem>
                <MenuItem value="both">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VideoCall />
                    Chat + Audio Call
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {/* Message */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Message (Optional)"
              value={bookingMessage}
              onChange={(e) => setBookingMessage(e.target.value)}
              placeholder="Tell the counselor what you'd like to discuss or any specific concerns..."
              sx={{ mb: 2 }}
            />

            <Alert severity="info">
              Your booking request will be sent to the counselor. They will respond within 24 hours to confirm or suggest alternative times.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setBookingDialogOpen(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBookingRequest}
            disabled={processing || !bookingType}
            sx={{ borderRadius: 2 }}
          >
            {processing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Send Booking Request'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}