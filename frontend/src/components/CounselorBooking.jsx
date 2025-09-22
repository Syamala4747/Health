import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  Rating,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  Badge,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse
} from '@mui/material'
import {
  Search,
  FilterList,
  School,
  Language,
  Schedule,
  VideoCall,
  Person,
  Phone,
  LocationOn,
  Star,
  BookOnline,
  ExpandMore,
  ExpandLess,
  Verified,
  Emergency,
  AccessTime,
  Psychology,
  Group,
  Event,
  Clear,
  Refresh
} from '@mui/icons-material'
import { sampleCounselors, specializationCategories } from '../types/counselor'
import BookingDialog from './BookingDialog'
import CounselorProfileDialog from './CounselorProfileDialog'

const CounselorBooking = ({ userCollege = { id: 'college_1', name: 'Indian Institute of Technology Delhi' } }) => {
  // State management
  const [counselors, setCounselors] = useState([])
  const [filteredCounselors, setFilteredCounselors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedSessionMode, setSelectedSessionMode] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCounselor, setSelectedCounselor] = useState(null)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [emergencyOnly, setEmergencyOnly] = useState(false)
  const [instantBookingOnly, setInstantBookingOnly] = useState(false)

  // Load counselors data
  useEffect(() => {
    const loadCounselors = async () => {
      setLoading(true)
      try {
        // Filter counselors by user's college
        const collegeCounselors = sampleCounselors.filter(
          counselor => counselor.college.id === userCollege.id && counselor.isActive
        )
        setCounselors(collegeCounselors)
        setFilteredCounselors(collegeCounselors)
      } catch (error) {
        console.error('Error loading counselors:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCounselors()
  }, [userCollege.id])

  // Filter and search logic
  const filteredAndSortedCounselors = useMemo(() => {
    let result = [...counselors]

    // Search filter
    if (searchTerm) {
      result = result.filter(counselor =>
        counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        counselor.specializations.some(spec => 
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        counselor.bio.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Specialization filter
    if (selectedSpecialization) {
      result = result.filter(counselor =>
        counselor.specializations.includes(selectedSpecialization)
      )
    }

    // Language filter
    if (selectedLanguage) {
      result = result.filter(counselor =>
        counselor.languages.includes(selectedLanguage)
      )
    }

    // Session mode filter
    if (selectedSessionMode) {
      result = result.filter(counselor =>
        counselor.sessionModes.includes(selectedSessionMode)
      )
    }

    // Emergency availability filter
    if (emergencyOnly) {
      result = result.filter(counselor =>
        counselor.bookingSettings.emergencyAvailable
      )
    }

    // Instant booking filter
    if (instantBookingOnly) {
      result = result.filter(counselor =>
        counselor.bookingSettings.instantBooking
      )
    }

    // Sort results
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'experience':
          return b.experience - a.experience
        case 'reviews':
          return b.totalReviews - a.totalReviews
        case 'name':
          return a.name.localeCompare(b.name)
        case 'availability':
          // Sort by number of available slots today
          const aSlots = getTodayAvailableSlots(a)
          const bSlots = getTodayAvailableSlots(b)
          return bSlots - aSlots
        default:
          return 0
      }
    })

    return result
  }, [counselors, searchTerm, selectedSpecialization, selectedLanguage, selectedSessionMode, sortBy, emergencyOnly, instantBookingOnly])

  // Helper functions
  const getTodayAvailableSlots = (counselor) => {
    const today = new Date().toLocaleLowerCase().split(',')[0] // Get day name
    const todaySchedule = counselor.availability.schedule[today]
    return todaySchedule?.available ? todaySchedule.slots.length : 0
  }

  const getAvailableLanguages = () => {
    const languages = new Set()
    counselors.forEach(counselor => {
      counselor.languages.forEach(lang => languages.add(lang))
    })
    return Array.from(languages).sort()
  }

  const getAvailableSessionModes = () => {
    const modes = new Set()
    counselors.forEach(counselor => {
      counselor.sessionModes.forEach(mode => modes.add(mode))
    })
    return Array.from(modes)
  }

  const getAllSpecializations = () => {
    const specs = new Set()
    counselors.forEach(counselor => {
      counselor.specializations.forEach(spec => specs.add(spec))
    })
    return Array.from(specs).sort()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSpecialization('')
    setSelectedLanguage('')
    setSelectedSessionMode('')
    setEmergencyOnly(false)
    setInstantBookingOnly(false)
    setSortBy('rating')
  }

  const handleBookAppointment = (counselor) => {
    setSelectedCounselor(counselor)
    setShowBookingDialog(true)
    setShowProfileDialog(false)
  }

  const handleViewProfile = (counselor) => {
    setSelectedCounselor(counselor)
    setShowProfileDialog(true)
  }

  const handleBookingConfirm = (bookingData) => {
    console.log('Booking confirmed:', bookingData)
    // Here you would typically save to Firebase/database
    alert(`Appointment booked successfully!\nDate: ${new Date(bookingData.scheduledTime).toLocaleString()}\nCounselor: ${selectedCounselor.name}`)
  }

  const CounselorCard = ({ counselor }) => {
    const todaySlots = getTodayAvailableSlots(counselor)
    const isAvailableToday = todaySlots > 0

    return (
      <Card 
        elevation={2} 
        sx={{ 
          mb: 2, 
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                counselor.isVerified ? (
                  <Verified sx={{ color: 'primary.main', fontSize: 20 }} />
                ) : null
              }
            >
              <Avatar
                src={counselor.avatar}
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mr: 2,
                  border: '3px solid',
                  borderColor: isAvailableToday ? 'success.main' : 'grey.300'
                }}
              >
                {counselor.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
            </Badge>
            
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" component="h3" sx={{ mr: 1 }}>
                  {counselor.name}
                </Typography>
                {counselor.bookingSettings.emergencyAvailable && (
                  <Tooltip title="Available for emergency consultations">
                    <Emergency sx={{ color: 'error.main', fontSize: 20 }} />
                  </Tooltip>
                )}
                {counselor.bookingSettings.instantBooking && (
                  <Tooltip title="Instant booking available">
                    <AccessTime sx={{ color: 'success.main', fontSize: 20, ml: 0.5 }} />
                  </Tooltip>
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {counselor.title} • {counselor.experience} years experience
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating value={counselor.rating} precision={0.1} size="small" readOnly />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {counselor.rating} ({counselor.totalReviews} reviews)
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                {counselor.bio.substring(0, 120)}...
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Specializations */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <Psychology sx={{ mr: 0.5, fontSize: 16 }} />
              Specializations
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {counselor.specializations.slice(0, 3).map((spec, index) => (
                <Chip
                  key={index}
                  label={spec}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
              {counselor.specializations.length > 3 && (
                <Chip
                  label={`+${counselor.specializations.length - 3} more`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          {/* Languages and Session Modes */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Language sx={{ mr: 0.5, fontSize: 16 }} />
                Languages
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {counselor.languages.join(', ')}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <VideoCall sx={{ mr: 0.5, fontSize: 16 }} />
                Session Modes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {counselor.sessionModes.join(', ')}
              </Typography>
            </Grid>
          </Grid>

          {/* Availability Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Schedule sx={{ mr: 0.5, fontSize: 16 }} />
            <Typography variant="subtitle2" sx={{ mr: 1 }}>
              Today's Availability:
            </Typography>
            {isAvailableToday ? (
              <Chip
                label={`${todaySlots} slots available`}
                color="success"
                size="small"
                icon={<Event />}
              />
            ) : (
              <Chip
                label="Not available today"
                color="default"
                size="small"
              />
            )}
          </Box>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => handleViewProfile(counselor)}
          >
            View Profile
          </Button>
          <Button
            variant="contained"
            startIcon={<BookOnline />}
            onClick={() => handleBookAppointment(counselor)}
            disabled={!isAvailableToday}
          >
            Book Appointment
          </Button>
        </CardActions>
      </Card>
    )
  }

  const FilterSection = () => (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterList sx={{ mr: 1 }} />
        <Typography variant="h6">Filters</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          size="small"
          startIcon={<Clear />}
          onClick={clearFilters}
        >
          Clear All
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Specialization</InputLabel>
            <Select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              label="Specialization"
            >
              <MenuItem value="">All Specializations</MenuItem>
              {getAllSpecializations().map((spec) => (
                <MenuItem key={spec} value={spec}>{spec}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Language</InputLabel>
            <Select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              label="Language"
            >
              <MenuItem value="">All Languages</MenuItem>
              {getAvailableLanguages().map((lang) => (
                <MenuItem key={lang} value={lang}>{lang}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Session Mode</InputLabel>
            <Select
              value={selectedSessionMode}
              onChange={(e) => setSelectedSessionMode(e.target.value)}
              label="Session Mode"
            >
              <MenuItem value="">All Modes</MenuItem>
              {getAvailableSessionModes().map((mode) => (
                <MenuItem key={mode} value={mode}>{mode}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="rating">Rating</MenuItem>
              <MenuItem value="experience">Experience</MenuItem>
              <MenuItem value="reviews">Reviews</MenuItem>
              <MenuItem value="availability">Availability</MenuItem>
              <MenuItem value="name">Name</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant={emergencyOnly ? "contained" : "outlined"}
              size="small"
              startIcon={<Emergency />}
              onClick={() => setEmergencyOnly(!emergencyOnly)}
              color={emergencyOnly ? "error" : "inherit"}
            >
              Emergency Available
            </Button>
            <Button
              variant={instantBookingOnly ? "contained" : "outlined"}
              size="small"
              startIcon={<AccessTime />}
              onClick={() => setInstantBookingOnly(!instantBookingOnly)}
              color={instantBookingOnly ? "success" : "inherit"}
            >
              Instant Booking
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Loading Counselors...
        </Typography>
        <LinearProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          <School sx={{ mr: 1 }} />
          Counselors at {userCollege.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Book appointments with verified mental health professionals from your college
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search counselors by name, specialization, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            size="small"
          />
          <Button
            variant="outlined"
            startIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <IconButton onClick={() => window.location.reload()}>
            <Refresh />
          </IconButton>
        </Box>
      </Paper>

      {/* Filters */}
      <Collapse in={showFilters}>
        <FilterSection />
      </Collapse>

      {/* Results Summary */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredAndSortedCounselors.length} of {counselors.length} counselors
        </Typography>
      </Box>

      {/* Counselor Cards */}
      {filteredAndSortedCounselors.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No counselors found matching your criteria. Try adjusting your filters.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredAndSortedCounselors.map((counselor) => (
            <Grid item xs={12} key={counselor.id}>
              <CounselorCard counselor={counselor} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Counselor Profile Dialog */}
      <CounselorProfileDialog
        open={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
        counselor={selectedCounselor}
        onBookAppointment={handleBookAppointment}
      />

      {/* Booking Dialog */}
      <BookingDialog
        open={showBookingDialog}
        onClose={() => setShowBookingDialog(false)}
        counselor={selectedCounselor}
        onBookingConfirm={handleBookingConfirm}
      />
    </Box>
  )
}

export default CounselorBooking