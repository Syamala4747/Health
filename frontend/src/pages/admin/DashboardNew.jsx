import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Divider,
  useTheme,
  alpha,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  People,
  Psychology,
  Assignment,
  TrendingUp,
  Add,
  Analytics,
  CheckCircle,
  PendingActions,
  Refresh,
  ChevronRight,
  Security,
  Schedule,
  Notifications,
  Settings,
  School,
} from '@mui/icons-material'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/firebase.js'
import { useNavigate } from 'react-router-dom'

// Professional StatCard Component
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
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCounsellors: 0,
    pendingApprovals: 0,
    pendingCollegeHeads: 0,
    totalSessions: 0,
    approvedCounsellors: 0,
    blockedUsers: 0
  })

  const fetchDashboardData = async () => {
    try {
      setError('')
      
      // Fetch students from separate collection
      const studentsRef = collection(db, 'students')
      const studentsSnapshot = await getDocs(studentsRef)
      
      // Fetch counsellors from separate collection
      const counsellorsRef = collection(db, 'counsellors')
      const counsellorsSnapshot = await getDocs(counsellorsRef)
      
      let students = 0
      let counsellors = 0
      let pendingApprovals = 0
      let approvedCounsellors = 0
      let blockedUsers = 0

      // Process students
      studentsSnapshot.forEach((doc) => {
        const data = doc.data()
        students++
        if (data.blocked) blockedUsers++
      })

      // Process counsellors
      counsellorsSnapshot.forEach((doc) => {
        const data = doc.data()
        counsellors++
        if (data.approved === false) {
          pendingApprovals++
        } else if (data.approved === true) {
          approvedCounsellors++
        }
        if (data.blocked) blockedUsers++
      })

      // Fetch sessions count
      let totalSessions = 0
      try {
        const sessionsRef = collection(db, 'sessions')
        const sessionsSnapshot = await getDocs(sessionsRef)
        totalSessions = sessionsSnapshot.size
      } catch (sessionError) {
        console.log('Sessions collection not found, setting to 0')
      }

      // Fetch pending college head requests
      let pendingCollegeHeads = 0
      try {
        const collegeHeadRequestsRef = collection(db, 'college_head_requests')
        const pendingCollegeHeadQuery = query(collegeHeadRequestsRef, where('status', '==', 'pending'))
        const pendingCollegeHeadSnapshot = await getDocs(pendingCollegeHeadQuery)
        pendingCollegeHeads = pendingCollegeHeadSnapshot.size
      } catch (collegeHeadError) {
        console.log('College head requests collection not found, setting to 0')
      }

      setStats({
        totalStudents: students,
        totalCounsellors: counsellors,
        pendingApprovals,
        pendingCollegeHeads,
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

  const handleNavigateToCollegeHeadApprovals = () => {
    navigate('/admin/college-head-approvals')
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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Modern Header Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800,
                color: theme.palette.text.primary,
                fontSize: { xs: '2rem', md: '2.5rem' },
                mb: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Admin Dashboard
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontWeight: 400,
                maxWidth: 600
              }}
            >
              Monitor and manage your mental health platform with comprehensive insights
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ 
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                px: 3
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
        </Box>
        
        {/* Quick Stats Bar */}
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexWrap: 'wrap'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.success.main, width: 48, height: 48 }}>
              <CheckCircle />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                {stats.approvedCounsellors}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Active Counsellors
              </Typography>
            </Box>
          </Box>
          
          <Divider orientation="vertical" flexItem />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.info.main, width: 48, height: 48 }}>
              <TrendingUp />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                98.5%
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                System Uptime
              </Typography>
            </Box>
          </Box>
          
          <Divider orientation="vertical" flexItem />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.error.main, width: 48, height: 48 }}>
              <Security />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                {stats.blockedUsers}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Blocked Users
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Professional Stats Grid */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            subtitle="Registered users seeking support"
            icon={<People />}
            color={theme.palette.primary.main}
            loading={loading}
            trend={true}
            trendValue={12}
            onClick={handleNavigateToStudents}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Counsellors"
            value={stats.totalCounsellors}
            subtitle="Mental health professionals"
            icon={<Psychology />}
            color={theme.palette.secondary.main}
            loading={loading}
            trend={true}
            trendValue={8}
            onClick={handleNavigateToCounsellors}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            subtitle="Counsellors awaiting verification"
            icon={<PendingActions />}
            color={theme.palette.warning.main}
            loading={loading}
            trend={true}
            trendValue={-5}
            onClick={handleNavigateToPendingApprovals}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="College Head Requests"
            value={stats.pendingCollegeHeads}
            subtitle="Pending college head approvals"
            icon={<School />}
            color={theme.palette.info.main}
            loading={loading}
            trend={true}
            trendValue={5}
            onClick={handleNavigateToCollegeHeadApprovals}
          />
        </Grid>
      </Grid>

      {/* Enhanced Action Cards */}
      <Grid container spacing={4}>
        {/* Modern Quick Actions */}
        <Grid item xs={12} lg={6}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddCounsellor}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5
                    }}
                    fullWidth
                  >
                    Add Counsellor
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    startIcon={<PendingActions />}
                    onClick={handleNavigateToPendingApprovals}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5
                    }}
                    fullWidth
                  >
                    Approvals ({stats.pendingApprovals})
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    startIcon={<School />}
                    onClick={handleNavigateToCollegeHeadApprovals}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5
                    }}
                    fullWidth
                  >
                    College Heads ({stats.pendingCollegeHeads})
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    startIcon={<Analytics />}
                    onClick={handleViewAnalytics}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5
                    }}
                    fullWidth
                  >
                    Analytics
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* System Overview */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', borderRadius: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                System Overview
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      borderRadius: 3,
                      background: alpha(theme.palette.success.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 1 }}>
                      {stats.approvedCounsellors}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                      Approved Counsellors
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      borderRadius: 3,
                      background: alpha(theme.palette.error.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.error.main, mb: 1 }}>
                      {stats.blockedUsers}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                      Blocked Users
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: alpha(theme.palette.info.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Platform Health
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                        98.5%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={98.5} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        background: alpha(theme.palette.success.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)'
                        }
                      }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}