import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  useTheme,
  alpha,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  CircularProgress
} from '@mui/material'
import {
  Security,
  Block,
  CheckCircle,
  Warning,
  Person,
  Psychology,
  Visibility,
  Delete,
  Report,
  FilterList,
  Schedule
} from '@mui/icons-material'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../../config/firebase.js'

const ReportCard = ({ report, onResolve, onBlock, theme }) => {
  const [loading, setLoading] = useState(false)
  
  const handleResolve = async (action) => {
    setLoading(true)
    try {
      if (action === 'block') {
        await onBlock(report)
      } else {
        await onResolve(report, action)
      }
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return theme.palette.error.main
      case 'medium': return theme.palette.warning.main
      case 'low': return theme.palette.info.main
      default: return theme.palette.text.secondary
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  return (
    <Card sx={{ 
      mb: 2, 
      borderRadius: 3,
      border: `1px solid ${alpha(getSeverityColor(report.severity), 0.2)}`,
      '&:hover': {
        boxShadow: theme.shadows[4]
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
            <Avatar sx={{ 
              bgcolor: alpha(getSeverityColor(report.severity), 0.1),
              color: getSeverityColor(report.severity)
            }}>
              {report.reportedUser?.role === 'counsellor' ? <Psychology /> : <Person />}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Report against {report.reportedUser?.name || 'Unknown User'}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                Reported by: {report.reporterUser?.name || 'Unknown'} ({report.reporterUser?.role})
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {report.reason}
              </Typography>
              {report.description && (
                <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                  <Typography variant="body2">
                    "{report.description}"
                  </Typography>
                </Paper>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Chip 
              label={report.severity?.toUpperCase() || 'UNKNOWN'}
              size="small"
              sx={{
                bgcolor: alpha(getSeverityColor(report.severity), 0.1),
                color: getSeverityColor(report.severity),
                fontWeight: 600
              }}
            />
            <Chip 
              label={report.status || 'pending'}
              size="small"
              color={report.status === 'resolved' ? 'success' : 'warning'}
              variant="outlined"
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            <Schedule sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
            {formatDate(report.createdAt)}
          </Typography>
          
          {report.status === 'pending' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleResolve('dismiss')}
                disabled={loading}
                sx={{ borderRadius: 2 }}
              >
                Dismiss
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => handleResolve('warn')}
                disabled={loading}
                sx={{ borderRadius: 2 }}
              >
                Warn User
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={() => handleResolve('block')}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <Block />}
                sx={{ borderRadius: 2 }}
              >
                Block User
              </Button>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default function Reports() {
  const theme = useTheme()
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const fetchReports = async () => {
    try {
      const reportsRef = collection(db, 'reports')
      const reportsQuery = query(reportsRef, orderBy('createdAt', 'desc'))
      const reportsSnapshot = await getDocs(reportsQuery)
      
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      const usersMap = {}
      
      usersSnapshot.forEach(doc => {
        usersMap[doc.id] = { id: doc.id, ...doc.data() }
      })
      
      const reportsData = []
      reportsSnapshot.forEach(doc => {
        const data = doc.data()
        reportsData.push({
          id: doc.id,
          ...data,
          reportedUser: usersMap[data.reportedUserId],
          reporterUser: usersMap[data.reporterUserId]
        })
      })
      
      setReports(reportsData)
      setUsers(Object.values(usersMap))
      
    } catch (error) {
      console.error('Error fetching reports:', error)
      setSnackbar({
        open: true,
        message: 'Failed to fetch reports',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBlockUser = async (report) => {
    try {
      if (!report.reportedUser) return
      
      // Update user as blocked
      const userRef = doc(db, 'users', report.reportedUser.id)
      await updateDoc(userRef, {
        blocked: true,
        blockedAt: serverTimestamp(),
        blockedReason: `Reported: ${report.reason}`
      })
      
      // Update report status
      const reportRef = doc(db, 'reports', report.id)
      await updateDoc(reportRef, {
        status: 'resolved',
        action: 'blocked',
        resolvedAt: serverTimestamp()
      })
      
      setSnackbar({
        open: true,
        message: `User ${report.reportedUser.name} has been blocked`,
        severity: 'success'
      })
      
      fetchReports()
      
    } catch (error) {
      console.error('Error blocking user:', error)
      setSnackbar({
        open: true,
        message: 'Failed to block user',
        severity: 'error'
      })
    }
  }

  const handleResolveReport = async (report, action) => {
    try {
      const reportRef = doc(db, 'reports', report.id)
      await updateDoc(reportRef, {
        status: 'resolved',
        action: action,
        resolvedAt: serverTimestamp()
      })
      
      if (action === 'warn' && report.reportedUser) {
        // Could add warning to user record
        const userRef = doc(db, 'users', report.reportedUser.id)
        await updateDoc(userRef, {
          warnings: (report.reportedUser.warnings || 0) + 1,
          lastWarning: serverTimestamp()
        })
      }
      
      setSnackbar({
        open: true,
        message: `Report ${action === 'dismiss' ? 'dismissed' : 'resolved with warning'}`,
        severity: 'success'
      })
      
      fetchReports()
      
    } catch (error) {
      console.error('Error resolving report:', error)
      setSnackbar({
        open: true,
        message: 'Failed to resolve report',
        severity: 'error'
      })
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const pendingReports = reports.filter(r => r.status === 'pending')
  const resolvedReports = reports.filter(r => r.status === 'resolved')

  const getTabReports = () => {
    switch (activeTab) {
      case 0: return pendingReports
      case 1: return resolvedReports
      default: return reports
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 800,
          color: theme.palette.text.primary,
          fontSize: { xs: '2rem', md: '2.5rem' },
          mb: 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          User Reports Management
        </Typography>
        <Typography variant="h6" sx={{ 
          color: theme.palette.text.secondary,
          fontWeight: 400,
          maxWidth: 600
        }}>
          Review and manage user reports, take appropriate actions against violations
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ff9a56 0%, #ffad56 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Report sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {pendingReports.length}
              </Typography>
              <Typography variant="body2">
                Pending Reports
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {resolvedReports.length}
              </Typography>
              <Typography variant="body2">
                Resolved Reports
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Block sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {users.filter(u => u.blocked).length}
              </Typography>
              <Typography variant="body2">
                Blocked Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Security sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {reports.length}
              </Typography>
              <Typography variant="body2">
                Total Reports
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reports List */}
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ px: 3 }}
            >
              <Tab 
                label={
                  <Badge badgeContent={pendingReports.length} color="error">
                    Pending Reports
                  </Badge>
                } 
              />
              <Tab label={`Resolved (${resolvedReports.length})`} />
              <Tab label={`All Reports (${reports.length})`} />
            </Tabs>
          </Box>
          
          <Box sx={{ p: 3 }}>
            {getTabReports().length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Report sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  No {activeTab === 0 ? 'pending' : activeTab === 1 ? 'resolved' : ''} reports found
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
                  {activeTab === 0 ? 'All reports have been reviewed' : 'Reports will appear here when users submit them'}
                </Typography>
              </Box>
            ) : (
              getTabReports().map(report => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onResolve={handleResolveReport}
                  onBlock={handleBlockUser}
                  theme={theme}
                />
              ))
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}