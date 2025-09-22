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
  Warning,
} from '@mui/icons-material'
import { collection, getDocs, query, where, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
// import CounselorApprovalQuickFix from '../../components/CounselorApprovalQuickFix.jsx'
import { db } from '../../config/firebase.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

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

export default function SimplifiedAdminDashboard() {
  const { user, userRole } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [selectedCollegeHead, setSelectedCollegeHead] = useState(null)
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false)
  const [approvalDialog, setApprovalDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingCollegeHeads, setPendingCollegeHeads] = useState([])
  const [activeCollegeHeads, setActiveCollegeHeads] = useState([])
  const [escalatedIssues, setEscalatedIssues] = useState([])
  const [systemStats, setSystemStats] = useState({
    totalColleges: 0,
    totalCollegeHeads: 0,
    totalCounsellors: 0,
    totalStudents: 0,
    pendingCollegeHeadApprovals: 0,
    escalatedIssues: 0,
    systemUptime: "99.9%"
  })
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAdminData = async () => {
    try {
      setRefreshing(true)
      console.log('🔄 Fetching admin dashboard data...')
      
      // Fetch pending college head approvals (without orderBy to avoid index issues)
      console.log('📋 Fetching pending college heads...')
      const pendingQuery = query(
        collection(db, 'college_heads'),
        where('approved', '==', false),
        where('blocked', '==', false)
      )
      const pendingSnapshot = await getDocs(pendingQuery)
      const pendingData = []
      pendingSnapshot.forEach(doc => {
        const data = doc.data()
        pendingData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        })
      })
      // Sort manually after fetching
      pendingData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setPendingCollegeHeads(pendingData)
      console.log(`✅ Found ${pendingData.length} pending college heads`)

      // Fetch active college heads (without orderBy to avoid index issues)
      console.log('👥 Fetching active college heads...')
      const activeQuery = query(
        collection(db, 'college_heads'),
        where('approved', '==', true),
        where('blocked', '==', false)
      )
      const activeSnapshot = await getDocs(activeQuery)
      const activeData = []
      activeSnapshot.forEach(doc => {
        const data = doc.data()
        activeData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        })
      })
      // Sort manually after fetching
      activeData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setActiveCollegeHeads(activeData)
      console.log(`✅ Found ${activeData.length} active college heads`)

      // Fetch escalated issues (if collection exists)
      console.log('⚠️ Fetching escalated issues...')
      let issuesData = []
      try {
        const issuesSnapshot = await getDocs(collection(db, 'escalated_issues'))
        issuesSnapshot.forEach(doc => {
          const data = doc.data()
          if (data.status === 'pending' || data.status === 'in_progress') {
            issuesData.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date()
            })
          }
        })
        issuesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      } catch (error) {
        console.log('ℹ️ Escalated issues collection not found or empty')
      }
      setEscalatedIssues(issuesData)
      console.log(`✅ Found ${issuesData.length} escalated issues`)

      // Calculate system-wide statistics
      console.log('📊 Calculating system statistics...')
      const allCollegeHeads = [...pendingData, ...activeData]
      const uniqueColleges = new Set(
        allCollegeHeads
          .map(ch => ch.college?.id || ch.college?.name || ch.collegeName)
          .filter(Boolean)
      )
      
      // Get total counsellors and students with error handling
      let totalCounsellors = 0
      let totalStudents = 0
      
      try {
        const counsellorsSnapshot = await getDocs(collection(db, 'counsellors'))
        totalCounsellors = counsellorsSnapshot.size
        console.log(`✅ Found ${totalCounsellors} counsellors`)
      } catch (error) {
        console.warn('⚠️ Could not fetch counsellors:', error.message)
      }
      
      try {
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'))
        const studentsSnapshot = await getDocs(studentsQuery)
        totalStudents = studentsSnapshot.size
        console.log(`✅ Found ${totalStudents} students`)
      } catch (error) {
        console.warn('⚠️ Could not fetch students:', error.message)
      }

      const newStats = {
        totalColleges: uniqueColleges.size,
        totalCollegeHeads: activeData.length,
        totalCounsellors,
        totalStudents,
        pendingCollegeHeadApprovals: pendingData.length,
        escalatedIssues: issuesData.length,
        systemUptime: "99.9%"
      }
      
      setSystemStats(newStats)
      console.log('✅ System statistics updated:', newStats)

    } catch (error) {
      console.error('❌ Error fetching admin data:', error)
      toast.error(`Failed to load admin dashboard data: ${error.message}`)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      if (userRole === 'admin') {
        try {
          setError('')
          await fetchAdminData()
        } catch (err) {
          setError(err.message)
        } finally {
          setInitialLoading(false)
        }
      } else if (userRole) {
        setInitialLoading(false)
      }
    }
    
    loadData()
  }, [userRole])

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
      const collegeHeadRef = doc(db, 'college_heads', selectedCollegeHead.id)
      
      if (approved) {
        await updateDoc(collegeHeadRef, {
          approved: true,
          approvedBy: user.uid,
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        toast.success(`${selectedCollegeHead.name} has been approved as College Head!`)
      } else {
        await updateDoc(collegeHeadRef, {
          approved: false,
          blocked: true,
          rejectedBy: user.uid,
          rejectedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        toast.error(`${selectedCollegeHead.name}'s application has been rejected.`)
      }
      
      setApprovalDialog(false)
      setSelectedCollegeHead(null)
      fetchAdminData() // Refresh data
    } catch (error) {
      toast.error('Failed to process approval. Please try again.')
      console.error('Error processing approval:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchAdminData()
    toast.success('Data refreshed successfully')
  }

  if (initialLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading admin dashboard...
          </Typography>
        </Box>
      </Container>
    )
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => {
              setError('')
              setInitialLoading(true)
              fetchAdminData().finally(() => setInitialLoading(false))
            }}>
              Retry
            </Button>
          }
        >
          Failed to load dashboard: {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DashboardIcon color="primary" />
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            College Head Management & System Oversight
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
                    {systemStats.totalColleges}
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
                    {systemStats.totalCollegeHeads}
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
                  <Badge badgeContent={systemStats.pendingCollegeHeadApprovals} color="error">
                    <Assignment />
                  </Badge>
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {systemStats.pendingCollegeHeadApprovals}
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
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Badge badgeContent={systemStats.escalatedIssues} color="error">
                    <Warning />
                  </Badge>
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {systemStats.escalatedIssues}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Escalated Issues
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
                <Badge badgeContent={pendingCollegeHeads.length} color="error">
                  College Head Approvals
                </Badge>
              } 
            />
            <Tab label="Active College Heads" />
            <Tab label={
              <Badge badgeContent={escalatedIssues.length} color="error">
                Escalated Issues
              </Badge>
            } />
            <Tab label="System Overview" />
          </Tabs>
        </Box>

        {/* College Head Approvals Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            College Head Applications Awaiting Approval
          </Typography>
          
          {pendingCollegeHeads.length === 0 ? (
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
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingCollegeHeads.map((collegeHead) => (
                    <TableRow key={collegeHead.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                            {collegeHead.name?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {collegeHead.name || 'Unknown Name'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {collegeHead.college?.name || 'Unknown College'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {collegeHead.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{collegeHead.designation || 'Not specified'}</TableCell>
                      <TableCell>{collegeHead.department || 'Not specified'}</TableCell>
                      <TableCell>
                        {collegeHead.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
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
            {activeCollegeHeads.map((collegeHead) => (
              <Grid item xs={12} md={6} key={collegeHead.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                        {collegeHead.name?.charAt(0) || 'U'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">
                          {collegeHead.name || 'Unknown Name'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {collegeHead.designation || 'College Head'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {collegeHead.college?.name || 'Unknown College'}
                        </Typography>
                      </Box>
                      <Chip 
                        label="Active" 
                        color="success"
                        size="small"
                      />
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body2" color="text.secondary">
                      Email: {collegeHead.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Department: {collegeHead.department || 'Not specified'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      Approved: {collegeHead.approvedAt?.toDate?.()?.toLocaleDateString() || collegeHead.createdAt.toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Escalated Issues Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Issues Escalated by College Heads
          </Typography>
          
          {escalatedIssues.length === 0 ? (
            <Alert severity="info">
              No escalated issues at this time.
            </Alert>
          ) : (
            <Box>
              {escalatedIssues.map((issue) => (
                <Card key={issue.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">
                          {issue.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          From: {issue.collegeHeadName} ({issue.collegeName})
                        </Typography>
                      </Box>
                      <Chip 
                        label={issue.severity?.toUpperCase() || 'MEDIUM'}
                        color={issue.severity === 'high' ? 'error' : issue.severity === 'medium' ? 'warning' : 'info'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {issue.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Escalated: {issue.createdAt.toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
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
                    Platform Statistics
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="System Uptime"
                        secondary={systemStats.systemUptime}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Total Counsellors"
                        secondary={`${systemStats.totalCounsellors} across all colleges`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Total Students"
                        secondary={`${systemStats.totalStudents} registered users`}
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
                    Admin Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="outlined" startIcon={<Business />} disabled>
                      Manage Colleges (Coming Soon)
                    </Button>
                    <Button variant="outlined" startIcon={<Assignment />} disabled>
                      Generate System Report (Coming Soon)
                    </Button>
                    <Button variant="outlined" startIcon={<TrendingUp />} disabled>
                      View System Analytics (Coming Soon)
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
                  <Typography><strong>Name:</strong> {selectedCollegeHead.name || 'Not provided'}</Typography>
                  <Typography><strong>Email:</strong> {selectedCollegeHead.email}</Typography>
                  <Typography><strong>College:</strong> {selectedCollegeHead.college?.name || 'Not specified'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" gutterBottom>
                    Professional Details
                  </Typography>
                  <Typography><strong>Designation:</strong> {selectedCollegeHead.designation || 'Not specified'}</Typography>
                  <Typography><strong>Department:</strong> {selectedCollegeHead.department || 'Not specified'}</Typography>
                  <Typography><strong>Phone:</strong> {selectedCollegeHead.phone || 'Not provided'}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Application Status
                  </Typography>
                  <Typography><strong>Submitted:</strong> {selectedCollegeHead.createdAt.toLocaleDateString()}</Typography>
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
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)}>
        <DialogTitle>
          Confirm College Head Approval
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve {selectedCollegeHead?.name} as College Head for {selectedCollegeHead?.college?.name}?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Approved College Heads will be able to manage counsellors and students for their institution.
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
            {loading ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Development Debug Tool - Commented out */}
      {/* <CounselorApprovalQuickFix /> */}
    </Container>
  )
}