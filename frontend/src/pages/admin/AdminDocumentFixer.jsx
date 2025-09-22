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
  Divider
} from '@mui/material'
import {
  Person,
  Add,
  CheckCircle,
  Warning,
  AdminPanelSettings
} from '@mui/icons-material'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../../config/firebase.js'
import { getAuth } from 'firebase/auth'

export default function AdminDocumentFixer() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [adminData, setAdminData] = useState({
    name: 'System Admin',
    email: 'admin@zencare.app',
    uid: '56D6MtYaU8cticqSviIVJ4fmWnh2'
  })

  const handleCreateAdminDocument = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { name, email, uid } = adminData

      if (!name || !email || !uid) {
        setError('Please fill in all fields')
        return
      }

      console.log('🔧 Creating admin document...')

      // First check if document already exists
      const adminDocRef = doc(db, 'users', uid)
      const existingDoc = await getDoc(adminDocRef)

      if (existingDoc.exists()) {
        setError(`Admin document already exists for UID: ${uid}`)
        return
      }

      // Create admin document in users collection
      const adminDocument = {
        uid,
        email,
        name,
        role: 'admin',
        approved: true,
        blocked: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: ['all'],
        profileCompleted: true
      }

      await setDoc(adminDocRef, adminDocument)

      console.log('✅ Admin document created successfully')
      setSuccess(`Admin document created successfully for ${email}! You can now log in without errors.`)

    } catch (err) {
      console.error('❌ Error creating admin document:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckCurrentUser = () => {
    const auth = getAuth()
    const currentUser = auth.currentUser

    if (currentUser) {
      setAdminData({
        name: currentUser.displayName || 'System Admin',
        email: currentUser.email,
        uid: currentUser.uid
      })
      setSuccess(`Found current user: ${currentUser.email} (UID: ${currentUser.uid})`)
    } else {
      setError('No user currently logged in')
    }
  }

  const handleCheckAdminDocument = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { uid } = adminData

      if (!uid) {
        setError('Please provide UID to check')
        return
      }

      // Check users collection
      const userDocRef = doc(db, 'users', uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        setSuccess(`✅ Admin document found in users collection: ${JSON.stringify(userData, null, 2)}`)
      } else {
        // Check counsellors collection too
        const counsellorDocRef = doc(db, 'counsellors', uid)
        const counsellorDoc = await getDoc(counsellorDocRef)

        if (counsellorDoc.exists()) {
          const counsellorData = counsellorDoc.data()
          setSuccess(`Found in counsellors collection: ${JSON.stringify(counsellorData, null, 2)}`)
        } else {
          setError(`❌ No document found in any collection for UID: ${uid}`)
        }
      }

    } catch (err) {
      setError(`Error checking document: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Document Fixer
      </Typography>
      
      <Alert severity="error" sx={{ mb: 3 }}>
        <strong>Problem:</strong> Admin user exists in Firebase Authentication but has no document in Firestore database.
        <br />
        <strong>UID:</strong> 56D6MtYaU8cticqSviIVJ4fmWnh2
        <br />
        <strong>Email:</strong> admin@zencare.app
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔧 Create Missing Admin Document
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <TextField
              label="Admin Name"
              value={adminData.name}
              onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
              fullWidth
            />
            
            <TextField
              label="Admin Email"
              value={adminData.email}
              onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
              fullWidth
              type="email"
            />
            
            <TextField
              label="Admin UID"
              value={adminData.uid}
              onChange={(e) => setAdminData({ ...adminData, uid: e.target.value })}
              fullWidth
              helperText="The UID from Firebase Authentication"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Add />}
              onClick={handleCreateAdminDocument}
              disabled={loading}
            >
              Create Admin Document
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={handleCheckAdminDocument}
              disabled={loading}
            >
              Check Document Exists
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Person />}
              onClick={handleCheckCurrentUser}
            >
              Get Current User Info
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }} style={{ whiteSpace: 'pre-wrap' }}>
              {success}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 What This Will Create
          </Typography>
          
          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <Typography variant="body2" component="pre" style={{ fontSize: '0.875rem' }}>
{`{
  "uid": "${adminData.uid}",
  "email": "${adminData.email}",
  "name": "${adminData.name}",
  "role": "admin",
  "approved": true,
  "blocked": false,
  "isActive": true,
  "createdAt": "2025-09-21T...",
  "updatedAt": "2025-09-21T...",
  "permissions": ["all"],
  "profileCompleted": true
}`}
            </Typography>
          </Paper>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            This document will be created in the <strong>users</strong> collection with the UID as the document ID.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  )
}