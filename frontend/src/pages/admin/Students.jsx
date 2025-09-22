import { useState, useEffect } from 'react'
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
} from '@mui/material'
import {
  Search,
  MoreVert,
  Block,
  CheckCircle,
  Email,
  School,
  CalendarToday,
  Person,
  Refresh,
  FilterList,
} from '@mui/icons-material'
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase.js'
import { testFirebaseConnection } from '../../utils/firebaseTest.js'
import toast from 'react-hot-toast'

export default function Students() {
  const theme = useTheme()
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
    newThisWeek: 0
  })

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError('')

      console.log('Fetching students from Firebase...')

      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('role', '==', 'student'), orderBy('createdAt', 'desc'))
      
      console.log('Executing student query from users collection...')
      const querySnapshot = await getDocs(q)
      console.log('Student query executed, processing results...')
      
      const studentsData = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        console.log('Student data:', data)
        studentsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        })
      })

      console.log(`Found ${studentsData.length} students`)

      // Sort by createdAt after fetching
      studentsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      setStudents(studentsData)
      setFilteredStudents(studentsData)

      // Calculate stats
      const total = studentsData.length
      const active = studentsData.filter(s => !s.blocked).length
      const blocked = studentsData.filter(s => s.blocked).length
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const newThisWeek = studentsData.filter(s => s.createdAt > oneWeekAgo).length

      setStats({ total, active, blocked, newThisWeek })

    } catch (err) {
      console.error('Error fetching students:', err)
      setError(`Failed to load students data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      // Test Firebase connection first
      await testFirebaseConnection()
      // Then fetch students
      fetchStudents()
    }
    initializeData()
  }, [])

  useEffect(() => {
    const filtered = students.filter(student =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.major?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredStudents(filtered)
    setPage(0)
  }, [searchTerm, students])

  const handleMenuClick = (event, student) => {
    setAnchorEl(event.currentTarget)
    setSelectedStudent(student)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedStudent(null)
  }

  const handleViewDetails = () => {
    setDialogOpen(true)
    handleMenuClose()
  }

  const handleToggleBlock = async () => {
    if (!selectedStudent) return

    try {
      const userRef = doc(db, 'students', selectedStudent.id)
      const newBlockedStatus = !selectedStudent.blocked
      
      await updateDoc(userRef, {
        blocked: newBlockedStatus,
        updatedAt: new Date()
      })

      toast.success(`Student ${newBlockedStatus ? 'blocked' : 'unblocked'} successfully`)
      fetchStudents()
    } catch (error) {
      toast.error('Failed to update student status')
      console.error('Error updating student:', error)
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

  if (error) {
    return (
      <Box>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchStudents}>
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
            Students Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and monitor all registered students
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
          onClick={fetchStudents}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats.total}
            icon={<School />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Students"
            value={stats.active}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Blocked Students"
            value={stats.blocked}
            icon={<Block />}
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New This Week"
            value={stats.newThisWeek}
            icon={<CalendarToday />}
            color={theme.palette.info.main}
          />
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search students by name, email, university, or major..."
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
            startIcon={<FilterList />}
            sx={{ minWidth: 120 }}
          >
            Filters
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Found {filteredStudents.length} students
        </Typography>
      </Paper>

      {/* Students Table */}
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
                    <TableCell>Student</TableCell>
                    <TableCell>University</TableCell>
                    <TableCell>Major & Year</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((student) => (
                      <TableRow key={student.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                              {student.name ? student.name.charAt(0).toUpperCase() : <Person />}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {student.name || 'Unknown'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {student.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {student.university || 'Not specified'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {student.major || 'Not specified'}
                            {student.year && ` • Year ${student.year}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={student.blocked ? 'Blocked' : 'Active'}
                            color={student.blocked ? 'error' : 'success'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {student.createdAt.toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={(e) => handleMenuClick(e, student)}
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
              count={filteredStudents.length}
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
        <MenuItem onClick={handleToggleBlock}>
          {selectedStudent?.blocked ? <CheckCircle sx={{ mr: 1 }} /> : <Block sx={{ mr: 1 }} />}
          {selectedStudent?.blocked ? 'Unblock Student' : 'Block Student'}
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Email sx={{ mr: 1 }} />
          Send Message
        </MenuItem>
      </Menu>

      {/* Student Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Student Details
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Name</Typography>
                <Typography variant="body1" gutterBottom>{selectedStudent.name || 'Not provided'}</Typography>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Email</Typography>
                <Typography variant="body1" gutterBottom>{selectedStudent.email}</Typography>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>University</Typography>
                <Typography variant="body1" gutterBottom>{selectedStudent.university || 'Not specified'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Major</Typography>
                <Typography variant="body1" gutterBottom>{selectedStudent.major || 'Not specified'}</Typography>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Year</Typography>
                <Typography variant="body1" gutterBottom>{selectedStudent.year || 'Not specified'}</Typography>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Status</Typography>
                <Chip
                  label={selectedStudent.blocked ? 'Blocked' : 'Active'}
                  color={selectedStudent.blocked ? 'error' : 'success'}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleToggleBlock}>
            {selectedStudent?.blocked ? 'Unblock' : 'Block'} Student
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}