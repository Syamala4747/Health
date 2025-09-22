import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  alpha,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete
} from '@mui/material'
import {
  Person,
  Psychology,
  Email,
  Phone,
  School,
  Description,
  CloudUpload,
  CheckCircle,
  Work,
  Language
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { getAllColleges, getCollegesByState, getAllStates } from '../data/btechColleges.js'

const steps = ['Personal Information', 'Professional Details', 'College & Verification', 'Submit Application']

const availableLanguages = [
  'English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 
  'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Spanish', 'French'
]

const specializationOptions = [
  'Clinical Psychology',
  'Counseling Psychology', 
  'Educational Psychology',
  'Cognitive Behavioral Therapy',
  'Family Therapy',
  'Addiction Counseling',
  'Trauma Counseling',
  'Career Counseling',
  'Mental Health Counseling',
  'Student Counseling',
  'Other'
]

export default function CounselorRegistration() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedState, setSelectedState] = useState('')
  const [collegeOptions, setCollegeOptions] = useState(getAllColleges())
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Professional Information
    specialization: '',
    experience: '',
    qualifications: [],
    languages: ['English'],
    licenseNumber: '',
    
    // College Information
    collegeName: '',
    collegeCode: '',
    collegeId: '',
    
    // Verification
    idProofType: '',
    idProofFile: null,
    idProofUrl: ''
  })

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleStateChange = (state) => {
    setSelectedState(state)
    if (state) {
      setCollegeOptions(getCollegesByState(state))
    } else {
      setCollegeOptions(getAllColleges())
    }
    // Clear selected college when state changes
    setFormData(prev => ({ ...prev, collegeName: '', collegeCode: '', collegeId: '' }))
  }

  const handleCollegeChange = (event, newValue) => {
    if (newValue) {
      // Extract college code from the college name (assuming format: "College Name (CODE)")
      const codeMatch = newValue.match(/\(([^)]+)\)$/)
      const collegeCode = codeMatch ? codeMatch[1] : ''
      
      setFormData(prev => ({
        ...prev,
        collegeName: newValue,
        collegeCode: collegeCode,
        collegeId: collegeCode || newValue.toLowerCase().replace(/\s+/g, '-')
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        collegeName: '',
        collegeCode: '',
        collegeId: ''
      }))
    }
  }

  const handleLanguageChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      languages: newValue
    }))
  }

  const handleQualificationAdd = (qualification) => {
    if (qualification.trim() && !formData.qualifications.includes(qualification.trim())) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, qualification.trim()]
      }))
    }
  }

  const handleQualificationRemove = (qualification) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter(q => q !== qualification)
    }))
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // In a real implementation, you would upload to Firebase Storage
      // For now, we'll just store the file reference
      setFormData(prev => ({
        ...prev,
        idProofFile: file,
        idProofUrl: URL.createObjectURL(file) // Temporary URL for preview
      }))
      toast.success('ID proof uploaded successfully')
    }
  }

  const validateStep = (step) => {
    switch (step) {
      case 0: // Personal Information
        return formData.firstName && formData.lastName && formData.email
      case 1: // Professional Details
        return formData.specialization && formData.experience && formData.qualifications.length > 0
      case 2: // College & Verification
        return formData.collegeName && formData.idProofType && formData.idProofFile
      case 3: // Review
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1)
    } else {
      toast.error('Please fill in all required fields')
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, upload the ID proof file to Firebase Storage first
      const idProofUrl = formData.idProofFile ? 'placeholder-url' : ''
      
      // Submit the registration request to the API
      const response = await axios.post('/api/counselor-requests', {
        // Personal Information
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        
        // Professional Information
        specialization: formData.specialization,
        experience: formData.experience,
        qualifications: formData.qualifications,
        languages: formData.languages,
        licenseNumber: formData.licenseNumber,
        
        // College Information
        collegeName: formData.collegeName,
        collegeCode: formData.collegeCode,
        collegeId: formData.collegeId,
        
        // Verification
        idProofType: formData.idProofType,
        idProofUrl: idProofUrl
      })
      
      if (response.data.success) {
        toast.success('Counselor registration submitted successfully!')
        
        // Navigate to a success page or login
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Your counselor registration has been submitted. Your College Head will review your application and you will be notified once approved.' 
            }
          })
        }, 2000)
      } else {
        throw new Error(response.data.message || 'Failed to submit request')
      }
      
    } catch (error) {
      console.error('Error submitting registration:', error)
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ')
        toast.error(`Validation errors: ${errorMessages}`)
      } else {
        toast.error('Failed to submit registration request')
      }
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        )

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Specialization</InputLabel>
                <Select
                  value={formData.specialization}
                  onChange={handleInputChange('specialization')}
                  label="Specialization"
                >
                  {specializationOptions.map((spec) => (
                    <MenuItem key={spec} value={spec}>
                      {spec}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Years of Experience"
                value={formData.experience}
                onChange={handleInputChange('experience')}
                required
                placeholder="e.g., 5 years"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Work color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="License Number (Optional)"
                value={formData.licenseNumber}
                onChange={handleInputChange('licenseNumber')}
                placeholder="Professional license number"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Languages Spoken *
              </Typography>
              <Autocomplete
                multiple
                options={availableLanguages}
                value={formData.languages}
                onChange={handleLanguageChange}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select languages"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <Language color="action" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Qualifications *
              </Typography>
              <Box sx={{ mb: 2 }}>
                {formData.qualifications.map((qualification) => (
                  <Chip
                    key={qualification}
                    label={qualification}
                    onDelete={() => handleQualificationRemove(qualification)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
              <TextField
                fullWidth
                placeholder="Add qualification and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleQualificationAdd(e.target.value)
                    e.target.value = ''
                  }
                }}
                helperText="Examples: PhD in Psychology, Licensed Clinical Social Worker, Master's in Counseling"
              />
            </Grid>
          </Grid>
        )

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>State (Optional)</InputLabel>
                <Select
                  value={selectedState}
                  label="State (Optional)"
                  onChange={(e) => handleStateChange(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All States</em>
                  </MenuItem>
                  {getAllStates().map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                options={collegeOptions}
                value={formData.collegeName}
                onChange={handleCollegeChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="College/University *"
                    required
                    helperText={selectedState ? `Showing colleges in ${selectedState}` : 'Showing all colleges'}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <School color="action" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                filterOptions={(options, { inputValue }) => {
                  return options.filter(option =>
                    option.toLowerCase().includes(inputValue.toLowerCase())
                  )
                }}
                freeSolo
                autoHighlight
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please upload a valid ID proof document to verify your identity and professional credentials.
              </Alert>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>ID Proof Type</InputLabel>
                <Select
                  value={formData.idProofType}
                  label="ID Proof Type"
                  onChange={handleInputChange('idProofType')}
                >
                  <MenuItem value="aadhar">Aadhar Card</MenuItem>
                  <MenuItem value="passport">Passport</MenuItem>
                  <MenuItem value="license">Driving License</MenuItem>
                  <MenuItem value="professional_license">Professional License</MenuItem>
                  <MenuItem value="pan">PAN Card</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  border: `2px dashed ${theme.palette.primary.main}`,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
                onClick={() => document.getElementById('id-proof-upload').click()}
              >
                <input
                  id="id-proof-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <CloudUpload sx={{ fontSize: 32, color: theme.palette.primary.main, mb: 1 }} />
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  {formData.idProofFile ? 'ID Proof Uploaded' : 'Upload ID Proof'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.idProofFile 
                    ? `File: ${formData.idProofFile.name}`
                    : 'PDF, JPG, or PNG (Max 5MB)'
                  }
                </Typography>
                {formData.idProofFile && (
                  <CheckCircle sx={{ color: theme.palette.success.main, mt: 1 }} />
                )}
              </Paper>
            </Grid>
          </Grid>
        )

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Please review your information before submitting your counselor application.
              </Alert>
            </Grid>
            
            {/* Personal Information Review */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Personal Information
              </Typography>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.firstName} {formData.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.phone || 'Not provided'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Professional Information Review */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Professional Information
              </Typography>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Specialization</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.specialization}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Experience</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.experience}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Languages</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {formData.languages.map((language) => (
                        <Chip key={language} label={language} size="small" />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Qualifications</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {formData.qualifications.map((qualification) => (
                        <Chip key={qualification} label={qualification} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* College Information Review */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                College Information
              </Typography>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">College Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.collegeName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">College Code</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.collegeCode || 'Auto-generated'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Verification Review */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Verification Documents
              </Typography>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ color: theme.palette.success.main, mr: 2 }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      ID Proof Uploaded ({formData.idProofType})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.idProofFile?.name}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )

      default:
        return null
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Counselor Registration
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Join our platform to provide mental health support to students
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Form Content */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            {steps[activeStep]}
          </Typography>
          
          {renderStepContent(activeStep)}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ borderRadius: 2 }}
            >
              Back
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!validateStep(activeStep)}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{ 
                    borderRadius: 2, 
                    px: 4,
                    bgcolor: theme.palette.success.main,
                    '&:hover': { bgcolor: theme.palette.success.dark }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Paper 
        sx={{ 
          p: 3, 
          mt: 4, 
          borderRadius: 3,
          background: alpha(theme.palette.info.main, 0.05),
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.info.main }}>
          What happens next?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          1. Your application will be reviewed by your College Head
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          2. We will verify your credentials and professional qualifications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          3. You will receive an email notification once your account is approved
        </Typography>
        <Typography variant="body2" color="text.secondary">
          4. After approval, you can login and start providing counseling services to students
        </Typography>
      </Paper>
    </Container>
  )
}