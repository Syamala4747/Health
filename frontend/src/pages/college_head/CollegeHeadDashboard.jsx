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
  Alert,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material'
import {
  Psychology,
  School,
  TrendingUp,
  Group,
  Assignment,
  Dashboard as DashboardIcon,
  Person,
  Block,
  CheckCircle
} from '@mui/icons-material'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// StatCard Component
const StatCard = ({ title, value, icon, color, loading, onClick, subtitle }) => {
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
          transform: onClick ? 'translateY(-4px)' : 'none',
          boxShadow: onClick ? '0 12px 24px rgba(0,0,0,0.1)' : theme.shadows[1],
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
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: alpha(color, 0.1),
              color: color,
              width: 56, 
              height: 56
            }}
          >
            {icon}
          </Avatar>
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
                fontSize: '2rem',
                lineHeight: 1
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
        </Box>
      </CardContent>
    </Card>
  )
}

export default function CollegeHeadDashboard() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userCollege, setUserCollege] = useState(null)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCounselors: 0,
    activeCounselors: 0,
    pendingApprovals: 0,
    blockedUsers: 0
  })

  const fetchUserCollege = async () => {
    try {
      console.log('🔍 Fetching college head data for:', user.email)
      
      // First try to get from college_heads collection
      const collegeHeadQuery = query(
        collection(db, 'college_heads'),
        where('email', '==', user.email)
      )
      
      const collegeHeadSnapshot = await getDocs(collegeHeadQuery)
      if (!collegeHeadSnapshot.empty) {
        const collegeHeadData = collegeHeadSnapshot.docs[0].data()
        console.log('✅ Found college head data:', collegeHeadData)
        
        // Ensure college data has proper structure
        let college = collegeHeadData.college
        if (typeof college === 'string') {
          college = { name: college, id: college }
        } else if (college && !college.id && college.name) {
          college.id = college.name
        }
        
        setUserCollege(college)
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
        
        setUserCollege(college)
        return college
      }
      return null
    } catch (error) {
      console.error('Error fetching user college:', error)
      return null
    }
  }

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      const college = await fetchUserCollege()
      if (!college) {
        toast.error('Unable to determine your college affiliation')
        return
      }

      console.log('📊 Fetching statistics for college:', college.name)

      // Import the college filter utilities
      const { getCollegeStudents, getCollegeCounsellors } = await import('../../utils/collegeFilter')
      
      try {
        // Fetch students from the same college
        const students = await getCollegeStudents(college)
        console.log('✅ Found students:', students.length)
        
        // Fetch counselors from the same college
        const counsellors = await getCollegeCounsellors(college)
        console.log('✅ Found counsellors:', counsellors.length)
        
        // Fetch pending counselor requests with proper error handling
        let pendingRequests = []
        try {
          if (college.id) {
            const pendingQuery = query(
              collection(db, 'counselor_requests'),
              where('status', '==', 'pending'),
              where('collegeId', '==', college.id)
            )
            const pendingSnapshot = await getDocs(pendingQuery)
            pendingSnapshot.forEach(doc => {
              pendingRequests.push({ id: doc.id, ...doc.data() })
            })
          }
        } catch (requestError) {
          console.warn('⚠️ Counselor requests collection not found or error:', requestError)
          // Continue without pending requests if collection doesn't exist
        }

        let totalStudents = 0
        let blockedStudents = 0
        let totalCounselors = 0
        let activeCounselors = 0
        let blockedCounselors = 0

        // Process students
        if (students && Array.isArray(students)) {
          students.forEach((student) => {
            totalStudents++
            if (student.blocked) blockedStudents++
          })
        }

        // Process counselors
        if (counsellors && Array.isArray(counsellors)) {
          counsellors.forEach((counsellor) => {
            totalCounselors++
            if (counsellor.blocked) {
              blockedCounselors++
            } else if (counsellor.approved) {
              activeCounselors++
            }
          })
        }

        setStats({
          totalStudents,
          totalCounselors,
          activeCounselors,
          pendingApprovals: pendingRequests.length,
          blockedUsers: blockedStudents + blockedCounselors
        })
        
        console.log('✅ System statistics updated:', {
          totalStudents,
          totalCounselors,
          activeCounselors,
          pendingApprovals: pendingRequests.length,
          blockedUsers: blockedStudents + blockedCounselors
        })

      } catch (fetchError) {
        console.error('Error fetching dashboard stats:', fetchError)
        toast.error('Failed to load dashboard statistics')
      }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast.error('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.email) {
      fetchDashboardStats()
    }
  }, [user])

  const handleNavigateToStudents = () => {
    navigate('/college-head/students-management')
  }

  const handleNavigateToCounselors = () => {
    navigate('/college-head/counsellors-management')
  }

  const handleNavigateToApprovals = () => {
    navigate('/college-head/counsellors-management?filter=pending')
  }

  const handleNavigateToAnalytics = () => {
    navigate('/college-head/analytics')
  }

  const handleNavigateToReports = () => {
    navigate('/college-head/reports')
  }

  if (userRole !== 'college_head') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          Access denied. This dashboard is only available to College Heads.
        </Alert>
      </Container>
    )
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
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          College Head Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {userCollege?.name || 'Your College'}
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            subtitle="Registered students"
            icon={<Person />}
            color={theme.palette.primary.main}
            loading={loading}
            onClick={handleNavigateToStudents}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Counselors"
            value={stats.activeCounselors}
            subtitle="Approved counselors"
            icon={<Psychology />}
            color={theme.palette.success.main}
            loading={loading}
            onClick={handleNavigateToCounselors}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            subtitle="Counselor applications"
            icon={<Assignment />}
            color={theme.palette.warning.main}
            loading={loading}
            onClick={handleNavigateToApprovals}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Blocked Users"
            value={stats.blockedUsers}
            subtitle="Students & counselors"
            icon={<Block />}
            color={theme.palette.error.main}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 3,
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
                    startIcon={<Psychology />}
                    onClick={handleNavigateToApprovals}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5
                    }}
                    fullWidth
                  >
                    Review Approvals ({stats.pendingApprovals})
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    startIcon={<Person />}
                    onClick={handleNavigateToStudents}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5
                    }}
                    fullWidth
                  >
                    Manage Students
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<TrendingUp />}
                    onClick={handleNavigateToAnalytics}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5
                    }}
                    fullWidth
                  >
                    View Analytics Dashboard
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<Assignment />}
                    onClick={handleNavigateToReports}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5
                    }}
                    fullWidth
                  >
                    Manage Reports & Issues
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                College Overview
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 1 }}>
                      {stats.activeCounselors}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                      Active Counselors
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
                      {stats.totalStudents}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                      Total Students
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                      Platform Health
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your college's mental health support system is active with {stats.activeCounselors} counselors 
                      serving {stats.totalStudents} students.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}