import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Avatar,
} from '@mui/material'
import {
  AdminPanelSettings,
  Psychology,
  School,
  Business,
} from '@mui/icons-material'

const roles = [
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Manage the platform',
    icon: <AdminPanelSettings sx={{ fontSize: 60 }} />,
    color: '#7c3aed',
  },
  {
    id: 'college_head',
    title: 'College Head',
    description: 'Manage college counsellors and students',
    icon: <Business sx={{ fontSize: 60 }} />,
    color: '#f59e0b',
  },
  {
    id: 'counsellor',
    title: 'Counsellor',
    description: 'Support students',
    icon: <Psychology sx={{ fontSize: 60 }} />,
    color: '#06b6d4',
  },
  {
    id: 'student',
    title: 'Student',
    description: 'Access wellness resources',
    icon: <School sx={{ fontSize: 60 }} />,
    color: '#10b981',
  },
]

export default function RoleSelection() {
  const navigate = useNavigate()

  const handleRoleSelect = (roleId) => {
    // In a real app, you'd update the user's role in the database
    // For now, we'll just navigate to the appropriate dashboard
    navigate(`/${roleId}`)
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          ZenCare Platform
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Please select your role to continue
        </Typography>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        {roles.map((role) => (
          <Grid item xs={12} sm={6} md={3} key={role.id}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardActionArea 
                onClick={() => handleRoleSelect(role.id)}
                sx={{ height: '100%', p: 3 }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      bgcolor: role.color,
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {role.icon}
                  </Avatar>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {role.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {role.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}