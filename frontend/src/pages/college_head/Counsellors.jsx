import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Alert,
  Box,
  Tab,
  Tabs,
  useTheme
} from '@mui/material'
import {
  Psychology,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLocation } from 'react-router-dom'
import CounselorApprovals from './CounselorApprovals.jsx'
import StudentsManagement from './StudentsManagement.jsx'

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  )
}

export default function CollegeHeadCounsellors() {
  const theme = useTheme()
  const { userRole } = useAuth()
  const location = useLocation()
  const [tabValue, setTabValue] = useState(0)

  // Check URL params for initial tab
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (tab === 'approvals') {
      setTabValue(0)
    } else if (tab === 'active') {
      setTabValue(1)
    }
  }, [location])

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  if (userRole !== 'college_head') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          Access denied. This page is only available to College Heads.
        </Alert>
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Psychology />
          Counselor Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage counselor applications and active counselors for your college
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Pending Approvals" />
          <Tab label="Active Counselors" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <CounselorApprovals />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Psychology sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Active Counselors Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This section will show active counselors and their management options
          </Typography>
        </Box>
      </TabPanel>
    </Container>
  )
}