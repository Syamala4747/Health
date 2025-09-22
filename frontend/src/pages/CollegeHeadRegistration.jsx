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
  MenuItem
} from '@mui/material'
import {
  Person,
  Business,
  Email,
  Phone,
  LocationOn,
  Description,
  CloudUpload,
  CheckCircle,
  School,
  PhotoCamera
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../config/firebase.js'
import { uploadCollegeHeadDocuments } from '../utils/fileUpload.js'
import toast from 'react-hot-toast'

const steps = ['Personal Information', 'College Details', 'Verification', 'Submit Request']

export default function CollegeHeadRegistration() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    password: '',
    
    // College Information
    collegeName: '',
    collegeCode: '',
    collegeId: '',
    collegeAddress: '',
    collegeType: '',
    
    // Additional Information
    additionalInfo: '',
    idProofFile: null,
    profilePhotoFile: null,
    idProofUrl: '',
    profilePhotoUrl: ''
  })

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleFileUpload = (fileType) => (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed')
        return
      }
      
      if (fileType === 'idProof') {
        setFormData(prev => ({
          ...prev,
          idProofFile: file,
          idProofUrl: URL.createObjectURL(file)
        }))
        toast.success('ID proof uploaded successfully')
      } else if (fileType === 'profilePhoto') {
        // Only allow images for profile photo
        if (!file.type.startsWith('image/')) {
          toast.error('Profile photo must be an image file')
          return
        }
        setFormData(prev => ({
          ...prev,
          profilePhotoFile: file,
          profilePhotoUrl: URL.createObjectURL(file)
        }))
        toast.success('Profile photo uploaded successfully')
      }
    }
  }

  const validateStep = (step) => {
    switch (step) {
      case 0: // Personal Information
        return formData.firstName && formData.lastName && formData.email && formData.position && formData.password
      case 1: // College Details
        return formData.collegeName && formData.collegeCode && formData.collegeId && formData.collegeAddress
      case 2: // Verification
        return formData.idProofFile && formData.profilePhotoFile
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
      
      // Step 1: Create Firebase Auth user
      console.log('Creating Firebase Auth user...')
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      )
      const user = userCredential.user
      console.log('✅ Firebase Auth user created:', user.uid)
      
      // Step 2: Upload documents to Firebase Storage
      console.log('Uploading documents...')
      const uploadedFiles = await uploadCollegeHeadDocuments(user.uid, {
        idProof: formData.idProofFile,
        profilePhoto: formData.profilePhotoFile
      })
      console.log('✅ Documents uploaded:', uploadedFiles)
      
      // Step 3: Create user document in Firestore
      console.log('Creating user document in Firestore...')
      const collegeHeadData = {
        uid: user.uid,
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: 'college_head',
        
        // Position/Professional Info
        designation: formData.position,
        department: formData.additionalInfo || null,
        
        // College Information
        college: {
          name: formData.collegeName,
          code: formData.collegeCode,
          id: formData.collegeId,
          address: formData.collegeAddress,
          type: formData.collegeType
        },
        collegeName: formData.collegeName, // Also store as direct field for easier querying
        
        // Documents
        idProofUrl: uploadedFiles.idProofUrl || null,
        profilePhotoUrl: uploadedFiles.profilePhotoUrl || null,
        idProofType: 'employee_id', // Default type, can be made configurable
        
        // Status
        approved: false, // Requires admin approval
        blocked: false,
        isActive: true,
        profileCompleted: true,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Additional info
        additionalInfo: formData.additionalInfo || null,
        
        // Stats (will be updated later)
        totalCounsellors: 0,
        totalStudents: 0
      }
      
      await setDoc(doc(db, 'college_heads', user.uid), collegeHeadData)
      console.log('✅ User document created in Firestore')
      
      toast.success('Registration completed successfully!')
      
      // Navigate to login with success message
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Your College Head registration has been submitted for approval. You will receive an email once it is reviewed by our admin team.',
            email: formData.email
          }
        })
      }, 2000)
      
    } catch (error) {
      console.error('❌ Error during registration:', error)
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists')
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please choose a stronger password.')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address')
      } else if (error.message?.includes('storage')) {
        toast.error('Failed to upload documents. Please try again.')
      } else {
        toast.error('Registration failed. Please try again.')
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
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position/Title"
                value={formData.position}
                onChange={handleInputChange('position')}
                required
                placeholder="e.g., Principal, Dean, Director"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                required
                helperText="Choose a strong password for your account"
              />
            </Grid>
          </Grid>
        )

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="College/Institution Name"
                value={formData.collegeName}
                onChange={handleInputChange('collegeName')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <School color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="College Code"
                value={formData.collegeCode}
                onChange={handleInputChange('collegeCode')}
                required
                placeholder="e.g., ABC123"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="College ID"
                value={formData.collegeId}
                onChange={handleInputChange('collegeId')}
                required
                placeholder="Unique institution identifier"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>College Type</InputLabel>
                <Select
                  value={formData.collegeType}
                  onChange={handleInputChange('collegeType')}
                  label="College Type"
                >
                  <MenuItem value="engineering">Engineering College</MenuItem>
                  <MenuItem value="medical">Medical College</MenuItem>
                  <MenuItem value="arts">Arts & Science College</MenuItem>
                  <MenuItem value="business">Business School</MenuItem>
                  <MenuItem value="university">University</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="College Address"
                multiline
                rows={3}
                value={formData.collegeAddress}
                onChange={handleInputChange('collegeAddress')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        )

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please upload a valid ID proof document and a profile photo to verify your identity and position at the institution.
              </Alert>
            </Grid>
            
            {/* ID Proof Upload */}
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
                  onChange={handleFileUpload('idProof')}
                />
                <CloudUpload sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
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
            
            {/* Profile Photo Upload */}
            <Grid item xs={12} sm={6}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  border: `2px dashed ${theme.palette.secondary.main}`,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.secondary.main, 0.05)
                  }
                }}
                onClick={() => document.getElementById('profile-photo-upload').click()}
              >
                <input
                  id="profile-photo-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload('profilePhoto')}
                />
                <PhotoCamera sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {formData.profilePhotoFile ? 'Profile Photo Uploaded' : 'Upload Profile Photo'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.profilePhotoFile 
                    ? `File: ${formData.profilePhotoFile.name}`
                    : 'JPG or PNG only (Max 5MB)'
                  }
                </Typography>
                {formData.profilePhotoFile && (
                  <CheckCircle sx={{ color: theme.palette.success.main, mt: 1 }} />
                )}
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Information (Optional)"
                multiline
                rows={4}
                value={formData.additionalInfo}
                onChange={handleInputChange('additionalInfo')}
                placeholder="Any additional information you'd like to provide..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        )

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Please review your information before submitting your registration request.
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
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Position</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.position}
                    </Typography>
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
                      {formData.collegeCode}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">College ID</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.collegeId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Address</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.collegeAddress}
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
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ color: theme.palette.success.main, mr: 2 }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          ID Proof Uploaded
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formData.idProofFile?.name}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ color: theme.palette.success.main, mr: 2 }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          Profile Photo Uploaded
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formData.profilePhotoFile?.name}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
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
          College Head Registration
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Register as a College Head to manage your institution's mental health support
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
                    'Submit Request'
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
          1. Your registration request will be reviewed by our admin team
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          2. We will verify your identity and institutional affiliation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          3. You will receive an email notification once your account is approved
        </Typography>
        <Typography variant="body2" color="text.secondary">
          4. After approval, you can login and start managing your institution's mental health support
        </Typography>
      </Paper>
    </Container>
  )
}