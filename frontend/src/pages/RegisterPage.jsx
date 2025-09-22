import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  Divider,
  Grid,
  Paper,
  Autocomplete,
  MenuItem,
  Select,
  InputLabel,
} from '@mui/material'
import {
  AdminPanelSettings,
  Psychology,
  School,
  Info,
  Business,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'
import { testFirebaseConnection, testAuthConfig } from '../utils/firebaseTest.js'
import { getAllColleges, getCollegesByState, getAllStates, searchColleges } from '../data/btechColleges.js'

const roles = [
  {
    id: 'student',
    title: 'Student',
    description: 'Access wellness resources and connect with counsellors',
    icon: <School sx={{ fontSize: 40 }} />,
    color: '#10b981',
  },
  {
    id: 'counsellor',
    title: 'Counsellor',
    description: 'Provide support and guidance to students',
    icon: <Psychology sx={{ fontSize: 40 }} />,
    color: '#06b6d4',
  },
  {
    id: 'college_head',
    title: 'College Head',
    description: 'Manage college counsellors and oversee student wellness',
    icon: <Business sx={{ fontSize: 40 }} />,
    color: '#f59e0b',
  },
]

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    // Student fields
    university: '',
    major: '',
    year: '',
    age: '',
    // Counsellor fields
    college: '', // Added college field for counsellors
    specialization: '',
    experience: '',
    qualifications: '',
    languages: ['English'],
    // College Head fields
    designation: '',
    department: '',
    // ID Proof fields (for all roles except student)
    idProofType: '',
    idProofFile: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState('student')
  const [selectedState, setSelectedState] = useState('')
  const [collegeOptions, setCollegeOptions] = useState(getAllColleges())

  const { register } = useAuth()
  const navigate = useNavigate()

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleStateChange = (state) => {
    setSelectedState(state)
    if (state) {
      setCollegeOptions(getCollegesByState(state))
    } else {
      setCollegeOptions(getAllColleges())
    }
    // Clear selected college when state changes
    updateFormData('university', '')
    updateFormData('college', '')
  }

  const handleRoleChange = (event) => {
    const role = event.target.value
    setSelectedRole(role)
    updateFormData('role', role)
    // Reset college selection when role changes
    setSelectedState('')
    setCollegeOptions(getAllColleges())
    updateFormData('university', '')
    updateFormData('college', '')
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your full name')
      return false
    }
    
    if (!formData.email.trim()) {
      setError('Please enter your email address')
      return false
    }
    
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    // Role-specific validation
    if (formData.role === 'student') {
      if (!formData.university.trim()) {
        setError('Please enter your university')
        return false
      }
    } else if (formData.role === 'counsellor') {
      if (!formData.college.trim()) {
        setError('Please enter your college/university')
        return false
      }
      if (!formData.specialization.trim()) {
        setError('Please enter your specialization')
        return false
      }
      if (!formData.experience.trim()) {
        setError('Please enter your experience')
        return false
      }
      if (!formData.idProofType) {
        setError('Please select ID proof type')
        return false
      }
      if (!formData.idProofFile) {
        setError('Please upload your ID proof')
        return false
      }
    } else if (formData.role === 'college_head') {
      if (!formData.college.trim()) {
        setError('Please enter your college/university')
        return false
      }
      if (!formData.designation.trim()) {
        setError('Please enter your designation')
        return false
      }
      if (!formData.department.trim()) {
        setError('Please enter your department')
        return false
      }
      if (!formData.idProofType) {
        setError('Please select ID proof type')
        return false
      }
      if (!formData.idProofFile) {
        setError('Please upload your ID proof')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setLoading(true)
    try {
      const userData = {
        ...formData,
        qualifications: formData.qualifications.split(',').map(q => q.trim()).filter(q => q),
      }

      console.log('Attempting registration with:', { 
        email: formData.email, 
        role: formData.role,
        hasPassword: !!formData.password,
        passwordLength: formData.password.length
      })
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        throw new Error('Invalid email format')
      }
      
      await register(formData.email.trim(), formData.password, userData)
      
      if (formData.role === 'counsellor') {
        toast.success('Registration successful! Your account is pending approval.')
      } else {
        toast.success('Registration successful!')
      }
      
      navigate('/login')
    } catch (error) {
      console.error('Registration error:', error)
      let errorMessage = 'Registration failed. Please try again.'
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.'
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please contact support.'
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase project configuration is incomplete. Please check Firebase setup.'
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Invalid Firebase API key. Please check configuration.'
      } else if (error.code === 'auth/project-not-found') {
        errorMessage = 'Firebase project not found. Please check project ID.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      toast.error('Registration failed: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const addLanguage = (language) => {
    if (!formData.languages.includes(language)) {
      updateFormData('languages', [...formData.languages, language])
    }
  }

  const removeLanguage = (language) => {
    updateFormData('languages', formData.languages.filter(l => l !== language))
  }

  const availableLanguages = ['English', 'Spanish', 'French', 'German', 'Telugu', 'Hindi', 'Tamil']

  const handleTestFirebase = async () => {
    testAuthConfig()
    const isConnected = await testFirebaseConnection()
    if (isConnected) {
      toast.success('Firebase connection successful!')
    } else {
      toast.error('Firebase connection failed!')
    }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Join ZenCare
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Create your wellness account
        </Typography>
      </Box>

      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            {/* Role Selection */}
            <Typography variant="h6" gutterBottom color="primary">
              Select Your Role
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {roles.map((role) => (
                <Grid item xs={12} sm={6} key={role.id}>
                  <Paper
                    elevation={selectedRole === role.id ? 3 : 1}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: selectedRole === role.id ? 2 : 1,
                      borderColor: selectedRole === role.id ? 'primary.main' : 'grey.300',
                      '&:hover': { elevation: 2 }
                    }}
                    onClick={() => {
                      setSelectedRole(role.id)
                      updateFormData('role', role.id)
                    }}
                  >
                    <Box display="flex" alignItems="center" mb={1}>
                      <Box sx={{ color: role.color, mr: 2 }}>
                        {role.icon}
                      </Box>
                      <Typography variant="h6">{role.title}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {role.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Basic Information */}
            <Typography variant="h6" gutterBottom color="primary">
              Basic Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  required
                  helperText="Minimum 6 characters"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  required
                />
              </Grid>
            </Grid>

            {/* Role-specific fields */}
            {selectedRole === 'student' && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom color="primary">
                  Student Information
                </Typography>
                <Grid container spacing={2}>
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
                      value={formData.university}
                      onChange={(event, newValue) => {
                        updateFormData('university', newValue || '')
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="University/College *"
                          required
                          helperText={selectedState ? `Showing colleges in ${selectedState}` : 'Showing all BTech colleges in India'}
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Major/Field of Study"
                      value={formData.major}
                      onChange={(e) => updateFormData('major', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Year of Study"
                      value={formData.year}
                      onChange={(e) => updateFormData('year', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => updateFormData('age', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {selectedRole === 'counsellor' && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom color="primary">
                  Professional Information
                </Typography>
                <Grid container spacing={2}>
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
                      value={formData.college}
                      onChange={(event, newValue) => {
                        updateFormData('college', newValue || '')
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="College/University *"
                          required
                          helperText={selectedState ? `Showing colleges in ${selectedState}` : 'Showing all BTech colleges in India'}
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
                    <TextField
                      fullWidth
                      label="Specialization"
                      value={formData.specialization}
                      onChange={(e) => updateFormData('specialization', e.target.value)}
                      required
                      placeholder="e.g., Clinical Psychology, Counseling Psychology"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Years of Experience"
                      value={formData.experience}
                      onChange={(e) => updateFormData('experience', e.target.value)}
                      required
                      placeholder="e.g., 5 years"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Qualifications"
                      multiline
                      rows={3}
                      value={formData.qualifications}
                      onChange={(e) => updateFormData('qualifications', e.target.value)}
                      placeholder="Enter qualifications separated by commas (e.g., PhD in Psychology, Licensed Therapist)"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Languages Spoken
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {formData.languages.map((language) => (
                        <Chip
                          key={language}
                          label={language}
                          onDelete={() => removeLanguage(language)}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                    <Box>
                      {availableLanguages
                        .filter(lang => !formData.languages.includes(lang))
                        .map((language) => (
                          <Chip
                            key={language}
                            label={`+ ${language}`}
                            variant="outlined"
                            onClick={() => addLanguage(language)}
                            sx={{ mr: 1, mb: 1, cursor: 'pointer' }}
                          />
                        ))}
                    </Box>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 2 }} icon={<Info />}>
                  Counsellor accounts require admin approval before activation. You will be notified once your account is approved.
                </Alert>
              </>
            )}

            {selectedRole === 'college_head' && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom color="primary">
                  Administrative Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete
                      fullWidth
                      options={collegeOptions}
                      value={formData.college}
                      onChange={(event, newValue) => {
                        updateFormData('college', newValue || '')
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="College/University *"
                          required
                          helperText="Select the institution you are the head of"
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Designation *"
                      value={formData.designation}
                      onChange={(e) => updateFormData('designation', e.target.value)}
                      required
                      placeholder="e.g., Dean, Principal, Vice-Chancellor"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Department *"
                      value={formData.department}
                      onChange={(e) => updateFormData('department', e.target.value)}
                      required
                      placeholder="e.g., Student Affairs, Academic Affairs"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>ID Proof Type</InputLabel>
                      <Select
                        value={formData.idProofType}
                        label="ID Proof Type"
                        onChange={(e) => updateFormData('idProofType', e.target.value)}
                      >
                        <MenuItem value="aadhar">Aadhar Card</MenuItem>
                        <MenuItem value="passport">Passport</MenuItem>
                        <MenuItem value="license">Driving License</MenuItem>
                        <MenuItem value="employee_id">Employee ID</MenuItem>
                        <MenuItem value="pan">PAN Card</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="file"
                      label="Upload ID Proof"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ accept: "image/*,.pdf" }}
                      onChange={(e) => updateFormData('idProofFile', e.target.files[0])}
                      required
                      helperText="Upload clear image or PDF of your ID proof"
                    />
                  </Grid>
                </Grid>

                <Alert severity="warning" sx={{ mt: 2 }} icon={<Info />}>
                  College Head accounts require admin approval and ID verification before activation. You will be notified once your account is approved.
                </Alert>
              </>
            )}

            {/* ID Proof section for Counsellors */}
            {selectedRole === 'counsellor' && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom color="primary">
                  Verification Documents
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>ID Proof Type</InputLabel>
                      <Select
                        value={formData.idProofType}
                        label="ID Proof Type"
                        onChange={(e) => updateFormData('idProofType', e.target.value)}
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
                    <TextField
                      fullWidth
                      type="file"
                      label="Upload ID Proof"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ accept: "image/*,.pdf" }}
                      onChange={(e) => updateFormData('idProofFile', e.target.files[0])}
                      required
                      helperText="Upload clear image or PDF of your ID proof"
                    />
                  </Grid>
                </Grid>
              </>
            )}

            <Box sx={{ mt: 4, display: 'flex', gap: 2, flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  disabled={loading}
                >
                  Back to Login
                </Button>
              </Box>
              
              {/* College Head Registration Link */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Are you a College Head or Administrator?
                </Typography>
                <Button
                  variant="text"
                  onClick={() => navigate('/register/college-head')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Use our dedicated College Head registration process
                </Button>
              </Box>
              
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="text"
                  size="small"
                  onClick={handleTestFirebase}
                  sx={{ alignSelf: 'center' }}
                >
                  Test Firebase Connection
                </Button>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  )
}