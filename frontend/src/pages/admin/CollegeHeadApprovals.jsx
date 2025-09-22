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
  alpha
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  Visibility,
  School,
  Email,
  Phone,
  LocationOn,
  Description,
  AttachFile,
  Person,
  Business,
  Refresh
} from '@mui/icons-material'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function CollegeHeadApprovals() {
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

  const fetchPendingRequests = async () => {
    try {
      setLoading(true)
      
      // Query for pending college head approval requests
      const q = query(
        collection(db, 'college_head_requests'),
        where('status', '==', 'pending')
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
    fetchPendingRequests()
  }, [])

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
      await updateDoc(doc(db, 'college_head_requests', selectedRequest.id), {
        status: approved ? 'approved' : 'rejected',
        processedAt: serverTimestamp(),
        processedBy: user.uid,
        adminNotes: actionReason,
        updatedAt: serverTimestamp()
      })
      
      if (approved) {
        // Create user account in users collection
        await addDoc(collection(db, 'users'), {
          email: selectedRequest.email,
          role: 'college_head',
          approved: true,
          blocked: false,
          profile: {
            firstName: selectedRequest.firstName,
            lastName: selectedRequest.lastName,
            phone: selectedRequest.phone,
            position: selectedRequest.position
          },
          college: {
            id: selectedRequest.collegeId,
            name: selectedRequest.collegeName,
            code: selectedRequest.collegeCode,
            address: selectedRequest.collegeAddress
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          approvedAt: serverTimestamp(),
          approvedBy: user.uid
        })
        
        // Create notification for approved user
        await addDoc(collection(db, 'notifications'), {
          userId: selectedRequest.userId || selectedRequest.email,
          type: 'college_head_approved',
          title: 'College Head Account Approved!',
          message: 'Your College Head account has been approved. You can now login and manage your institution.',
          read: false,
          createdAt: serverTimestamp()
        })
        
        toast.success('College Head request approved successfully!')
      } else {
        // Create notification for rejected user
        await addDoc(collection(db, 'notifications'), {
          userId: selectedRequest.userId || selectedRequest.email,
          type: 'college_head_rejected',
          title: 'College Head Application Update',
          message: `Your College Head application was not approved. ${actionReason || 'Please contact support for more information.'}`,
          read: false,
          createdAt: serverTimestamp()
        })
        
        toast.success('College Head request rejected')
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
            College Head Approvals
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
          Review and approve College Head registration requests
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
              Pending Approval Requests
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {pendingRequests.length} College Head{pendingRequests.length !== 1 ? 's' : ''} waiting for approval
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
          <School sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No Pending Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All College Head requests have been processed
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {pendingRequests.map((request) => (
            <Grid item xs={12} md={6} lg={4} key={request.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: theme.palette.primary.main,
                        width: 56,
                        height: 56,
                        mr: 2
                      }}
                    >
                      <Person />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {request.firstName} {request.lastName}
                      </Typography>
                      <Chip 
                        label={request.status}
                        size="small"
                        sx={{
                          bgcolor: alpha(getStatusColor(request.status), 0.1),
                          color: getStatusColor(request.status),
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>
                  </Box>

                  {/* College Info */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Business sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {request.collegeName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Email sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {request.email}
                      </Typography>
                    </Box>
                    {request.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Phone sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {request.phone}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Request Date */}
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
                    Requested: {request.createdAt?.toDate().toLocaleDateString()}
                  </Typography>

                  <Divider sx={{ mb: 3 }} />

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewRequest(request)}
                      sx={{ flex: 1, borderRadius: 2 }}
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CheckCircle />}
                      onClick={() => handleActionClick(request, 'approve')}
                      sx={{ 
                        flex: 1, 
                        borderRadius: 2,
                        bgcolor: theme.palette.success.main,
                        '&:hover': { bgcolor: theme.palette.success.dark }
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Cancel />}
                      onClick={() => handleActionClick(request, 'reject')}
                      sx={{ 
                        flex: 1, 
                        borderRadius: 2,
                        bgcolor: theme.palette.error.main,
                        '&:hover': { bgcolor: theme.palette.error.dark }
                      }}
                    >
                      Reject
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
            College Head Request Details
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
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Position</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRequest.position}
                      </Typography>
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
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Address</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRequest.collegeAddress}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Additional Information */}
                {selectedRequest.additionalInfo && (
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Additional Information
                    </Typography>
                    <Typography variant="body1">
                      {selectedRequest.additionalInfo}
                    </Typography>
                  </Grid>
                )}

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
                      View ID Proof
                    </Button>
                  </Grid>
                )}

                {/* Request Metadata */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Request Information
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
            {actionType === 'approve' ? 'Approve' : 'Reject'} College Head Request
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedRequest && (
              <Alert 
                severity={actionType === 'approve' ? 'success' : 'warning'}
                sx={{ mb: 3 }}
              >
                You are about to {actionType} the request from{' '}
                <strong>{selectedRequest.firstName} {selectedRequest.lastName}</strong>{' '}
                for <strong>{selectedRequest.collegeName}</strong>.
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
              `${actionType === 'approve' ? 'Approve' : 'Reject'} Request`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}