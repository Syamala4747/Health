import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material'
import { CheckCircle, Person, Psychology, Business, Visibility, Image } from '@mui/icons-material'
import { approveUserByUID, listPendingApprovals } from '../../utils/userApprovalHelper.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function UserApprovalUtility() {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [pendingUsers, setPendingUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false)
  const [imageDialog, setImageDialog] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    if (user && userRole) {
      loadPendingUsers()
    }
  }, [user, userRole])

  const loadPendingUsers = async () => {
    setLoading(true)
    try {
      const pending = await listPendingApprovals(user?.uid, userRole)
      setPendingUsers(pending)
    } catch (error) {
      toast.error('Failed to load pending users')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (user) => {
    console.log('=== DEBUGGING USER DATA ===')
    console.log('Full user object:', user)
    console.log('User keys:', Object.keys(user))
    console.log('College field variations:')
    console.log('- user.college:', user.college)
    console.log('- user.collegeName:', user.collegeName)
    console.log('- user.university:', user.university)
    console.log('- user.institution:', user.institution)
    console.log('Photo field variations:')
    console.log('- user.idProofUrl:', user.idProofUrl)
    console.log('- user.idProof:', user.idProof)
    console.log('- user.documentUrl:', user.documentUrl)
    console.log('- user.profilePicture:', user.profilePicture)
    console.log('- user.profilePhoto:', user.profilePhoto)
    console.log('- user.photoUrl:', user.photoUrl)
    console.log('- user.image:', user.image)
    console.log('- user.photo:', user.photo)
    console.log('=== END DEBUG ===')
    setSelectedUser(user)
    setViewDetailsDialog(true)
  }

  const handleViewImage = (imageUrl) => {
    setSelectedImage(imageUrl)
    setImageDialog(true)
  }

  const handleApproveFromList = async (userToApprove) => {
    setLoading(true)
    try {
      const result = await approveUserByUID(userToApprove.uid, user?.uid, userRole)
      if (result.success) {
        toast.success(`${userToApprove.name} approved successfully as ${result.role}`)
        loadPendingUsers() // Refresh the list
      } else {
        toast.error(result.error || 'Failed to approve user')
      }
    } catch (error) {
      toast.error('Error approving user: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'counsellor': return <Psychology />
      case 'college_head': return <Business />
      default: return <Person />
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'counsellor': return 'secondary'
      case 'college_head': return 'primary'
      case 'admin': return 'error'
      default: return 'default'
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        {userRole === 'college_head' ? 'Counselor Approval Management' : 'User Approval Management'}
      </Typography>

      {userRole === 'college_head' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          As a college head, you can only approve counselors from your own college.
        </Alert>
      )}

      {/* Pending Users List */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Pending Approvals ({pendingUsers.length})
            </Typography>
            <Button
              variant="outlined"
              onClick={loadPendingUsers}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Refresh
            </Button>
          </Box>

          {pendingUsers.length === 0 ? (
            <Alert severity="info">
              No pending approvals found.
            </Alert>
          ) : (
            <List>
              {pendingUsers.map((user, index) => (
                <Box key={user.uid}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRoleIcon(user.role)}
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {user.name || 'Unknown Name'}
                          </Typography>
                          <Chip 
                            label={user.role} 
                            size="small" 
                            color={getRoleColor(user.role)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Email: {user.email}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            UID: {user.uid}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Collection: {user.collection}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Created: {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewDetails(user)}
                          startIcon={<Visibility />}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleApproveFromList(user)}
                          disabled={loading}
                          startIcon={<CheckCircle />}
                        >
                          Approve
                        </Button>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < pendingUsers.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={viewDetailsDialog} onClose={() => setViewDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          User Application Details
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Typography><strong>Name:</strong> {selectedUser.name || 'Not provided'}</Typography>
                  <Typography><strong>Email:</strong> {selectedUser.email}</Typography>
                  <Typography><strong>Role:</strong> {selectedUser.role}</Typography>
                  {selectedUser.phone && (
                    <Typography><strong>Phone:</strong> {selectedUser.phone}</Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" gutterBottom>
                    Professional Details
                  </Typography>
                  {selectedUser.role === 'college_head' && (
                    <>
                      <Typography><strong>College:</strong> {
                        selectedUser.college?.name || 
                        selectedUser.collegeName || 
                        selectedUser.university || 
                        selectedUser.institution || 
                        selectedUser.college || 
                        'Not specified'
                      }</Typography>
                      <Typography><strong>Designation:</strong> {selectedUser.designation || 'Not specified'}</Typography>
                      <Typography><strong>Department:</strong> {selectedUser.department || 'Not specified'}</Typography>
                      {selectedUser.experience && (
                        <Typography><strong>Experience:</strong> {selectedUser.experience}</Typography>
                      )}
                      {selectedUser.employeeId && (
                        <Typography><strong>Employee ID:</strong> {selectedUser.employeeId}</Typography>
                      )}
                    </>
                  )}
                  {selectedUser.role === 'counsellor' && (
                    <>
                      <Typography><strong>College:</strong> {selectedUser.college?.name || selectedUser.collegeName || 'Not specified'}</Typography>
                      <Typography><strong>Specialization:</strong> {selectedUser.specialization || 'Not specified'}</Typography>
                      <Typography><strong>Experience:</strong> {selectedUser.experience || 'Not specified'}</Typography>
                      <Typography><strong>Qualifications:</strong> {
                        Array.isArray(selectedUser.qualifications) 
                          ? selectedUser.qualifications.join(', ') 
                          : selectedUser.qualifications || 'Not specified'
                      }</Typography>
                      {selectedUser.languages && (
                        <Typography><strong>Languages:</strong> {
                          Array.isArray(selectedUser.languages) 
                            ? selectedUser.languages.join(', ') 
                            : selectedUser.languages
                        }</Typography>
                      )}
                      {selectedUser.licenseNumber && (
                        <Typography><strong>License Number:</strong> {selectedUser.licenseNumber}</Typography>
                      )}
                    </>
                  )}
                  {selectedUser.role === 'student' && (
                    <>
                      <Typography><strong>University:</strong> {selectedUser.university || selectedUser.college?.name || 'Not specified'}</Typography>
                      <Typography><strong>Major:</strong> {selectedUser.major || 'Not specified'}</Typography>
                      <Typography><strong>Year:</strong> {selectedUser.year || 'Not specified'}</Typography>
                      {selectedUser.studentId && (
                        <Typography><strong>Student ID:</strong> {selectedUser.studentId}</Typography>
                      )}
                    </>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Documents & Photos
                  </Typography>
                  {selectedUser.idProofType && (
                    <Typography><strong>ID Type:</strong> {selectedUser.idProofType}</Typography>
                  )}
                  
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {/* ID Proof Document - check multiple field variations */}
                    {(selectedUser.idProofUrl || selectedUser.idProof || selectedUser.documentUrl || 
                      selectedUser.idDocument || selectedUser.document || selectedUser.idCard) && (
                      <Button
                        variant="outlined"
                        startIcon={<Image />}
                        onClick={() => handleViewImage(
                          selectedUser.idProofUrl || selectedUser.idProof || selectedUser.documentUrl ||
                          selectedUser.idDocument || selectedUser.document || selectedUser.idCard
                        )}
                        size="small"
                      >
                        View ID Proof
                      </Button>
                    )}
                    
                    {/* Profile Picture - check multiple field variations */}
                    {(selectedUser.profilePicture || selectedUser.profilePhoto || selectedUser.photoUrl || 
                      selectedUser.image || selectedUser.photo || selectedUser.avatar || selectedUser.picture) && (
                      <Button
                        variant="outlined"
                        startIcon={<Image />}
                        onClick={() => handleViewImage(
                          selectedUser.profilePicture || selectedUser.profilePhoto || selectedUser.photoUrl ||
                          selectedUser.image || selectedUser.photo || selectedUser.avatar || selectedUser.picture
                        )}
                        size="small"
                      >
                        View Profile Photo
                      </Button>
                    )}
                    
                    {/* Additional documents */}
                    {selectedUser.certificateUrl && (
                      <Button
                        variant="outlined"
                        startIcon={<Image />}
                        onClick={() => handleViewImage(selectedUser.certificateUrl)}
                        size="small"
                      >
                        View Certificate
                      </Button>
                    )}
                    
                    {selectedUser.resumeUrl && (
                      <Button
                        variant="outlined"
                        startIcon={<Image />}
                        onClick={() => handleViewImage(selectedUser.resumeUrl)}
                        size="small"
                      >
                        View Resume
                      </Button>
                    )}
                  </Box>
                  
                  {/* Show message if no documents */}
                  {!selectedUser.idProofUrl && !selectedUser.idProof && !selectedUser.documentUrl && 
                   !selectedUser.idDocument && !selectedUser.document && !selectedUser.idCard &&
                   !selectedUser.profilePicture && !selectedUser.profilePhoto && !selectedUser.photoUrl && 
                   !selectedUser.image && !selectedUser.photo && !selectedUser.avatar && !selectedUser.picture &&
                   !selectedUser.certificateUrl && !selectedUser.resumeUrl && (
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      No documents or photos uploaded
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Application Status
                  </Typography>
                  <Typography><strong>Submitted:</strong> {selectedUser.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</Typography>
                  <Typography><strong>Collection:</strong> {selectedUser.collection}</Typography>
                  <Typography><strong>UID:</strong> {selectedUser.uid}</Typography>
                  <Chip 
                    label="Pending Approval" 
                    color="warning" 
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetailsDialog(false)}>
            Close
          </Button>
          {selectedUser && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                handleApproveFromList(selectedUser)
                setViewDetailsDialog(false)
              }}
              disabled={loading}
              startIcon={<CheckCircle />}
            >
              Approve User
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={imageDialog} onClose={() => setImageDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Document/Image Viewer
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', pt: 2 }}>
            {selectedImage ? (
              <img 
                src={selectedImage} 
                alt="User document" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '500px', 
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }} 
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
            ) : (
              <Typography color="text.secondary">
                No image available
              </Typography>
            )}
            <Typography 
              color="error" 
              sx={{ display: 'none', mt: 2 }}
            >
              Failed to load image. The image may not be accessible or the URL may be invalid.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialog(false)}>
            Close
          </Button>
          {selectedImage && (
            <Button
              variant="outlined"
              onClick={() => window.open(selectedImage, '_blank')}
            >
              Open in New Tab
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  )
}