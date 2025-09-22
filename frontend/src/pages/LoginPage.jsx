import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  AdminPanelSettings,
  Psychology,
  School,
  Business,
} from '@mui/icons-material'

import { useAuth } from '../contexts/AuthContext.jsx'
import { setupAdminUser } from '../utils/adminSetup.js'
import { auth } from '../config/firebase.js'
import toast from 'react-hot-toast'

const roles = [
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Manage the platform',
    icon: <AdminPanelSettings sx={{ fontSize: 40 }} />,
    color: '#7c3aed',
  },
  {
    id: 'college_head',
    title: 'College Head',
    description: 'Manage college counsellors and students',
    icon: <Business sx={{ fontSize: 40 }} />,
    color: '#f59e0b',
  },
  {
    id: 'counsellor',
    title: 'Counsellor',
    description: 'Support students',
    icon: <Psychology sx={{ fontSize: 40 }} />,
    color: '#06b6d4',
  },
  {
    id: 'student',
    title: 'Student',
    description: 'Access wellness resources',
    icon: <School sx={{ fontSize: 40 }} />,
    color: '#10b981',
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  
  const { user, userRole, login, clearRoleCache } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Initialize admin user on component mount (document creation only, no sign-in)
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        console.log('🔧 Checking admin user setup...')
        const result = await setupAdminUser()
        if (result) {
          console.log('✅ Admin user document ensured in database')
        } else {
          console.log('ℹ️ Admin user setup skipped')
        }
      } catch (error) {
        console.warn('⚠️ Admin initialization failed:', error.message)
      }
    }
    
    // Only run admin setup if we're not already signed in
    const currentUser = auth.currentUser
    if (!currentUser) {
      initializeAdmin()
    }
  }, [])

  // If user is already logged in, let App.jsx handle the redirect
  // No need for navigation logic here

  const handleRoleSelect = (role) => {
    setSelectedRole(role.id)
    setShowForm(true)
    
    // Pre-fill credentials for testing (matching actual user accounts)
    if (role.id === 'admin') {
      setEmail('admin@zencare.app')
      setPassword('ZenCare2024!')
    } else if (role.id === 'college_head') {
      setEmail('dean@gmail.com')
      setPassword('Dean@123')
    } else if (role.id === 'counsellor') {
      setEmail('geethika@gmail.com')
      setPassword('Counsellor@123')
    } else if (role.id === 'student') {
      setEmail('syamala4747@gmail.com')
      setPassword('Student@123')
    } else {
      setEmail('')
      setPassword('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🚀 Starting login process...')
      
      // Special handling for admin login - try to create admin if it doesn't exist
      if (email === 'admin@zencare.app') {
        try {
          console.log('🔧 Ensuring admin user exists...')
          const result = await setupAdminUser()
          if (result) {
            console.log('✅ Admin user setup completed')
          }
        } catch (setupError) {
          console.log('⚠️ Admin setup had an issue, continuing with login attempt:', setupError.message)
        }
      }
      
      const user = await login(email, password)
      toast.success('Login successful! Redirecting...')
      console.log('🎯 Login completed, redirecting to dashboard...')
      
      // Explicit redirect to dashboard which will then determine role
      navigate('/dashboard')
      } catch (error) {
      let errorMessage = 'Failed to login. Please check your credentials.'
      
      // Handle custom approval/access messages first
      if (error.message && (
        error.message.includes('not approved') || 
        error.message.includes('pending approval') ||
        error.message.includes('blocked') ||
        error.message.includes('Access denied')
      )) {
        errorMessage = error.message
      } else if (error.code === 'auth/user-not-found') {
         errorMessage = 'No account found with this email address.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.'
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.'
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please wait a moment and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      
      // Show different toast messages for approval issues
      if (errorMessage.includes('not approved') || errorMessage.includes('pending approval')) {
        toast.error('Account Pending Approval')
      } else if (errorMessage.includes('blocked')) {
        toast.error('Account Blocked')
      } else {
        toast.error('Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" component="h1" gutterBottom color="primary">
            ZenCare Platform
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Select your role to continue
          </Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          {roles.map((role) => (
            <Grid item xs={12} sm={6} md={3} key={role.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => handleRoleSelect(role)}
                  sx={{ height: '100%', p: 3 }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        bgcolor: role.color,
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      {role.icon}
                    </Avatar>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {role.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {role.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box textAlign="center" mt={4}>
          <Typography variant="body2" color="text.secondary">
            Select your role to access the appropriate dashboard
          </Typography>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/register')}
                sx={{ textTransform: 'none' }}
              >
                Sign up here
              </Button>
            </Typography>
          </Box>
          
          {/* Development Helper */}
          <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Development Mode - Test Credentials
            </Typography>
            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
              Admin: admin@zencare.app / ZenCare2024!
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={async () => {
                try {
                  const result = await setupAdminUser()
                  if (result) {
                    toast.success('Admin user created successfully!')
                  } else {
                    toast.info('Admin user already exists or setup skipped')
                  }
                } catch (error) {
                  toast.error(`Setup failed: ${error.message}`)
                }
              }}
              sx={{ mr: 1, mb: 1 }}
            >
              Setup Admin
            </Button>
          </Box>
        </Box>


      </Container>
    )
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" color="primary" gutterBottom>
              {roles.find(r => r.id === selectedRole)?.title} Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to access your dashboard
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing In & Loading Dashboard...' : 'Sign In'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setShowForm(false)}
              sx={{ mt: 1 }}
            >
              Back to Role Selection
            </Button>
            
            <Box textAlign="center" mt={2}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/register')}
                  sx={{ textTransform: 'none' }}
                >
                  Sign up here
                </Button>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}