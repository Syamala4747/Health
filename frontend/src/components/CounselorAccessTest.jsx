import { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  TextField
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext.jsx'
import { testCounselorLogin, createTestCounselor } from '../utils/counselorLoginTest.js'
import toast from 'react-hot-toast'

export default function CounselorAccessTest() {
  const { user, getUserRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [email, setEmail] = useState('test.counselor@example.com')

  const handleTestSystem = async () => {
    setLoading(true)
    try {
      const results = await testCounselorLogin()
      setTestResults(results)
      
      if (results.success) {
        toast.success('System test completed successfully!')
      } else {
        toast.error('System test failed: ' + results.error)
      }
    } catch (error) {
      toast.error('Error running test: ' + error.message)
      setTestResults({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleTestCurrentUser = async () => {
    if (!user) {
      toast.error('No user logged in')
      return
    }

    setLoading(true)
    try {
      console.log('🔍 Testing current user role:', user.uid)
      const role = await getUserRole(user.uid)
      console.log('✅ Current user role:', role)
      
      toast.success(`Current user role: ${typeof role === 'string' ? role : role?.role || 'unknown'}`)
      setTestResults({
        success: true,
        currentUser: {
          uid: user.uid,
          email: user.email,
          role: typeof role === 'string' ? role : role?.role
        }
      })
    } catch (error) {
      console.error('❌ Error testing current user:', error)
      toast.error('Error testing user: ' + error.message)
      setTestResults({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTestCounselor = async () => {
    setLoading(true)
    try {
      await createTestCounselor()
      toast.success('Test counselor created! You need to create this user in Firebase Auth.')
    } catch (error) {
      toast.error('Error creating test counselor: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDirectNavigation = () => {
    window.location.href = '/counsellor'
  }

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Paper sx={{ p: 3, m: 2, border: '2px solid red' }}>
      <Typography variant="h6" gutterBottom color="error.main">
        🔧 Counselor Access Test Tool
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 2 }}>
        This tool helps debug counselor dashboard access issues in development mode.
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleTestSystem}
          disabled={loading}
          color="primary"
        >
          Test Counselor System
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleTestCurrentUser}
          disabled={loading || !user}
          color="secondary"
        >
          Test Current User Role
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleCreateTestCounselor}
          disabled={loading}
          color="warning"
        >
          Create Test Counselor
        </Button>
        
        <Button
          variant="contained"
          onClick={handleDirectNavigation}
          color="error"
        >
          Force Navigate to Counselor Dashboard
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {testResults && (
        <Alert severity={testResults.success ? 'success' : 'error'} sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Test Results:</Typography>
          <pre style={{ fontSize: '12px', marginTop: '8px' }}>
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </Alert>
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Quick Debug Steps:</strong><br />
          1. Click "Test Counselor System" to check database<br />
          2. Click "Test Current User Role" if logged in<br />
          3. Click "Create Test Counselor" to add test data<br />
          4. Click "Force Navigate" to bypass protection<br />
          5. Check browser console for detailed logs
        </Typography>
      </Alert>
    </Paper>
  )
}