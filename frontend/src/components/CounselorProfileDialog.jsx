import React, { useState } from 'react'
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Rating,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  Paper,
  LinearProgress,
  Alert,
  IconButton,
  Collapse,
  Badge
} from '@mui/material'
import {
  Close,
  School,
  Psychology,
  Language,
  VideoCall,
  LocationOn,
  Phone,
  Star,
  Person,
  Group,
  AccessTime,
  Emergency,
  BookOnline,
  Verified,
  Schedule,
  Reviews,
  Info,
  ExpandMore,
  ExpandLess,
  Award,
  Certificate,
  Experience,
  Favorite,
  ThumbUp
} from '@mui/icons-material'

const CounselorProfileDialog = ({ open, onClose, counselor, onBookAppointment }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showAllEducation, setShowAllEducation] = useState(false)

  if (!counselor) return null

  const tabs = [
    { label: 'Overview', icon: <Info /> },
    { label: 'Experience', icon: <Experience /> },
    { label: 'Reviews', icon: <Reviews /> },
    { label: 'Availability', icon: <Schedule /> }
  ]

  // Sample reviews data
  const reviews = [
    {
      id: 1,
      studentName: 'Anonymous Student',
      rating: 5,
      date: '2024-08-15',
      review: 'Dr. Sharma is incredibly compassionate and understanding. She helped me work through my anxiety and provided practical techniques that really work.',
      helpful: 23,
      sessionType: 'Individual Counseling'
    },
    {
      id: 2,
      studentName: 'Anonymous Student',
      rating: 5,
      date: '2024-08-10',
      review: 'Excellent counselor! Very professional and creates a safe space to discuss problems. The CBT techniques she taught me have been life-changing.',
      helpful: 18,
      sessionType: 'Individual Counseling'
    },
    {
      id: 3,
      studentName: 'Anonymous Student',
      rating: 4,
      date: '2024-08-05',
      review: 'Great experience overall. Sometimes sessions felt a bit rushed, but the advice was solid and practical.',
      helpful: 12,
      sessionType: 'Crisis Intervention'
    },
    {
      id: 4,
      studentName: 'Anonymous Student',
      rating: 5,
      date: '2024-07-28',
      review: 'Dr. Sharma helped me through a very difficult period. Her approach is warm yet professional, and she really listens.',
      helpful: 31,
      sessionType: 'Individual Counseling'
    }
  ]

  const OverviewTab = () => (
    <Box>
      {/* Header with photo and basic info */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            counselor.isVerified ? (
              <Verified sx={{ color: 'primary.main', fontSize: 24 }} />
            ) : null
          }
        >
          <Avatar
            src={counselor.avatar}
            sx={{ 
              width: 120, 
              height: 120, 
              mr: 3,
              border: '4px solid',
              borderColor: 'primary.main'
            }}
          >
            {counselor.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
        </Badge>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {counselor.name}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            {counselor.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Rating value={counselor.rating} precision={0.1} size="large" readOnly />
            <Typography variant="h6" sx={{ ml: 1, mr: 1 }}>
              {counselor.rating}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              ({counselor.totalReviews} reviews)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {counselor.bookingSettings.emergencyAvailable && (
              <Chip
                icon={<Emergency />}
                label="Emergency Available"
                color="error"
                variant="outlined"
              />
            )}
            {counselor.bookingSettings.instantBooking && (
              <Chip
                icon={<AccessTime />}
                label="Instant Booking"
                color="success"
                variant="outlined"
              />
            )}
          </Box>

          <Typography variant="body1" sx={{ mb: 2 }}>
            {counselor.experience} years of experience
          </Typography>
        </Box>
      </Box>

      {/* College affiliation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <School sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">College Affiliation</Typography>
          </Box>
          <Typography variant="body1">
            {counselor.college.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {counselor.college.department}
          </Typography>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            About {counselor.name.split(' ')[0]}
          </Typography>
          <Typography variant="body1" paragraph>
            {counselor.bio}
          </Typography>
        </CardContent>
      </Card>

      {/* Specializations */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Psychology sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Specializations</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {counselor.specializations.map((spec, index) => (
              <Chip
                key={index}
                label={spec}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Session Details */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Language sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Languages</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {counselor.languages.map((lang, index) => (
                  <Chip key={index} label={lang} variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VideoCall sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Session Modes</Typography>
              </Box>
              <List dense>
                {counselor.sessionModes.map((mode, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      {mode === 'Video call' && <VideoCall fontSize="small" />}
                      {mode === 'Phone call' && <Phone fontSize="small" />}
                      {mode === 'In-person' && <LocationOn fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText primary={mode} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )

  const ExperienceTab = () => (
    <Box>
      {/* Education */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <School sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Education</Typography>
            </Box>
            {counselor.education.length > 2 && (
              <Button
                size="small"
                endIcon={showAllEducation ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setShowAllEducation(!showAllEducation)}
              >
                {showAllEducation ? 'Show Less' : 'Show All'}
              </Button>
            )}
          </Box>
          <List>
            {(showAllEducation ? counselor.education : counselor.education.slice(0, 2)).map((education, index) => (
              <ListItem key={index} disablePadding>
                <ListItemIcon>
                  <Award sx={{ color: 'secondary.main' }} />
                </ListItemIcon>
                <ListItemText primary={education} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Certificate sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Certifications & Licenses</Typography>
          </Box>
          <List>
            <ListItem disablePadding>
              <ListItemIcon>
                <Verified sx={{ color: 'success.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary={`License: ${counselor.license}`}
                secondary="Active and verified"
              />
            </ListItem>
            {counselor.certifications.map((cert, index) => (
              <ListItem key={index} disablePadding>
                <ListItemIcon>
                  <Certificate sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary={cert} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Session Types */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Person sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Session Types Offered</Typography>
          </Box>
          <List>
            {counselor.sessionTypes.map((type, index) => (
              <ListItem key={index} disablePadding>
                <ListItemIcon>
                  {type === 'Individual Counseling' && <Person sx={{ color: 'primary.main' }} />}
                  {type === 'Group Therapy' && <Group sx={{ color: 'secondary.main' }} />}
                  {type === 'Crisis Intervention' && <Emergency sx={{ color: 'error.main' }} />}
                </ListItemIcon>
                <ListItemText 
                  primary={type}
                  secondary={`${counselor.sessionDuration} minutes per session`}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  )

  const ReviewsTab = () => (
    <Box>
      {/* Rating Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" color="primary.main">
                  {counselor.rating}
                </Typography>
                <Rating value={counselor.rating} precision={0.1} size="large" readOnly />
                <Typography variant="body2" color="text.secondary">
                  Based on {counselor.totalReviews} reviews
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ mb: 2 }}>Rating Distribution</Typography>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = Math.floor(Math.random() * 50) + 5 // Mock data
                const percentage = (count / counselor.totalReviews) * 100
                return (
                  <Box key={stars} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ width: 20 }}>
                      {stars}
                    </Typography>
                    <Star sx={{ color: 'warning.main', mx: 1, fontSize: 16 }} />
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{ flexGrow: 1, mr: 1 }}
                    />
                    <Typography variant="body2" sx={{ width: 40 }}>
                      {count}
                    </Typography>
                  </Box>
                )
              })}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent Reviews
      </Typography>
      
      {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
        <Card key={review.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ mr: 1 }}>
                    {review.studentName}
                  </Typography>
                  <Chip 
                    label={review.sessionType} 
                    size="small" 
                    variant="outlined" 
                  />
                </Box>
                <Rating value={review.rating} size="small" readOnly />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {new Date(review.date).toLocaleDateString()}
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              {review.review}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button size="small" startIcon={<ThumbUp />}>
                Helpful ({review.helpful})
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}

      {reviews.length > 3 && (
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setShowAllReviews(!showAllReviews)}
          endIcon={showAllReviews ? <ExpandLess /> : <ExpandMore />}
        >
          {showAllReviews ? 'Show Less Reviews' : `Show All ${reviews.length} Reviews`}
        </Button>
      )}
    </Box>
  )

  const AvailabilityTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Weekly Schedule
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        All times are in {counselor.availability.timezone}
      </Alert>

      <Grid container spacing={2}>
        {Object.entries(counselor.availability.schedule).map(([day, schedule]) => (
          <Grid item xs={12} sm={6} md={4} key={day}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, textTransform: 'capitalize' }}>
                  {day}
                </Typography>
                {schedule.available ? (
                  <Box>
                    <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                      Available
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {schedule.slots.map((slot, index) => (
                        <Chip
                          key={index}
                          label={slot}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Not available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Booking Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Advance Booking</Typography>
              <Typography variant="body1">
                Up to {counselor.bookingSettings.advanceBookingDays} days in advance
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Cancellation Policy</Typography>
              <Typography variant="body1">
                {counselor.bookingSettings.cancellationPolicy}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Session Duration</Typography>
              <Typography variant="body1">
                {counselor.sessionDuration} minutes
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Booking Type</Typography>
              <Typography variant="body1">
                {counselor.bookingSettings.instantBooking ? 'Instant Confirmation' : 'Requires Approval'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Counselor Profile</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            scrollButtons="auto"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <OverviewTab />}
          {activeTab === 1 && <ExperienceTab />}
          {activeTab === 2 && <ReviewsTab />}
          {activeTab === 3 && <AvailabilityTab />}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<BookOnline />}
          onClick={() => onBookAppointment(counselor)}
          size="large"
        >
          Book Appointment
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CounselorProfileDialog