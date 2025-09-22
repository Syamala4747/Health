import { useState } from 'react'
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material'
import {
  PlayArrow,
  CheckCircle,
  People,
  Psychology,
  AdminPanelSettings,
  Warning
} from '@mui/icons-material'
import { migrateUsersToSeparateCollections } from '../../utils/separateCollections.js'

export default function MigrationPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleMigration = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const migrationResult = await migrateUsersToSeparateCollections()
      setResult(migrationResult)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
        Database Migration Tool
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Separate Users into Individual Collections
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This migration will separate the current `users` collection into specialized collections:
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <People color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Users Collection (Students Only)"
                secondary="Will contain only student-specific fields: university, major, year, age, etc. Students stay in users table."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Psychology color="secondary" />
              </ListItemIcon>
              <ListItemText
                primary="Counsellors Collection"
                secondary="Contains only counsellor-specific fields: specialization, qualifications, experience, etc. Moved from users table."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AdminPanelSettings color="error" />
              </ListItemIcon>
              <ListItemText
                primary="Admins (Removed)"
                secondary="Admin users will be removed from all collections for separate management"
              />
            </ListItem>
          </List>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Important:</strong> This migration will create new collections. Make sure to backup your data before proceeding.
          </Alert>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Migration Error: {error}
        </Alert>
      )}

      {result && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success.main">
              <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
              Migration Completed Successfully!
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <Box>
                <Typography variant="h4" color="primary.main">
                  {result.studentsCreated}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Students Kept in Users
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" color="secondary.main">
                  {result.counsellorsCreated}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Counsellors Moved
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" color="error.main">
                  {result.adminsKept}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Admins Kept
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleMigration}
          disabled={loading || result?.success}
          startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
          sx={{ px: 4, py: 1.5 }}
        >
          {loading ? 'Running Migration...' : result?.success ? 'Migration Complete' : 'Start Migration'}
        </Button>
      </Box>

      {result?.success && (
        <Alert severity="success" sx={{ mt: 3 }}>
          🎉 Migration completed! The users table now contains only student details, and counsellor profiles are stored in a separate counsellors table, 
          eliminating null field issues and providing better data organization.
        </Alert>
      )}
    </Container>
  )
}