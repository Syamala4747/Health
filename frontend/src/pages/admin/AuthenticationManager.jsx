import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material'
import {
  Delete,
  Refresh,
  Person,
  Email,
  Key,
  Warning
} from '@mui/icons-material'
import { getAuth, deleteUser, createUserWithEmailAndPassword } from 'firebase/auth'
import { httpsCallable, getFunctions } from 'firebase/functions'

export default function AuthenticationManager() {
  const [authUsers, setAuthUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  // This would require Firebase Admin SDK or Cloud Functions to list all users
  const fetchAuthUsers = async () => {
    setLoading(true)
    setError('')
    
    try {
      // You would need to implement a Cloud Function for this
      // For now, we'll show a message about this limitation
      setError('To view all Firebase Authentication users, you need to implement a Cloud Function with Admin SDK. This is a Firebase security limitation.')
    } catch (err) {
      setError('Error fetching authentication users: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (uid, email) => {
    try {
      setLoading(true)
      setError('')
      
      // This would require Cloud Function with Admin SDK
      // For demonstration, showing the process
      setError(`To delete user ${email} (${uid}), you need to use Firebase Admin SDK through a Cloud Function.`)
      
    } catch (err) {
      setError('Error deleting user: ' + err.message)
    } finally {
      setLoading(false)
      setDeleteDialog(false)
    }
  }

  useEffect(() => {
    fetchAuthUsers()
  }, [])

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Firebase Authentication Manager
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Understanding Firebase Authentication vs Firestore:</strong>
        <br />
        • <strong>Firebase Authentication</strong>: Stores email/password credentials (separate system)
        <br />
        • <strong>Firestore Database</strong>: Stores user profile data (what you deleted)
        <br />
        <br />
        When you get "email already registered", it means the email exists in Firebase Authentication, 
        even if you deleted the profile from Firestore.
      </Alert>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Solution for "Email Already Registered" Error:</strong>
        <br />
        1. Go to <strong>Firebase Console</strong> → <strong>Authentication</strong> → <strong>Users</strong>
        <br />
        2. Find the email "pandu@gmail.com" in the users list
        <br />
        3. Click the menu (⋮) next to the user and select <strong>"Delete user"</strong>
        <br />
        4. Now you can register with that email again
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How to Check Firebase Authentication Users
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Method 1: Firebase Console (Easiest)
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              1. Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a>
              <br />
              2. Select your project
              <br />
              3. Click "Authentication" in the left sidebar
              <br />
              4. Click "Users" tab
              <br />
              5. You'll see all registered users with their emails and UIDs
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="secondary" gutterBottom>
              Method 2: Cloud Function (For App Integration)
            </Typography>
            <Typography variant="body2">
              To manage authentication users from your app, you need to create a Cloud Function with Firebase Admin SDK.
              This is a security requirement - client apps cannot list all authentication users.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current User Check (Your Account)
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Person />}
            onClick={() => {
              const auth = getAuth()
              const currentUser = auth.currentUser
              if (currentUser) {
                setSuccess(`Current user: ${currentUser.email} (UID: ${currentUser.uid})`)
              } else {
                setError('No user currently logged in')
              }
            }}
          >
            Check Current User
          </Button>
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
    </Container>
  )
}