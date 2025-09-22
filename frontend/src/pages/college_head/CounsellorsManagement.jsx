import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import {
  Search,
  MoreVert,
  Block,
  CheckCircle,
  Email,
  Psychology,
  CalendarToday,
  Person,
  Refresh,
  FilterList,
  PendingActions,
  Work,
  School,
  Language,
} from '@mui/icons-material'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { getUserCollege, getCollegeCounsellors, getCollegeStats } from '../../utils/collegeFilter.js'
import { collection, query, where, getDocs } from 'firebase/firestore'
import toast from 'react-hot-toast'

export default function CounsellorsManagement() {
  const theme = useTheme()
  const { user, userRole } = useAuth()
  const [searchParams] = useSearchParams()
  const [counsellors, setCounsellors] = useState([])
  const [filteredCounsellors, setFilteredCounsellors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'pending', 'approved', 'blocked'
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedCounsellor, setSelectedCounsellor] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [userCollege, setUserCollege] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    blocked: 0
  })

  const fetchUserCollege = async () => {
    try {
      // First try to get from college_heads collection
      const collegeHeadQuery = query(
        collection(db, 'college_heads'),
        where('email', '==', user.email)
      )
      
      const collegeHeadSnapshot = await getDocs(collegeHeadQuery)
      if (!collegeHeadSnapshot.empty) {
        const collegeHeadData = collegeHeadSnapshot.docs[0].data()
        
        // Ensure college data has proper structure
        let college = collegeHeadData.college
        if (typeof college === 'string') {
          college = { name: college, id: college }
        } else if (college && !college.id && college.name) {
          college.id = college.name
        }
        
        return college
      }
      
      // Fallback to users collection
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', user.email),
        where('role', '==', 'college_head')
      )
      
      const userSnapshot = await getDocs(userQuery)
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data()
        let college = userData.college
        
        // Ensure college data has proper structure
        if (typeof college === 'string') {
          college = { name: college, id: college }
        } else if (college && !college.id && college.name) {
          college.id = college.name
        }
        
        return college
      }
      return null
    } catch (error) {
      console.error('Error fetching user college:', error)
      return null
    }
  }

  const fetchCounsellors = async () => {
    try {
      setLoading(true)
      setError('')

      if (!user?.uid) {
        setError('User not authenticated')
        return
      }

      console.log('Fetching college information for college head...')
      const college = await fetchUserCollege()
      
      if (!college) {
        setError('College information not found. Please contact administrator.')
        return
      }

      setUserCollege(college)
      console.log('College head college:', college.name)

      console.log('Fetching counsellors for college:', college.name)
      const counsellorsData = await getCollegeCounsellors(college)
      console.log(`Found ${counsellorsData.length} counsellors for college`)

      setCounsellors(counsellorsData)
      setFilteredCounsellors(counsellorsData)

      // Get college-specific stats
      const collegeStats = await getCollegeStats(college)
      setStats({
        total: collegeStats.totalCounsellors,
        approved: collegeStats.activeCounsellors,
        pending: collegeStats.pendingCounsellorApprovals,
        blocked: collegeStats.blockedCounsellors
      })

    } catch (err) {
      console.error('Error fetching counsellors:', err)
      setError(`Failed to load counsellors data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.uid && userRole === 'college_head') {
      fetchCounsellors()
    }
  }, [user, userRole])

  // Handle URL parameters
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam && ['pending', 'approved', 'blocked'].includes(filterParam)) {
      setStatusFilter(filterParam)
    }
  }, [searchParams])

  useEffect(() => {
    let filtered = counsellors.filter(counsellor =>
      counsellor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counsellor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counsellor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counsellor.college?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Apply status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'pending':
          filtered = filtered.filter(c => c.approved === false && !c.blocked)
          break
        case 'approved':
          filtered = filtered.filter(c => c.approved === true && !c.blocked)
          break
        case 'blocked':
          filtered = filtered.filter(c => c.blocked === true)
          break
      }
    }

    setFilteredCounsellors(filtered)
    setPage(0)
  }, [searchTerm, counsellors, statusFilter])

  const handleMenuClick = (event, counsellor) => {
    setAnchorEl(event.currentTarget)
    setSelectedCounsellor(counsellor)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedCounsellor(null)
  }

  const handleViewDetails = () => {
    setDialogOpen(true)
    handleMenuClose()
  }

  const handleApprove = async () => {
    if (!selectedCounsellor) return

    try {
      const userRef = doc(db, 'counsellors', selectedCounsellor.id)
      
      await updateDoc(userRef, {
        approved: true,
        approvedBy: user.uid,
        approvedAt: new Date(),
        updatedAt: new Date()
      })

      toast.success('Counsellor approved successfully')
      fetchCounsellors()
    } catch (error) {
      toast.error('Failed to approve counsellor')
      console.error('Error approving counsellor:', error)
    }
    handleMenuClose()
  }

  const handleReject = async () => {
    if (!selectedCounsellor) return

    try {
      const userRef = doc(db, 'counsellors', selectedCounsellor.id)
      
      await updateDoc(userRef, {
        approved: false,
        blocked: true,
        rejectedBy: user.uid,
        rejectedAt: new Date(),
        updatedAt: new Date()
      })

      toast.success('Counsellor application rejected')
      fetchCounsellors()
    } catch (error) {
      toast.error('Failed to reject counsellor')
      console.error('Error rejecting counsellor:', error)
    }
    handleMenuClose()
  }

  const handleToggleBlock = async () => {
    if (!selectedCounsellor) return

    try {
      const userRef = doc(db, 'counsellors', selectedCounsellor.id)
      const newBlockedStatus = !selectedCounsellor.blocked
      
      await updateDoc(userRef, {
        blocked: newBlockedStatus,
        blockedBy: newBlockedStatus ? user.uid : null,
        blockedAt: newBlockedStatus ? new Date() : null,
        updatedAt: new Date()
      })

      toast.success(`Counsellor ${newBlockedStatus ? 'blocked' : 'unblocked'} successfully`)
      fetchCounsellors()
    } catch (error) {
      toast.error('Failed to update counsellor status')
      console.error('Error updating counsellor:', error)
    }
    handleMenuClose()
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getStatusChip = (counsellor) => {
    if (counsellor.blocked) {
      return <Chip label="Blocked" color="error" size="small" variant="outlined" />
    }
    if (counsellor.approved === true) {
      return <Chip label="Approved" color="success" size="small" variant="outlined" />
    }
    if (counsellor.approved === false) {
      return <Chip label="Pending" color="warning" size="small" variant="outlined" />
    }
    return <Chip label="Unknown" color="default" size="small" variant="outlined" />
  }

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ 
      background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
      border: `1px solid ${color}30`,
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  )

  if (userRole !== 'college_head') {
    return (
      <Box>
        <Alert severity="error">
          Access denied. This page is only available to College Heads.
        </Alert>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchCounsellors}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            Counsellors Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and manage counsellor applications from {userCollege?.name || 'your college'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
          onClick={fetchCounsellors}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          Refresh
        </Button>
      </Box>

      {/* College Info Alert */}
      {userCollege && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are managing counsellors from <strong>{userCollege.name}</strong>. 
          You can approve, reject, or block counsellors from your college.
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Counsellors"
            value={stats.total}
            icon={<Psychology />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approval"
            value={stats.pending}
            icon={<PendingActions />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Blocked"
            value={stats.blocked}
            icon={<Block />}
            color={theme.palette.error.main}
          />
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        {/* Status Filter Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Counsellors', count: stats.total },
            { key: 'pending', label: 'Pending Approval', count: stats.pending },
            { key: 'approved', label: 'Approved', count: stats.approved },
            { key: 'blocked', label: 'Blocked', count: stats.blocked }
          ].map((filter) => (
            <Chip
              key={filter.key}
              label={`${filter.label} (${filter.count})`}
              onClick={() => setStatusFilter(filter.key)}
              color={statusFilter === filter.key ? 'primary' : 'default'}
              variant={statusFilter === filter.key ? 'filled' : 'outlined'}
              sx={{
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: theme.shadows[2]
                }
              }}
            />
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search counsellors by name, email, specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchCounsellors}
            sx={{ minWidth: 120 }}
          >
            Refresh
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {statusFilter === 'all' 
            ? `Found ${filteredCounsellors.length} counsellors from ${userCollege?.name}`
            : `Found ${filteredCounsellors.length} ${statusFilter} counsellors from ${userCollege?.name}`
          }
        </Typography>
      </Paper>

      {/* Counsellors Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: theme.palette.grey[50] }}>
                  <TableRow>
                    <TableCell>Counsellor</TableCell>
                    <TableCell>College</TableCell>
                    <TableCell>Specialization</TableCell>
                    <TableCell>Experience</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Applied</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCounsellors
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((counsellor) => (
                      <TableRow key={counsellor.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                              {counsellor.name ? counsellor.name.charAt(0).toUpperCase() : <Person />}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {counsellor.name || 'Unknown'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {counsellor.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {counsellor.college?.name || userCollege?.name || 'Not specified'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {counsellor.specialization || 'Not specified'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {counsellor.experience || 'Not specified'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(counsellor)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {counsellor.createdAt.toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={(e) => handleMenuClick(e, counsellor)}
                            size="small"
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredCounsellors.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <Person sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedCounsellor?.approved === false && !selectedCounsellor?.blocked && (
          <MenuItem onClick={handleApprove}>
            <CheckCircle sx={{ mr: 1 }} />
            Approve Application
          </MenuItem>
        )}
        {selectedCounsellor?.approved === false && !selectedCounsellor?.blocked && (
          <MenuItem onClick={handleReject}>
            <Block sx={{ mr: 1 }} />
            Reject Application
          </MenuItem>
        )}
        <MenuItem onClick={handleToggleBlock}>
          {selectedCounsellor?.blocked ? <CheckCircle sx={{ mr: 1 }} /> : <Block sx={{ mr: 1 }} />}
          {selectedCounsellor?.blocked ? 'Unblock Counsellor' : 'Block Counsellor'}
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Email sx={{ mr: 1 }} />
          Send Message
        </MenuItem>
      </Menu>

      {/* Counsellor Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Counsellor Details
        </DialogTitle>
        <DialogContent>
          {selectedCounsellor && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Name" 
                      secondary={selectedCounsellor.name || 'Not provided'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Email" 
                      secondary={selectedCounsellor.email} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="College/Institution" 
                      secondary={selectedCounsellor.college?.name || userCollege?.name || 'Not specified'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Professional Information</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Specialization" 
                      secondary={selectedCounsellor.specialization || 'Not specified'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Experience" 
                      secondary={selectedCounsellor.experience || 'Not specified'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Qualifications" 
                      secondary={
                        Array.isArray(selectedCounsellor.qualifications) && selectedCounsellor.qualifications.length > 0
                          ? selectedCounsellor.qualifications.join(', ')
                          : selectedCounsellor.qualifications || 'Not specified'
                      } 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Languages" 
                      secondary={
                        Array.isArray(selectedCounsellor.languages) && selectedCounsellor.languages.length > 0
                          ? selectedCounsellor.languages.join(', ')
                          : 'English'
                      } 
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>Status</Typography>
                {getStatusChip(selectedCounsellor)}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Applied on: {selectedCounsellor.createdAt.toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          {selectedCounsellor?.approved === false && !selectedCounsellor?.blocked && (
            <>
              <Button color="error" onClick={handleReject}>
                Reject
              </Button>
              <Button variant="contained" color="success" onClick={handleApprove}>
                Approve
              </Button>
            </>
          )}
          {selectedCounsellor?.approved !== false && (
            <Button variant="contained" onClick={handleToggleBlock}>
              {selectedCounsellor?.blocked ? 'Unblock' : 'Block'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}