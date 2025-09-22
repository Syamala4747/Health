import { useState } from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material'
import {
  Delete,
  Warning,
  CheckCircle,
  Info,
  OpenInNew,
  Person,
  Email
} from '@mui/icons-material'
import { getAuth, deleteUser, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

export default function FirebaseAuthCleaner() {
  const [email, setEmail] = useState('pandu@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleDeleteAuthUser = async () => {
    if (!email || !password) {
      setError('Please provide both email and password to delete the authentication account')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const auth = getAuth()
      
      // First, sign in with the email/password to get access to the user account
      console.log('🔐 Signing in to delete account...')
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      console.log('✅ Signed in successfully, now deleting account...')
      
      // Delete the user account
      await deleteUser(user)
      
      console.log('✅ User account deleted from Firebase Authentication')
      setSuccess(`Successfully deleted Firebase Authentication account for ${email}. You can now register with this email again!`)
      
      // Clear the form
      setEmail('')
      setPassword('')
      
    } catch (error) {
      console.error('❌ Error deleting auth user:', error)
      
      if (error.code === 'auth/user-not-found') {
        setError('No user found with this email in Firebase Authentication')
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password for this email')
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email format')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later')
      } else {
        setError(`Error: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const testRegistration = async () => {
    if (!email) {
      setError('Please provide an email to test registration')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const auth = getAuth()
      
      // Try to create a new account (this will fail if email already exists)
      await createUserWithEmailAndPassword(auth, email, 'testpassword123')
      
      // If we get here, the email was available
      setSuccess(`✅ Email ${email} is now available for registration!`)
      
      // Immediately delete this test account
      const currentUser = auth.currentUser
      if (currentUser) {
        await deleteUser(currentUser)
        console.log('Test account cleaned up')
      }
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError(`❌ Email ${email} is still registered in Firebase Authentication. You need to delete it first.`)
      } else {
        setError(`Test failed: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Firebase Authentication Cleaner
      </Typography>
      
      <Alert severity="error" sx={{ mb: 3 }}>
        <strong>The Problem:</strong> Email "pandu@gmail.com" exists in Firebase Authentication (login system), 
        even though you deleted the profile data from Firestore database. These are separate systems!
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="error">
            🚨 Quick Fix: Delete Authentication Account
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 3 }}>
            To delete the authentication account, we need to sign in with that account first, then delete it.
            This will completely remove the email from Firebase Authentication.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <TextField
              label="Email to Delete"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              type="email"
              helperText="The email that's causing 'already registered' error"
            />
            
            <TextField
              label="Password for this Email"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              type="password"
              helperText="The password you used when registering this email"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
              onClick={handleDeleteAuthUser}
              disabled={loading || !email || !password}
            >
              {loading ? 'Deleting...' : 'Delete Authentication Account'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={testRegistration}
              disabled={loading || !email}
            >
              Test if Email is Available
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alternative: Firebase Console Method
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            If the above doesn't work, you can delete the user directly from Firebase Console:
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <Box sx={{ 
                  backgroundColor: 'primary.main', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.875rem'
                }}>
                  1
                </Box>
              </ListItemIcon>
              <ListItemText primary="Go to Firebase Console" />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Box sx={{ 
                  backgroundColor: 'primary.main', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.875rem'
                }}>
                  2
                </Box>
              </ListItemIcon>
              <ListItemText primary="Click Authentication → Users" />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Box sx={{ 
                  backgroundColor: 'primary.main', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.875rem'
                }}>
                  3
                </Box>
              </ListItemIcon>
              <ListItemText primary="Find 'pandu@gmail.com' and click menu (⋮)" />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Box sx={{ 
                  backgroundColor: 'primary.main', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.875rem'
                }}>
                  4
                </Box>
              </ListItemIcon>
              <ListItemText primary="Select 'Delete user'" />
            </ListItem>
          </List>

          <Button
            variant="outlined"
            startIcon={<OpenInNew />}
            href="https://console.firebase.google.com/"
            target="_blank"
            sx={{ mt: 2 }}
          >
            Open Firebase Console
          </Button>
        </CardContent>
      </Card>

      <Alert severity="info">
        <strong>After Deletion:</strong> Once you delete the authentication account, you'll be able to register with "pandu@gmail.com" again without any errors.
      </Alert>
    </Container>
  )
}