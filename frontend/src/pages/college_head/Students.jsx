import { Container, Alert } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext.jsx'
import StudentsManagement from './StudentsManagement.jsx'

export default function CollegeHeadStudents() {
  const { userRole } = useAuth()

  if (userRole !== 'college_head') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          Access denied. This page is only available to College Heads.
        </Alert>
      </Container>
    )
  }

  return <StudentsManagement />
}