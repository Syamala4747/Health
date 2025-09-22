import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material'
import {
  Business,
  CheckCircle,
  Cancel,
  Visibility,
  School,
  TrendingUp,
  Group,
  Assignment,
  Dashboard as DashboardIcon,
  Psychology,
  SupervisorAccount,
  Refresh,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

// Mock data for Admin dashboard focused on College Heads
const mockSystemStats = {
  totalColleges: 12,
  totalCollegeHeads: 8,
  totalCounsellors: 45,
  totalStudents: 3250,
  pendingCollegeHeadApprovals: 2,
  activeSessions: 89,
  systemUptime: "99.9%"
}

const mockPendingCollegeHeads = [
  {
    id: 1,
    name: "Dr. Rajesh Kumar",
    email: "rajesh.kumar@university.edu",
    college: "Indian Institute of Technology Delhi",
    designation: "Dean of Student Affairs",
    department: "Student Welfare",
    experience: "15 years",
    idProofType: "Employee ID",
    idProofUrl: "/mock-id-proof.jpg",
    submittedAt: new Date('2024-01-15'),
    verificationStatus: "pending"
  },
  {
    id: 2,
    name: "Dr. Priya Sharma",
    email: "priya.sharma@college.ac.in",
    college: "Jawaharlal Nehru University",
    designation: "Vice-Principal",
    department: "Academic Affairs",
    experience: "12 years",
    idProofType: "Aadhar Card",
    idProofUrl: "/mock-id-proof-2.jpg",
    submittedAt: new Date('2024-01-18'),
    verificationStatus: "pending"
  }
]

const mockActiveCollegeHeads = [
  {
    id: 3,
    name: "Dr. Amit Verma",
    email: "amit.verma@university.edu",
    college: "Delhi University",
    designation: "Dean",
    totalCounsellors: 8,
    totalStudents: 450,
    lastActive: new Date('2024-01-20'),
    isActive: true,
    approvedAt: new Date('2024-01-01')
  },
  {
    id: 4,
    name: "Dr. Sneha Patel",
    email: "sneha.patel@institute.ac.in",
    college: "Mumbai University",
    designation: "Principal",
    totalCounsellors: 6,
    totalStudents: 320,
    lastActive: new Date('2024-01-19'),
    isActive: true,
    approvedAt: new Date('2024-01-05')
  }
]

const mockCollegeStats = [
  {
    collegeName: "Indian Institute of Technology Delhi",
    collegeHeadName: "Dr. Amit Verma",
    totalStudents: 450,
    totalCounsellors: 8,
    activeSessions: 23,
    averageRating: 4.7
  },
  {
    collegeName: "Mumbai University",
    collegeHeadName: "Dr. Sneha Patel",
    totalStudents: 320,
    totalCounsellors: 6,
    activeSessions: 18,
    averageRating: 4.5
  }
]

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function AdminDashboard() {
  const { user, userRole, isFallbackMode } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [selectedCollegeHead, setSelectedCollegeHead] = useState(null)
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false)
  const [approvalDialog, setApprovalDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleViewDetails = (collegeHead) => {
    setSelectedCollegeHead(collegeHead)
    setViewDetailsDialog(true)
  }

  const handleApprovalAction = (collegeHead) => {
    setSelectedCollegeHead(collegeHead)
    setApprovalDialog(true)
  }

  const handleApprovalConfirm = async (approved) => {
    setLoading(true)
    try {
      // In real implementation, this would call the backend API
      if (approved) {
        toast.success(`${selectedCollegeHead.name} has been approved as College Head!`)
      } else {
        toast.error(`${selectedCollegeHead.name}'s application has been rejected.`)
      }
      
      setApprovalDialog(false)
      setSelectedCollegeHead(null)
    } catch (error) {
      toast.error('Failed to process approval. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
    toast.success('Data refreshed successfully')
  }

  if (userRole !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. This dashboard is only available to Administrators.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {isFallbackMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are currently using offline mode. Some features may be limited.
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DashboardIcon color="primary" />
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            System Overview & College Head Management
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          Refresh Data
        </Button>
      </Box>

      {/* System Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {mockSystemStats.totalColleges}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Registered Colleges
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <SupervisorAccount />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {mockSystemStats.totalCollegeHeads}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active College Heads
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Badge badgeContent={mockSystemStats.pendingCollegeHeadApprovals} color="error">
                    <Assignment />
                  </Badge>
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {mockSystemStats.pendingCollegeHeadApprovals}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Approvals
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {mockSystemStats.totalStudents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={
                <Badge badgeContent={mockPendingCollegeHeads.length} color="error">
                  College Head Approvals
                </Badge>
              } 
            />
            <Tab label="Active College Heads" />
            <Tab label="College Statistics" />
            <Tab label="System Overview" />
          </Tabs>
        </Box>

        {/* College Head Approvals Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            College Head Applications Awaiting Approval
          </Typography>
          
          {mockPendingCollegeHeads.length === 0 ? (
            <Alert severity="info">
              No pending College Head applications at this time.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name & College</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>ID Verification</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockPendingCollegeHeads.map((collegeHead) => (
                    <TableRow key={collegeHead.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                            {collegeHead.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {collegeHead.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {collegeHead.college}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {collegeHead.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{collegeHead.designation}</TableCell>
                      <TableCell>{collegeHead.department}</TableCell>
                      <TableCell>
                        <Chip 
                          label={collegeHead.idProofType} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {collegeHead.submittedAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details & ID Proof">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(collegeHead)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprovalAction(collegeHead)}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleApprovalAction(collegeHead)}
                            >
                              <Cancel />
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
        </TabPanel>

        {/* Active College Heads Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Active College Heads
          </Typography>
          
          <Grid container spacing={3}>
            {mockActiveCollegeHeads.map((collegeHead) => (
              <Grid item xs={12} md={6} key={collegeHead.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                        {collegeHead.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">
                          {collegeHead.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {collegeHead.designation}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {collegeHead.college}
                        </Typography>
                      </Box>
                      <Chip 
                        label="Active" 
                        color="success"
                        size="small"
                      />
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Counsellors
                        </Typography>
                        <Typography variant="h6">
                          {collegeHead.totalCounsellors}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Students
                        </Typography>
                        <Typography variant="h6">
                          {collegeHead.totalStudents}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      Last active: {collegeHead.lastActive.toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Approved: {collegeHead.approvedAt.toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* College Statistics Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            College Performance Overview
          </Typography>
          
          <Grid container spacing={3}>
            {mockCollegeStats.map((college, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {college.collegeName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Head: {college.collegeHeadName}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Students
                        </Typography>
                        <Typography variant="h6">
                          {college.totalStudents}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Counsellors
                        </Typography>
                        <Typography variant="h6">
                          {college.totalCounsellors}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Active Sessions
                        </Typography>
                        <Typography variant="h6">
                          {college.activeSessions}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Avg Rating
                        </Typography>
                        <Typography variant="h6">
                          ⭐ {college.averageRating}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* System Overview Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            System Health & Statistics
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Metrics
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="System Uptime"
                        secondary={mockSystemStats.systemUptime}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Total Counsellors"
                        secondary={`${mockSystemStats.totalCounsellors} across all colleges`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Active Sessions"
                        secondary={`${mockSystemStats.activeSessions} ongoing`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="outlined" startIcon={<Business />}>
                      Add New College
                    </Button>
                    <Button variant="outlined" startIcon={<Assignment />}>
                      Generate System Report
                    </Button>
                    <Button variant="outlined" startIcon={<TrendingUp />}>
                      View Analytics
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsDialog} onClose={() => setViewDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          College Head Application Details
        </DialogTitle>
        <DialogContent>
          {selectedCollegeHead && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Typography><strong>Name:</strong> {selectedCollegeHead.name}</Typography>
                  <Typography><strong>Email:</strong> {selectedCollegeHead.email}</Typography>
                  <Typography><strong>College:</strong> {selectedCollegeHead.college}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" gutterBottom>
                    Professional Details
                  </Typography>
                  <Typography><strong>Designation:</strong> {selectedCollegeHead.designation}</Typography>
                  <Typography><strong>Department:</strong> {selectedCollegeHead.department}</Typography>
                  <Typography><strong>Experience:</strong> {selectedCollegeHead.experience}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    ID Verification
                  </Typography>
                  <Typography><strong>ID Type:</strong> {selectedCollegeHead.idProofType}</Typography>
                  <Typography><strong>Verification Status:</strong> 
                    <Chip 
                      label={selectedCollegeHead.verificationStatus} 
                      size="small" 
                      color="warning" 
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Button variant="outlined" sx={{ mt: 1 }}>
                    View ID Proof Document
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetailsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)}>
        <DialogTitle>
          Confirm College Head Approval
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve {selectedCollegeHead?.name} as College Head for {selectedCollegeHead?.college}?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Approved College Heads will be able to manage counsellors for their institution.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleApprovalConfirm(false)}
            color="error"
            disabled={loading}
          >
            Reject
          </Button>
          <Button
            onClick={() => handleApprovalConfirm(true)}
            color="success"
            disabled={loading}
            variant="contained"
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}