import { Container, Typography, Alert } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function CollegeHeadAnalytics() {
  const { userRole } = useAuth()

  if (userRole !== 'college_head') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. This page is only available to College Heads.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        College Analytics
      </Typography>
      <Alert severity="info">
        This page is under development. Analytics and reporting features will be available soon.
      </Alert>
    </Container>
  )
}