import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Container,
} from '@mui/material'
import {
  People,
  Psychology,
  TrendingUp,
  Warning,
  School,
  CheckCircle,
  PendingActions,
  Block,
  Visibility,
  MoreVert,
  Add,
  Refresh,
  Analytics,
  Assignment,
  ChevronRight,
  Dashboard as DashboardIcon,
  Security,
  Schedule,
  Notifications,
  Settings,
} from '@mui/icons-material'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../../config/firebase.js'
import { useNavigate } from 'react-router-dom'

const StatCard = ({ title, value, icon, color, loading, trend, trendValue, onClick, subtitle }) => {
  const theme = useTheme()
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: onClick ? 'translateY(-8px)' : 'none',
          boxShadow: onClick ? '0 20px 40px rgba(0,0,0,0.1)' : theme.shadows[1],
          borderColor: onClick ? color : theme.palette.divider,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3, pb: '24px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: '0.875rem',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: '2.5rem',
                lineHeight: 1,
                mb: subtitle ? 0.5 : 0
              }}
            >
              {loading ? '...' : (typeof value === 'number' ? value.toLocaleString() : value)}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: alpha(color, 0.1),
              color: color,
              width: 56, 
              height: 56,
              '& .MuiSvgIcon-root': {
                fontSize: '1.75rem'
              }
            }}
          >
            {icon}
          </Avatar>
        </Box>
        
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip 
              label={`${trendValue > 0 ? '+' : ''}${trendValue}%`}
              size="small"
              sx={{
                backgroundColor: trendValue > 0 
                  ? alpha(theme.palette.success.main, 0.1)
                  : alpha(theme.palette.error.main, 0.1),
                color: trendValue > 0 
                  ? theme.palette.success.main
                  : theme.palette.error.main,
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                borderRadius: 2,
                border: 'none'
              }}
            />
            {onClick && (
              <ChevronRight 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '1.25rem'
                }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCounsellors: 0,
    pendingApprovals: 0,
    totalSessions: 0,
    approvedCounsellors: 0,
    blockedUsers: 0
  })
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch all users
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      let students = 0
      let counsellors = 0
      let pendingApprovals = 0
      let approvedCounsellors = 0
      let blockedUsers = 0

      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data()
        
        // Count by role
        if (userData.role === 'student') {
          students++
        } else if (userData.role === 'counsellor') {
          counsellors++
          if (userData.approved === false) {
            pendingApprovals++
          } else if (userData.approved === true) {
            approvedCounsellors++
          }
        }
        
        // Count blocked users
        if (userData.blocked) {
          blockedUsers++
        }
      })

      // Fetch sessions count (if sessions collection exists)
      let totalSessions = 0
      try {
        const sessionsRef = collection(db, 'sessions')
        const sessionsSnapshot = await getDocs(sessionsRef)
        totalSessions = sessionsSnapshot.size
      } catch (sessionError) {
        console.log('Sessions collection not found, setting to 0')
      }

      setStats({
        totalStudents: students,
        totalCounsellors: counsellors,
        pendingApprovals,
        totalSessions,
        approvedCounsellors,
        blockedUsers
      })

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  const handleNavigateToPendingApprovals = () => {
    navigate('/admin/counsellors?filter=pending')
  }

  const handleNavigateToStudents = () => {
    navigate('/admin/students')
  }

  const handleNavigateToCounsellors = () => {
    navigate('/admin/counsellors')
  }

  const handleAddCounsellor = () => {
    navigate('/admin/counsellors?action=add')
  }

  const handleViewAnalytics = () => {
    navigate('/admin/analytics')
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
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
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's what's happening with ZenCare today.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={refreshing ? <CircularProgress size={20} /> : <Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
          sx={{ borderRadius: 2 }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<School />}
            color={theme.palette.primary.main}
            loading={loading}
            trend={true}
            trendValue={12}
            onClick={handleNavigateToStudents}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Counsellors"
            value={stats.totalCounsellors}
            icon={<Psychology />}
            color={theme.palette.secondary.main}
            loading={loading}
            trend={true}
            trendValue={8}
            onClick={handleNavigateToCounsellors}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={<PendingActions />}
            color={theme.palette.warning.main}
            loading={loading}
            onClick={handleNavigateToPendingApprovals}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon={<Analytics />}
            color={theme.palette.success.main}
            loading={loading}
            trend={true}
            trendValue={25}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              boxShadow: theme.shadows[4]
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              System Overview
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                    {stats.approvedCounsellors}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved Counsellors
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                    {stats.blockedUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Blocked Users
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: theme.shadows[4]
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddCounsellor}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  borderRadius: 2
                }}
                fullWidth
              >
                Add New Counsellor
              </Button>
              <Button
                variant="contained"
                startIcon={<Assignment />}
                onClick={handleNavigateToPendingApprovals}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  borderRadius: 2
                }}
                fullWidth
              >
                Pending Approvals ({stats.pendingApprovals})
              </Button>
              <Button
                variant="contained"
                startIcon={<Analytics />}
                onClick={handleViewAnalytics}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  borderRadius: 2
                }}
                fullWidth
              >
                View Analytics
              </Button>
            </Box>
            
            <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.3)' }} />
            
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              System Health
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Database Status
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={85} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#4caf50'
                  }
                }} 
              />
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                85% Healthy
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}