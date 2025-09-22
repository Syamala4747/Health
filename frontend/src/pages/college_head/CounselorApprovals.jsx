import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Container,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  Visibility,
  Psychology,
  Email,
  Phone,
  LocationOn,
  Description,
  AttachFile,
  Person,
  Business,
  Refresh,
  School
} from '@mui/icons-material'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function CounselorApprovals() {
  const theme = useTheme()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [pendingRequests, setPendingRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState('') // 'approve' or 'reject'
  const [actionReason, setActionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [userCollege, setUserCollege] = useState(null)

  const fetchUserCollege = async () => {
    try {
      // Get current user's college information
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', user.email),
        where('role', '==', 'college_head')
      )
      
      const userSnapshot = await getDocs(userQuery)
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data()
        setUserCollege(userData.college)
        return userData.college
      }
      return null
    } catch (error) {
      console.error('Error fetching user college:', error)
      return null
    }
  }

  const fetchPendingRequests = async () => {
    try {
      setLoading(true)
      
      // First get the college information
      const college = await fetchUserCollege()
      if (!college) {
        toast.error('Unable to determine your college affiliation')
        return
      }
      
      // Query for pending counselor requests from the same college
      const q = query(
        collection(db, 'counselor_requests'),
        where('status', '==', 'pending'),
        where('collegeId', '==', college.id)
      )
      
      const querySnapshot = await getDocs(q)
      const requests = []
      
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      // Sort by creation date (newest first)
      requests.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())
      
      setPendingRequests(requests)
    } catch (error) {
      console.error('Error fetching pending requests:', error)
      toast.error('Failed to load pending requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.email) {
      fetchPendingRequests()
    }
  }, [user])

  const handleViewRequest = (request) => {
    setSelectedRequest(request)
    setViewDialogOpen(true)
  }

  const handleActionClick = (request, action) => {
    setSelectedRequest(request)
    setActionType(action)
    setActionReason('')
    setActionDialogOpen(true)
  }

  const handleProcessAction = async () => {
    if (!selectedRequest || !actionType) return
    
    try {
      setProcessing(true)
      
      const approved = actionType === 'approve'
      
      // Update the request status
      await updateDoc(doc(db, 'counselor_requests', selectedRequest.id), {
        status: approved ? 'approved' : 'rejected',
        processedAt: serverTimestamp(),
        processedBy: user.uid,
        collegeHeadNotes: actionReason,
        updatedAt: serverTimestamp()
      })
      
      if (approved) {
        // Create user account in users collection
        await addDoc(collection(db, 'users'), {
          email: selectedRequest.email,
          role: 'counselor',
          approved: true,
          blocked: false,
          profile: {
            firstName: selectedRequest.firstName,
            lastName: selectedRequest.lastName,
            phone: selectedRequest.phone,
            specialization: selectedRequest.specialization,
            experience: selectedRequest.experience,
            qualifications: selectedRequest.qualifications,
            languages: selectedRequest.languages
          },
          college: {
            id: selectedRequest.collegeId,
            name: selectedRequest.collegeName,
            code: selectedRequest.collegeCode
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          approvedAt: serverTimestamp(),
          approvedBy: user.uid
        })
        
        // Create notification for approved user
        await addDoc(collection(db, 'notifications'), {
          userId: selectedRequest.userId || selectedRequest.email,
          type: 'counselor_approved',
          title: 'Counselor Account Approved!',
          message: 'Your counselor account has been approved by your College Head. You can now login and start providing counseling services.',
          read: false,
          createdAt: serverTimestamp()
        })
        
        toast.success('Counselor request approved successfully!')
      } else {
        // Create notification for rejected user
        await addDoc(collection(db, 'notifications'), {
          userId: selectedRequest.userId || selectedRequest.email,
          type: 'counselor_rejected',
          title: 'Counselor Application Update',
          message: `Your counselor application was not approved by your College Head. ${actionReason || 'Please contact your college administration for more information.'}`,
          read: false,
          createdAt: serverTimestamp()
        })
        
        toast.success('Counselor request rejected')
      }
      
      // Refresh the list
      await fetchPendingRequests()
      
      // Close dialogs
      setActionDialogOpen(false)
      setViewDialogOpen(false)
      
    } catch (error) {
      console.error('Error processing request:', error)
      toast.error('Failed to process request')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return theme.palette.warning.main
      case 'approved': return theme.palette.success.main
      case 'rejected': return theme.palette.error.main
      default: return theme.palette.grey[500]
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={48} />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Counselor Approvals
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchPendingRequests}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Review and approve counselor applications for {userCollege?.name || 'your college'}
        </Typography>
      </Box>

      {/* Stats Card */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Pending Counselor Applications
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {pendingRequests.length} counselor{pendingRequests.length !== 1 ? 's' : ''} waiting for your approval
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="h2" sx={{ fontWeight: 700, opacity: 0.9 }}>
              {pendingRequests.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Requests List */}
      {pendingRequests.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Psychology sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No Pending Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All counselor requests have been processed
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell sx={{ fontWeight: 600 }}>Counselor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Specialization</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Experience</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Languages</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingRequests.map((request) => (
                <TableRow 
                  key={request.id}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.primary.main, 0.02) 
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: theme.palette.primary.main,
                          width: 40,
                          height: 40
                        }}
                      >
                        <Psychology />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {request.firstName} {request.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {request.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {request.specialization}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {request.experience}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {request.languages?.slice(0, 2).map((language) => (
                        <Chip 
                          key={language}
                          label={language} 
                          size="small"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                      {request.languages?.length > 2 && (
                        <Chip 
                          label={`+${request.languages.length - 2}`} 
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {request.createdAt?.toDate().toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewRequest(request)}
                          sx={{ 
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) }
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Approve">
                        <IconButton
                          size="small"
                          onClick={() => handleActionClick(request, 'approve')}
                          sx={{ 
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) }
                          }}
                        >
                          <CheckCircle fontSize="small" sx={{ color: theme.palette.success.main }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton
                          size="small"
                          onClick={() => handleActionClick(request, 'reject')}
                          sx={{ 
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                          }}
                        >
                          <Cancel fontSize="small" sx={{ color: theme.palette.error.main }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Request Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Counselor Application Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                {/* Personal Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Personal Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">First Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRequest.firstName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Last Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRequest.lastName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRequest.email}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRequest.phone || 'Not provided'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Professional Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Professional Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Specialization</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRequest.specialization}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Experience</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRequest.experience}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Languages</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {selectedRequest.languages?.map((language) => (
                          <Chip key={language} label={language} size="small" />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Qualifications</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {selectedRequest.qualifications?.map((qualification, index) => (
                          <Chip key={index} label={qualification} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>

                {/* College Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    College Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">College Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRequest.collegeName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">College Code</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRequest.collegeCode}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">College ID</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRequest.collegeId}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {/* ID Proof */}
                {selectedRequest.idProofUrl && (
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      ID Proof Document
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AttachFile />}
                      href={selectedRequest.idProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View ID Proof ({selectedRequest.idProofType})
                    </Button>
                  </Grid>
                )}

                {/* Request Metadata */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Application Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Submitted</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRequest.createdAt?.toDate().toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={selectedRequest.status}
                        size="small"
                        sx={{
                          bgcolor: alpha(getStatusColor(selectedRequest.status), 0.1),
                          color: getStatusColor(selectedRequest.status),
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
          {selectedRequest?.status === 'pending' && (
            <>
              <Button
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={() => {
                  setViewDialogOpen(false)
                  handleActionClick(selectedRequest, 'approve')
                }}
                sx={{ 
                  bgcolor: theme.palette.success.main,
                  '&:hover': { bgcolor: theme.palette.success.dark }
                }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                startIcon={<Cancel />}
                onClick={() => {
                  setViewDialogOpen(false)
                  handleActionClick(selectedRequest, 'reject')
                }}
                sx={{ 
                  bgcolor: theme.palette.error.main,
                  '&:hover': { bgcolor: theme.palette.error.dark }
                }}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog 
        open={actionDialogOpen} 
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {actionType === 'approve' ? 'Approve' : 'Reject'} Counselor Application
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedRequest && (
              <Alert 
                severity={actionType === 'approve' ? 'success' : 'warning'}
                sx={{ mb: 3 }}
              >
                You are about to {actionType} the application from{' '}
                <strong>{selectedRequest.firstName} {selectedRequest.lastName}</strong>{' '}
                for the counselor position.
              </Alert>
            )}
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label={actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder={
                actionType === 'approve' 
                  ? 'Add any notes for this approval...'
                  : 'Please provide a reason for rejection...'
              }
              required={actionType === 'reject'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setActionDialogOpen(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProcessAction}
            disabled={processing || (actionType === 'reject' && !actionReason.trim())}
            sx={{
              bgcolor: actionType === 'approve' ? theme.palette.success.main : theme.palette.error.main,
              '&:hover': {
                bgcolor: actionType === 'approve' ? theme.palette.success.dark : theme.palette.error.dark
              }
            }}
          >
            {processing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              `${actionType === 'approve' ? 'Approve' : 'Reject'} Application`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}