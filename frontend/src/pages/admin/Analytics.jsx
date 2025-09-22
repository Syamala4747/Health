import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Container,
  Paper,
  useTheme,
  alpha,
      setError('')
      
      // Fetch students from users collection where role='student'
      const usersRef = collection(db, 'users')
      const studentsQuery = query(usersRef, where('role', '==', 'student'))
      const studentsSnapshot = await getDocs(studentsQuery)
      
      // Fetch counsellors from separate collection
      const counsellorsRef = collection(db, 'counsellors')
      const counsellorsSnapshot = await getDocs(counsellorsRef)
      
      // Fetch admins from users collection
      const adminsQuery = query(usersRef, where('role', '==', 'admin'))
      const adminsSnapshot = await getDocs(adminsQuery)ss,
  Chip,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import {
  People,
  Psychology,
  TrendingUp,
  Assessment,
  School,
  LocationOn
} from '@mui/icons-material'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/firebase.js'

const StatCard = ({ title, value, icon, color, subtitle, trend }) => {
  const theme = useTheme()
  
  return (
    <Card sx={{ 
      height: '100%',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 3,
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
      }
    }}>
      <CardContent sx={{ p: 3, pb: '24px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ 
              color: theme.palette.text.secondary,
              fontWeight: 500,
              fontSize: '0.875rem',
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ 
              fontWeight: 700,
              color: theme.palette.text.primary,
              fontSize: '2.5rem',
              lineHeight: 1,
              mb: subtitle ? 0.5 : 0
            }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.75rem'
              }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ 
            bgcolor: alpha(color, 0.1),
            color: color,
            width: 56, 
            height: 56,
            '& .MuiSvgIcon-root': {
              fontSize: '1.75rem'
            }
          }}>
            {icon}
          </Avatar>
        </Box>
        
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={`${trend > 0 ? '+' : ''}${trend}%`}
              size="small"
              sx={{
                backgroundColor: trend > 0 
                  ? alpha(theme.palette.success.main, 0.1)
                  : alpha(theme.palette.error.main, 0.1),
                color: trend > 0 
                  ? theme.palette.success.main
                  : theme.palette.error.main,
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                borderRadius: 2,
                border: 'none'
              }}
            />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              vs last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default function Analytics() {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analyticsData, setAnalyticsData] = useState({
    users: [],
    barChartData: [],
    pieChartData: [],
    growthData: [],
    stats: {
      totalStudents: 0,
      totalCounsellors: 0,
      approvedCounsellors: 0,
      pendingCounsellors: 0,
      blockedUsers: 0,
      activeUsers: 0
    }
  })

  const fetchAnalyticsData = async () => {
    try {
      setError('')
      
      // Fetch students from users collection where role='student'
      const usersRef = collection(db, 'users')
      const studentsQuery = query(usersRef, where('role', '==', 'student'))
      const studentsSnapshot = await getDocs(studentsQuery)
      
      // Fetch counsellors from separate collection
      const counsellorsRef = collection(db, 'counsellors')
      const counsellorsSnapshot = await getDocs(counsellorsRef)
      
      // Fetch admins from users collection
      const adminsQuery = query(usersRef, where('role', '==', 'admin'))
      const adminsSnapshot = await getDocs(adminsQuery)

      let students = 0
      let counsellors = 0
      let approvedCounsellors = 0
      let pendingCounsellors = 0
      let blockedUsers = 0
      let activeUsers = 0
      
      const users = []
      const collegeStats = {}
      
      // Process students
      studentsSnapshot.forEach((doc) => {
        const data = doc.data()
        users.push({ id: doc.id, ...data, role: 'student' })
        students++
        if (!data.blocked) activeUsers++
        if (data.blocked) blockedUsers++
        
        // Count by college
        const college = data.university || data.college || 'Unknown College'
        collegeStats[college] = (collegeStats[college] || 0) + 1
      })
      
      // Process counsellors
      counsellorsSnapshot.forEach((doc) => {
        const data = doc.data()
        users.push({ id: doc.id, ...data, role: 'counsellor' })
        counsellors++
        if (data.approved === false) pendingCounsellors++
        else if (data.approved === true) approvedCounsellors++
        if (!data.blocked) activeUsers++
        if (data.blocked) blockedUsers++
      })
      
      // Process admins
      adminsSnapshot.forEach((doc) => {
        const data = doc.data()
        users.push({ id: doc.id, ...data })
        if (!data.blocked) activeUsers++
        if (data.blocked) blockedUsers++
      })

      // Prepare bar chart data
      const barChartData = [
        {
          name: 'Students',
          total: students,
          active: students - blockedUsers,
          blocked: blockedUsers,
          color: '#4facfe'
        },
        {
          name: 'Counsellors',
          total: counsellors,
          approved: approvedCounsellors,
          pending: pendingCounsellors,
          color: '#f093fb'
        }
      ]

      // Prepare pie chart data
      const pieChartData = [
        { name: 'Students', value: students, color: '#4facfe' },
        { name: 'Approved Counsellors', value: approvedCounsellors, color: '#4caf50' },
        { name: 'Pending Counsellors', value: pendingCounsellors, color: '#ff9800' },
      ]

      // Growth simulation data (in real app, this would come from historical data)
      const growthData = [
        { month: 'Apr', students: Math.max(0, students - 50), counsellors: Math.max(0, counsellors - 8) },
        { month: 'May', students: Math.max(0, students - 40), counsellors: Math.max(0, counsellors - 6) },
        { month: 'Jun', students: Math.max(0, students - 30), counsellors: Math.max(0, counsellors - 4) },
        { month: 'Jul', students: Math.max(0, students - 20), counsellors: Math.max(0, counsellors - 3) },
        { month: 'Aug', students: Math.max(0, students - 10), counsellors: Math.max(0, counsellors - 2) },
        { month: 'Sep', students, counsellors },
      ]

      setAnalyticsData({
        users,
        barChartData,
        pieChartData,
        growthData,
        stats: {
          totalStudents: students,
          totalCounsellors: counsellors,
          approvedCounsellors,
          pendingCounsellors,
          blockedUsers,
          activeUsers
        }
      })

    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError('Failed to load analytics data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const COLORS = ['#4facfe', '#4caf50', '#ff9800', '#f44336']

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
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
          Analytics Dashboard
        </Typography>
        <Typography variant="h6" sx={{ 
          color: theme.palette.text.secondary,
          fontWeight: 400,
          maxWidth: 600
        }}>
          Comprehensive insights into user engagement and platform performance
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Students"
            value={analyticsData.stats.totalStudents}
            subtitle="Registered students"
            icon={<People />}
            color={theme.palette.primary.main}
            trend={15}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Counsellors"
            value={analyticsData.stats.approvedCounsellors}
            subtitle="Approved & active"
            icon={<Psychology />}
            color={theme.palette.success.main}
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Pending Approvals"
            value={analyticsData.stats.pendingCounsellors}
            subtitle="Awaiting verification"
            icon={<Assessment />}
            color={theme.palette.warning.main}
            trend={-5}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Users"
            value={analyticsData.stats.activeUsers}
            subtitle="Non-blocked users"
            icon={<TrendingUp />}
            color={theme.palette.info.main}
            trend={12}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {/* Bar Chart - Students vs Counsellors */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                Users Overview - Students vs Counsellors
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[8]
                      }}
                    />
                    <Bar dataKey="total" fill="#4facfe" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="approved" fill="#4caf50" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" fill="#ff9800" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie Chart - User Distribution */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                User Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {analyticsData.pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {analyticsData.pieChartData.map((entry, index) => (
                  <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      backgroundColor: COLORS[index % COLORS.length],
                      borderRadius: 1,
                      mr: 1 
                    }} />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {entry.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {entry.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Growth Trends */}
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                Growth Trends - Last 6 Months
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.growthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4facfe" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4facfe" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCounsellors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f093fb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f093fb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                    <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[8]
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="students"
                      stroke="#4facfe"
                      fillOpacity={1}
                      fill="url(#colorStudents)"
                      strokeWidth={3}
                    />
                    <Area
                      type="monotone"
                      dataKey="counsellors"
                      stroke="#f093fb"
                      fillOpacity={1}
                      fill="url(#colorCounsellors)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}