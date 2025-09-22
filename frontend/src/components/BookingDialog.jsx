import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Avatar,
  Rating
} from '@mui/material'
import {
  Schedule,
  VideoCall,
  LocationOn,
  Phone,
  Person,
  Notes,
  Warning,
  CheckCircle,
  Event,
  AccessTime,
  Today,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material'

const BookingDialog = ({ 
  open, 
  onClose, 
  counselor, 
  onBookingConfirm,
  userProfile = { name: 'Student Name', email: 'student@college.edu', phone: '+91-9876543210' }
}) => {
  const [activeStep, setActiveStep] = useState(0)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [sessionType, setSessionType] = useState('')
  const [sessionMode, setSessionMode] = useState('')
  const [studentNotes, setStudentNotes] = useState('')
  const [isEmergency, setIsEmergency] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [availableSlots, setAvailableSlots] = useState({})
  const [loading, setLoading] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(new Date())

  const steps = ['Select Date & Time', 'Session Details', 'Confirmation']

  // Generate available slots for the current week
  useEffect(() => {
    if (counselor && open) {
      generateAvailableSlots()
    }
  }, [counselor, currentWeek, open])

  const generateAvailableSlots = () => {
    if (!counselor) return

    const slots = {}
    const startOfWeek = getStartOfWeek(currentWeek)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const dateString = date.toISOString().split('T')[0]
      
      const daySchedule = counselor.availability.schedule[dayName]
      
      if (daySchedule && daySchedule.available) {
        // Filter out past times for today
        let availableTimes = daySchedule.slots
        if (date.toDateString() === new Date().toDateString()) {
          const currentHour = new Date().getHours()
          availableTimes = daySchedule.slots.filter(time => {
            const slotHour = parseInt(time.split(':')[0])
            return slotHour > currentHour
          })
        }

        slots[dateString] = {
          date,
          dayName,
          slots: availableTimes,
          isToday: date.toDateString() === new Date().toDateString(),
          isPast: date < new Date().setHours(0, 0, 0, 0)
        }
      }
    }
    
    setAvailableSlots(slots)
  }

  const getStartOfWeek = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDateSelect = (dateString) => {
    setSelectedDate(dateString)
    setSelectedTime('') // Reset time when date changes
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
  }

  const handleNext = () => {
    if (activeStep === 0 && (!selectedDate || !selectedTime)) {
      return // Don't proceed without date and time
    }
    if (activeStep === 1 && (!sessionType || !sessionMode)) {
      return // Don't proceed without session details
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleBookingSubmit = async () => {
    if (!agreedToTerms) return

    setLoading(true)
    
    const bookingData = {
      counselorId: counselor.id,
      studentId: userProfile.id || 'student_1',
      scheduledTime: new Date(`${selectedDate}T${selectedTime}:00`),
      duration: counselor.sessionDuration,
      sessionType,
      sessionMode,
      studentNotes,
      isEmergency,
      status: counselor.bookingSettings.instantBooking ? 'confirmed' : 'pending',
      bookedAt: new Date()
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onBookingConfirm(bookingData)
      onClose()
      
      // Reset form
      setActiveStep(0)
      setSelectedDate(null)
      setSelectedTime('')
      setSessionType('')
      setSessionMode('')
      setStudentNotes('')
      setIsEmergency(false)
      setAgreedToTerms(false)
      
    } catch (error) {
      console.error('Booking error:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction * 7))
    setCurrentWeek(newWeek)
    setSelectedDate(null)
    setSelectedTime('')
  }

  const DateTimeStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Select Date & Time
      </Typography>
      
      {/* Week Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
        <Button
          startIcon={<NavigateBefore />}
          onClick={() => navigateWeek(-1)}
          disabled={currentWeek <= new Date()}
        >
          Previous Week
        </Button>
        <Typography variant="h6" sx={{ mx: 3 }}>
          {getStartOfWeek(currentWeek).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric' 
          })} - {getStartOfWeek(new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}
        </Typography>
        <Button
          endIcon={<NavigateNext />}
          onClick={() => navigateWeek(1)}
        >
          Next Week
        </Button>
      </Box>

      {/* Date Selection */}
      <Grid container spacing={1} sx={{ mb: 3 }}>
        {Object.entries(availableSlots).map(([dateString, dayData]) => (
          <Grid item xs key={dateString}>
            <Paper
              elevation={selectedDate === dateString ? 2 : 0}
              sx={{
                p: 1,
                textAlign: 'center',
                cursor: dayData.isPast ? 'not-allowed' : 'pointer',
                backgroundColor: selectedDate === dateString ? 'primary.light' : 
                                dayData.isPast ? 'grey.100' : 'inherit',
                color: selectedDate === dateString ? 'primary.contrastText' : 
                       dayData.isPast ? 'text.disabled' : 'inherit',
                border: selectedDate === dateString ? '2px solid' : '1px solid',
                borderColor: selectedDate === dateString ? 'primary.main' : 'divider',
                '&:hover': {
                  backgroundColor: !dayData.isPast ? 'action.hover' : 'grey.100'
                }
              }}
              onClick={() => !dayData.isPast && handleDateSelect(dateString)}
            >
              <Typography variant="caption" display="block">
                {dayData.dayName.toUpperCase()}
              </Typography>
              <Typography variant="h6">
                {dayData.date.getDate()}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {dayData.slots.length} slots
              </Typography>
              {dayData.isToday && (
                <Chip label="Today" size="small" color="primary" sx={{ mt: 0.5 }} />
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Time Selection */}
      {selectedDate && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Available times for {formatDate(availableSlots[selectedDate].date)}:
          </Typography>
          <Grid container spacing={1}>
            {availableSlots[selectedDate].slots.map((time) => (
              <Grid item key={time}>
                <Chip
                  label={time}
                  clickable
                  variant={selectedTime === time ? "filled" : "outlined"}
                  color={selectedTime === time ? "primary" : "default"}
                  onClick={() => handleTimeSelect(time)}
                  icon={<AccessTime />}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {isEmergency && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Emergency Consultation:</strong> This will be prioritized and the counselor will be notified immediately.
          </Typography>
        </Alert>
      )}
    </Box>
  )

  const SessionDetailsStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Session Details
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Session Type</InputLabel>
            <Select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              label="Session Type"
            >
              {counselor.sessionTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {type === 'Individual Counseling' && <Person sx={{ mr: 1 }} />}
                    {type === 'Group Therapy' && <Person sx={{ mr: 1 }} />}
                    {type === 'Crisis Intervention' && <Warning sx={{ mr: 1 }} />}
                    {type}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Session Mode</InputLabel>
            <Select
              value={sessionMode}
              onChange={(e) => setSessionMode(e.target.value)}
              label="Session Mode"
            >
              {counselor.sessionModes.map((mode) => (
                <MenuItem key={mode} value={mode}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {mode === 'Video call' && <VideoCall sx={{ mr: 1 }} />}
                    {mode === 'Phone call' && <Phone sx={{ mr: 1 }} />}
                    {mode === 'In-person' && <LocationOn sx={{ mr: 1 }} />}
                    {mode}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes (Optional)"
            placeholder="Briefly describe what you'd like to discuss or any specific concerns..."
            value={studentNotes}
            onChange={(e) => setStudentNotes(e.target.value)}
            InputProps={{
              startAdornment: <Notes sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Grid>

        {counselor.bookingSettings.emergencyAvailable && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  color="warning"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Warning sx={{ mr: 1, color: 'warning.main' }} />
                  This is an emergency consultation
                </Box>
              }
            />
          </Grid>
        )}
      </Grid>

      {/* Session Information */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Session Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Duration</Typography>
              <Typography variant="body1">{counselor.sessionDuration} minutes</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Cancellation Policy</Typography>
              <Typography variant="body1">{counselor.bookingSettings.cancellationPolicy}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )

  const ConfirmationStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Confirm Your Booking
      </Typography>

      {/* Booking Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar src={counselor.avatar} sx={{ mr: 2 }}>
                  {counselor.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Box>
                  <Typography variant="h6">{counselor.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {counselor.title}
                  </Typography>
                  <Rating value={counselor.rating} size="small" readOnly />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Date & Time</Typography>
                  <Typography variant="body1">
                    {formatDate(new Date(selectedDate))} at {selectedTime}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Duration</Typography>
                  <Typography variant="body1">{counselor.sessionDuration} minutes</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Session Type</Typography>
                  <Typography variant="body1">{sessionType}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Mode</Typography>
                  <Typography variant="body1">{sessionMode}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {studentNotes && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">Your Notes</Typography>
              <Typography variant="body1">{studentNotes}</Typography>
            </>
          )}

          {isEmergency && (
            <>
              <Divider sx={{ my: 2 }} />
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Emergency Consultation:</strong> The counselor will be notified immediately.
                </Typography>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardContent>
          <FormControlLabel
            control={
              <Checkbox
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                I agree to the{' '}
                <Button size="small" sx={{ textDecoration: 'underline' }}>
                  terms and conditions
                </Button>{' '}
                and{' '}
                <Button size="small" sx={{ textDecoration: 'underline' }}>
                  privacy policy
                </Button>
              </Typography>
            }
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {counselor.bookingSettings.instantBooking 
              ? "Your appointment will be confirmed immediately."
              : "Your appointment request will be sent to the counselor for confirmation."
            }
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <DateTimeStep />
      case 1:
        return <SessionDetailsStep />
      case 2:
        return <ConfirmationStep />
      default:
        return 'Unknown step'
    }
  }

  const isStepComplete = (step) => {
    switch (step) {
      case 0:
        return selectedDate && selectedTime
      case 1:
        return sessionType && sessionMode
      case 2:
        return agreedToTerms
      default:
        return false
    }
  }

  if (!counselor) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Event sx={{ mr: 1 }} />
          Book Appointment with {counselor.name}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label} completed={isStepComplete(index)}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {getStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleBookingSubmit}
            disabled={!isStepComplete(activeStep) || loading}
            startIcon={loading ? null : <CheckCircle />}
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepComplete(activeStep)}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default BookingDialog