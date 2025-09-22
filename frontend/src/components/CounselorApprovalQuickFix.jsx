import { useState } from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material'
import { tempApproveCounselor, debugCounselorLogin, listAllCounselors } from '../utils/counselorDebugHelper.js'
import toast from 'react-hot-toast'

export default function CounselorApprovalQuickFix() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)

  const handleDebug = async () => {
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    setLoading(true)
    try {
      const result = await debugCounselorLogin(email)
      setDebugInfo(result)
      
      if (result.found) {
        toast.success('Counselor found in database')
      } else {
        toast.error('Counselor not found')
      }
    } catch (error) {
      toast.error('Error debugging counselor: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    setLoading(true)
    try {
      const result = await tempApproveCounselor(email)
      
      if (result.success) {
        toast.success('Counselor approved successfully!')
        // Refresh debug info
        handleDebug()
      } else {
        toast.error(result.message || 'Failed to approve counselor')
      }
    } catch (error) {
      toast.error('Error approving counselor: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleListAll = async () => {
    setLoading(true)
    try {
      const result = await listAllCounselors()
      
      if (result.success) {
        console.table(result.counselors)
        toast.success(`Found ${result.counselors.length} counselors. Check console for details.`)
      } else {
        toast.error('Failed to list counselors')
      }
    } catch (error) {
      toast.error('Error listing counselors: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Paper sx={{ p: 3, m: 2, border: '2px solid orange' }}>
      <Typography variant="h6" gutterBottom color="warning.main">
        🔧 Development Tool: Counselor Approval Quick Fix
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 2 }}>
        This tool is only available in development mode to help debug counselor login issues.
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          label="Counselor Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="counselor@example.com"
          size="small"
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="outlined"
          onClick={handleDebug}
          disabled={loading}
          size="small"
        >
          Debug
        </Button>
        <Button
          variant="contained"
          onClick={handleApprove}
          disabled={loading}
          size="small"
          color="warning"
        >
          Approve
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          onClick={handleListAll}
          disabled={loading}
          size="small"
          fullWidth
        >
          List All Counselors
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {debugInfo && (
        <Alert severity={debugInfo.found ? 'success' : 'error'} sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Debug Results:</Typography>
          {debugInfo.found ? (
            <Box>
              <Typography variant="body2">✅ Counselor found</Typography>
              <Typography variant="body2">📧 Email: {debugInfo.data.email}</Typography>
              <Typography variant="body2">👤 Name: {debugInfo.data.name}</Typography>
              <Typography variant="body2">✅ Approved: {debugInfo.approved ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2">🚫 Blocked: {debugInfo.blocked ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2">🏫 College: {debugInfo.data.college?.name || debugInfo.data.collegeName || 'Unknown'}</Typography>
            </Box>
          ) : (
            <Typography variant="body2">❌ {debugInfo.message}</Typography>
          )}
        </Alert>
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Quick Steps:</strong><br />
          1. Enter counselor email and click "Debug" to check status<br />
          2. If found but not approved, click "Approve" to enable access<br />
          3. Use "List All Counselors" to see all counselors in console<br />
          4. Try logging in with the counselor account
        </Typography>
      </Alert>
    </Paper>
  )
}