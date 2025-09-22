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
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid
} from '@mui/material'
import {
  Search,
  Delete,
  Refresh,
  Warning,
  Info,
  CheckCircle
} from '@mui/icons-material'
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  deleteUser,
  createUserWithEmailAndPassword 
} from 'firebase/auth'
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc 
} from 'firebase/firestore'
import { db } from '../../config/firebase.js'

export default function DataLocationChecker() {
  const [email, setEmail] = useState('pandu@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const checkDataLocations = async () => {
    if (!email) {
      setError('Please enter an email to check')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setResults(null)

    try {
      const auth = getAuth()
      let authUserExists = false
      let authUID = null

      // Step 1: Check Firebase Authentication
      try {
        // Try to create account to see if email is available
        await createUserWithEmailAndPassword(auth, email, 'temppassword123')
        
        // If we get here, email was available - clean up immediately
        const currentUser = auth.currentUser
        if (currentUser) {
          await deleteUser(currentUser)
        }
        authUserExists = false
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          authUserExists = true
          console.log('Email exists in Firebase Authentication')
        }
      }

      // Step 2: If auth user exists, try to get their UID
      if (authUserExists && password) {
        try {
          const result = await signInWithEmailAndPassword(auth, email, password)
          authUID = result.user.uid
          console.log('Successfully signed in, UID:', authUID)
          
          // Sign out immediately
          await auth.signOut()
        } catch (signInError) {
          console.log('Could not sign in to get UID:', signInError.code)
        }
      }

      // Step 3: Check Firestore collections
      const firestoreResults = {
        usersCollection: null,
        counsellorsCollection: null
      }

      // Check users collection by email
      try {
        const usersQuery = query(collection(db, 'users'), where('email', '==', email))
        const usersSnapshot = await getDocs(usersQuery)
        
        if (!usersSnapshot.empty) {
          firestoreResults.usersCollection = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        }
      } catch (err) {
        console.error('Error checking users collection:', err)
      }

      // Check counsellors collection by email
      try {
        const counsellorsQuery = query(collection(db, 'counsellors'), where('email', '==', email))
        const counsellorsSnapshot = await getDocs(counsellorsQuery)
        
        if (!counsellorsSnapshot.empty) {
          firestoreResults.counsellorsCollection = counsellorsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        }
      } catch (err) {
        console.error('Error checking counsellors collection:', err)
      }

      // If we have UID, also check by UID
      if (authUID) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUID))
          if (userDoc.exists() && !firestoreResults.usersCollection) {
            firestoreResults.usersCollection = [{ id: userDoc.id, ...userDoc.data() }]
          }
        } catch (err) {
          console.error('Error checking users by UID:', err)
        }

        try {
          const counsellorDoc = await getDoc(doc(db, 'counsellors', authUID))
          if (counsellorDoc.exists() && !firestoreResults.counsellorsCollection) {
            firestoreResults.counsellorsCollection = [{ id: counsellorDoc.id, ...counsellorDoc.data() }]
          }
        } catch (err) {
          console.error('Error checking counsellors by UID:', err)
        }
      }

      setResults({
        email,
        authUserExists,
        authUID,
        firestore: firestoreResults
      })

    } catch (err) {
      setError(`Error checking data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteAuthUser = async () => {
    if (!email || !password) {
      setError('Please provide email and password to delete auth user')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const auth = getAuth()
      
      // Sign in first
      const result = await signInWithEmailAndPassword(auth, email, password)
      
      // Delete the user
      await deleteUser(result.user)
      
      setSuccess(`✅ Successfully deleted ${email} from Firebase Authentication!`)
      
      // Refresh the check
      setTimeout(() => {
        checkDataLocations()
      }, 1000)
      
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password')
      } else if (err.code === 'auth/user-not-found') {
        setError('User not found in Firebase Authentication')
      } else {
        setError(`Error: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Data Location Checker & Cleaner
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This tool shows you exactly where your data is stored and helps you clean it up.
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Check Email Location
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email to Check"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password (for deletion)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                helperText="Only needed if you want to delete the auth user"
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Search />}
              onClick={checkDataLocations}
              disabled={loading}
            >
              Check Data Locations
            </Button>
            
            {results?.authUserExists && (
              <Button
                variant="contained"
                color="error"
                startIcon={<Delete />}
                onClick={deleteAuthUser}
                disabled={loading || !password}
              >
                Delete from Firebase Auth
              </Button>
            )}
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

      {results && (
        <Grid container spacing={3}>
          {/* Firebase Authentication Results */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                🔐 Firebase Authentication
              </Typography>
              
              {results.authUserExists ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>FOUND:</strong> Email exists in Firebase Authentication
                  {results.authUID && (
                    <><br />UID: {results.authUID}</>
                  )}
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <strong>CLEAR:</strong> Email not found in Firebase Authentication
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary">
                This is where login credentials are stored. If this shows "FOUND", 
                it's why you get "email already in use" errors.
              </Typography>
            </Paper>
          </Grid>

          {/* Firestore Results */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📊 Firestore Database
              </Typography>
              
              {/* Users Collection */}
              <Typography variant="subtitle2" gutterBottom>
                Users Collection:
              </Typography>
              {results.firestore.usersCollection ? (
                <Alert severity="info" sx={{ mb: 1 }}>
                  Found {results.firestore.usersCollection.length} document(s)
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 1 }}>
                  No documents found
                </Alert>
              )}

              {/* Counsellors Collection */}
              <Typography variant="subtitle2" gutterBottom>
                Counsellors Collection:
              </Typography>
              {results.firestore.counsellorsCollection ? (
                <Alert severity="info" sx={{ mb: 1 }}>
                  Found {results.firestore.counsellorsCollection.length} document(s)
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 1 }}>
                  No documents found
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary">
                This is where profile data is stored. This is probably what you deleted.
              </Typography>
            </Paper>
          </Grid>

          {/* Detailed Data */}
          {(results.firestore.usersCollection || results.firestore.counsellorsCollection) && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📋 Found Data Details
                </Typography>
                
                {results.firestore.usersCollection && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Users Collection Data:
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: 'grey.50', mb: 2 }}>
                      <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>
                        {JSON.stringify(results.firestore.usersCollection, null, 2)}
                      </pre>
                    </Paper>
                  </>
                )}
                
                {results.firestore.counsellorsCollection && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Counsellors Collection Data:
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                      <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>
                        {JSON.stringify(results.firestore.counsellorsCollection, null, 2)}
                      </pre>
                    </Paper>
                  </>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  )
}