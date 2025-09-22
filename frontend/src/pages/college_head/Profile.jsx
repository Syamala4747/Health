import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Box,
  TextField,
  Button,
  Divider,
  Alert,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Business,
  Email,
  Phone,
  Badge,
  School,
  Edit,
  Save,
  Cancel,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

// Mock college head profile data
const mockProfileData = {
  uid: 'college-head-001',
  name: 'Dr. Rajesh Kumar',
  email: 'rajesh.kumar@university.edu',
  college: 'Indian Institute of Technology Delhi',
  designation: 'Dean of Student Affairs',
  department: 'Student Welfare',
  phone: '+91-9876543210',
  experience: '15 years',
  joiningDate: new Date('2020-01-15'),
  idProofType: 'Employee ID',
  isActive: true,
  totalCounsellors: 8,
  totalStudents: 450,
  bio: 'Experienced educator and administrator with over 15 years in student welfare and academic administration. Committed to promoting mental health and wellness among students.',
  achievements: [
    'Implemented college-wide mental health initiative',
    'Increased counsellor-to-student ratio by 40%',
    'Launched peer support program',
    'Reduced student dropout rate by 15%'
  ]
}

export default function CollegeHeadProfile() {
  const { user, userRole, isFallbackMode } = useAuth()
  const [profileData, setProfileData] = useState(mockProfileData)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tempData, setTempData] = useState({})

  const handleEdit = () => {
    setTempData({ ...profileData })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setTempData({})
    setIsEditing(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // In real implementation, this would save to backend
      setProfileData({ ...tempData })
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field, value) => {
    setTempData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (userRole !== 'college_head') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. This page is only available to College Heads.
        </Alert>
      </Container>
    )
  }

  const displayData = isEditing ? tempData : profileData

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {isFallbackMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are currently using offline mode. Profile changes will not be saved.
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Business color="primary" />
          College Head Profile
        </Typography>
        {!isEditing ? (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEdit}
          >
            Edit Profile
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={loading}
            >
              Save Changes
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '3rem'
                }}
              >
                {displayData.name?.charAt(0) || 'U'}
              </Avatar>
              
              <Typography variant="h5" gutterBottom>
                {displayData.name}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {displayData.designation}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {displayData.college}
              </Typography>
              
              <Chip 
                label={displayData.isActive ? "Active" : "Inactive"}
                color={displayData.isActive ? "success" : "default"}
                sx={{ mt: 1 }}
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h6" color="primary">
                    {displayData.totalCounsellors}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Counsellors
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" color="primary">
                    {displayData.totalStudents}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Students
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email color="primary" />
                Contact Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={displayData.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={displayData.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={displayData.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="College/University"
                    value={displayData.college || ''}
                    onChange={(e) => handleFieldChange('college', e.target.value)}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge color="primary" />
                Professional Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Designation"
                    value={displayData.designation || ''}
                    onChange={(e) => handleFieldChange('designation', e.target.value)}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={displayData.department || ''}
                    onChange={(e) => handleFieldChange('department', e.target.value)}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Experience"
                    value={displayData.experience || ''}
                    onChange={(e) => handleFieldChange('experience', e.target.value)}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Joining Date"
                    value={displayData.joiningDate?.toLocaleDateString() || ''}
                    disabled
                    variant="filled"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={4}
                    value={displayData.bio || ''}
                    onChange={(e) => handleFieldChange('bio', e.target.value)}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                    placeholder="Tell us about yourself and your role..."
                  />
                </Grid>
                
                {isEditing && (
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={displayData.isActive || false}
                          onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                        />
                      }
                      label="Active Status"
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School color="primary" />
                Key Achievements
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                {displayData.achievements?.map((achievement, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">
                      • {achievement}
                    </Typography>
                  </Box>
                ))}
              </Box>
              
              {isEditing && (
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => {
                    // In real implementation, would allow editing achievements
                    toast.info('Achievement editing will be available soon')
                  }}
                >
                  Edit Achievements
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}