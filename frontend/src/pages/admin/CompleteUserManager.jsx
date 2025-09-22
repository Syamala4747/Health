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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material'
import {
  Delete,
  Warning,
  CheckCircle,
  Error,
  Info,
  CleaningServices,
  Security
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext.js'

export default function CompleteUserManager() {
  const { user } = useAuth()
  const [userId, setUserId] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cleanupResults, setCleanupResults] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [cleanupDialog, setCleanupDialog] = useState(false)

  const handleCompleteDelete = async () => {
    if (!userId.trim()) {
      setError('Please enter a User ID')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setResults(null)

    try {
      const token = await user.getIdToken()
      
      const response = await fetch(`/api/admin/users/${userId}/complete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('✅ User completely deleted from both systems!')
        setResults(data.results)
        setUserId('') // Clear the input
        setReason('')
      } else {
        setError(`❌ Deletion failed: ${data.message}`)
        if (data.error) {
          console.error('Deletion errors:', data.error)
        }
      }

    } catch (err) {
      setError(`❌ Network error: ${err.message}`)
    } finally {
      setLoading(false)
      setConfirmDialog(false)
    }
  }

  const handleCleanup = async (dryRun = true) => {
    setLoading(true)
    setError('')
    setCleanupResults(null)

    try {
      const token = await user.getIdToken()
      
      const response = await fetch('/api/admin/cleanup/auth-firestore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dryRun })
      })

      const data = await response.json()

      if (data.success) {
        setCleanupResults(data)
        if (!dryRun) {
          setSuccess('✅ Cleanup completed successfully!')
        }
      } else {
        setError(`❌ Cleanup failed: ${data.message}`)
      }

    } catch (err) {
      setError(`❌ Network error: ${err.message}`)
    } finally {
      setLoading(false)
      setCleanupDialog(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Complete User Management
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Powerful Admin Tool:</strong> This deletes users from BOTH Firebase Authentication and Firestore Database simultaneously.
      </Alert>

      <Grid container spacing={3}>
        {/* Individual User Deletion */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🗑️ Complete User Deletion
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This will delete the user from both Firebase Authentication and all Firestore collections.
              </Typography>

              <TextField
                fullWidth
                label="User ID (UID)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter the Firebase UID"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Reason for Deletion"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you deleting this user?"
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                color="error"
                startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
                onClick={() => setConfirmDialog(true)}
                disabled={loading || !userId.trim()}
                fullWidth
              >
                Delete User Completely
              </Button>

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

              {results && (
                <Paper sx={{ p: 2, mt: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Deletion Results:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {results.authDeleted && (
                      <Chip 
                        icon={<CheckCircle />} 
                        label="Auth Deleted" 
                        color="success" 
                        size="small" 
                      />
                    )}
                    {results.firestoreCollectionsDeleted.map(collection => (
                      <Chip 
                        key={collection}
                        icon={<CheckCircle />} 
                        label={`${collection} deleted`} 
                        color="primary" 
                        size="small" 
                      />
                    ))}
                  </Box>
                  
                  <Typography variant="body2">
                    <strong>Email:</strong> {results.userEmail || 'Unknown'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Operations:</strong> {results.totalOperations}
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Bulk Cleanup */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🧹 Bulk Cleanup
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Find and fix orphaned records where Auth and Firestore don't match.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Info />}
                  onClick={() => handleCleanup(true)}
                  disabled={loading}
                >
                  Analyze (Dry Run)
                </Button>

                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<CleaningServices />}
                  onClick={() => setCleanupDialog(true)}
                  disabled={loading}
                >
                  Clean Up Orphaned Records
                </Button>
              </Box>

              {cleanupResults && (
                <Paper sx={{ p: 2, mt: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cleanup Analysis:
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={4}>
                      <Typography variant="body2" align="center">
                        <strong>{cleanupResults.analysis.totalAuthUsers}</strong><br />
                        Auth Users
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" align="center">
                        <strong>{cleanupResults.analysis.totalFirestoreUsers}</strong><br />
                        Students
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" align="center">
                        <strong>{cleanupResults.analysis.totalFirestoreCounsellors}</strong><br />
                        Counsellors
                      </Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" gutterBottom color="warning.main">
                    Issues Found:
                  </Typography>
                  
                  <List dense>
                    {cleanupResults.analysis.orphanedAuthUsers > 0 && (
                      <ListItem>
                        <ListItemIcon><Warning color="warning" /></ListItemIcon>
                        <ListItemText 
                          primary={`${cleanupResults.analysis.orphanedAuthUsers} orphaned auth accounts`}
                          secondary="Auth exists but no profile data"
                        />
                      </ListItem>
                    )}
                    
                    {cleanupResults.analysis.orphanedFirestoreUsers > 0 && (
                      <ListItem>
                        <ListItemIcon><Warning color="warning" /></ListItemIcon>
                        <ListItemText 
                          primary={`${cleanupResults.analysis.orphanedFirestoreUsers} orphaned student profiles`}
                          secondary="Profile exists but no auth account"
                        />
                      </ListItem>
                    )}
                    
                    {cleanupResults.analysis.orphanedFirestoreCounsellors > 0 && (
                      <ListItem>
                        <ListItemIcon><Warning color="warning" /></ListItemIcon>
                        <ListItemText 
                          primary={`${cleanupResults.analysis.orphanedFirestoreCounsellors} orphaned counsellor profiles`}
                          secondary="Profile exists but no auth account"
                        />
                      </ListItem>
                    )}
                    
                    {cleanupResults.analysis.orphanedAuthUsers === 0 && 
                     cleanupResults.analysis.orphanedFirestoreUsers === 0 && 
                     cleanupResults.analysis.orphanedFirestoreCounsellors === 0 && (
                      <ListItem>
                        <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                        <ListItemText primary="No orphaned records found!" />
                      </ListItem>
                    )}
                  </List>

                  {cleanupResults.cleanupResults && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom color="success.main">
                        Cleanup Results:
                      </Typography>
                      <Typography variant="body2">
                        • {cleanupResults.cleanupResults.authUsersDeleted} auth accounts deleted<br />
                        • {cleanupResults.cleanupResults.firestoreUsersDeleted} student profiles deleted<br />
                        • {cleanupResults.cleanupResults.firestoreCounsellorsDeleted} counsellor profiles deleted
                      </Typography>
                    </>
                  )}
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confirmation Dialog for Individual Deletion */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>
          <Warning color="error" sx={{ mr: 1, verticalAlign: 'middle' }} />
          Confirm Complete User Deletion
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to completely delete user <strong>{userId}</strong>?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            This will:
            • Delete from Firebase Authentication
            • Delete from all Firestore collections
            • Delete related reports and data
            • Cannot be undone
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCompleteDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Bulk Cleanup */}
      <Dialog open={cleanupDialog} onClose={() => setCleanupDialog(false)}>
        <DialogTitle>
          <CleaningServices color="warning" sx={{ mr: 1, verticalAlign: 'middle' }} />
          Confirm Bulk Cleanup
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clean up orphaned records?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            This will automatically delete records that don't have matching pairs between 
            Firebase Authentication and Firestore. Run an analysis first to see what will be affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => handleCleanup(false)} 
            color="warning" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Cleaning...' : 'Clean Up Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}