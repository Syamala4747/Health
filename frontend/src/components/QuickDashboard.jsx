import { Box, Typography, Skeleton, Card, CardContent } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const QuickDashboard = ({ userRole }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Simulate minimal loading time
    const timer = setTimeout(() => setIsLoaded(true), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto-navigate to full dashboard after 1.5 seconds for better UX
    const timer = setTimeout(() => {
      navigate(`/${userRole}`, { replace: true })
    }, 1500)

    return () => clearTimeout(timer)
  }, [navigate, userRole])

  const getDashboardTitle = () => {
    switch (userRole) {
      case 'admin':
        return 'Admin Dashboard'
      case 'counsellor':
        return 'Counsellor Dashboard'
      case 'student':
        return 'Student Dashboard'
      default:
        return 'Dashboard'
    }
  }

  const getQuickStats = () => {
    switch (userRole) {
      case 'admin':
        return [
          { label: 'Total Users', value: '---', loading: !isLoaded },
          { label: 'Active Sessions', value: '---', loading: !isLoaded },
          { label: 'Pending Approvals', value: '---', loading: !isLoaded },
        ]
      case 'counsellor':
        return [
          { label: 'My Students', value: '---', loading: !isLoaded },
          { label: 'Today\'s Sessions', value: '---', loading: !isLoaded },
          { label: 'Pending Tasks', value: '---', loading: !isLoaded },
        ]
      case 'student':
        return [
          { label: 'Upcoming Sessions', value: '---', loading: !isLoaded },
          { label: 'Resources Available', value: '---', loading: !isLoaded },
          { label: 'Progress Score', value: '---', loading: !isLoaded },
        ]
      default:
        return []
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {getDashboardTitle()}
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome back! Here's your overview.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mt: 3 }}>
        {getQuickStats().map((stat, index) => (
          <Card key={index} sx={{ minHeight: 120 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {stat.label}
              </Typography>
              {stat.loading ? (
                <Skeleton variant="text" width="60%" height={40} />
              ) : (
                <Typography variant="h4" color="primary">
                  {stat.value}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" color="info.contrastText">
          📊 Dashboard is loading additional content in the background...
        </Typography>
      </Box>
    </Box>
  )
}

export default QuickDashboard