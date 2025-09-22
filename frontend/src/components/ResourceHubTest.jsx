// Simple test component to verify ResourceHub works
import { useState } from 'react'
import { Box, Button, Typography, Alert } from '@mui/material'
import ResourceHub from './ResourceHub.jsx'

export default function ResourceHubTest() {
  const [showResourceHub, setShowResourceHub] = useState(false)
  const [error, setError] = useState(null)

  const handleTestResourceHub = () => {
    try {
      setShowResourceHub(true)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', m: 2 }}>
      <Typography variant="h6">ResourceHub Test</Typography>
      <Button onClick={handleTestResourceHub} variant="contained" sx={{ m: 1 }}>
        Test ResourceHub
      </Button>
      <Button onClick={() => setShowResourceHub(false)} variant="outlined" sx={{ m: 1 }}>
        Hide ResourceHub
      </Button>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error: {error}
        </Alert>
      )}
      
      {showResourceHub && (
        <Box sx={{ mt: 2 }}>
          <ResourceHub />
        </Box>
      )}
    </Box>
  )
}