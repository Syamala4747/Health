import { Box, CircularProgress, Typography, LinearProgress } from '@mui/material'

const LoadingScreen = ({ message = "Loading...", showProgress = false }) => {
  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: '#f8fafc',
        gap: 2
      }}
    >
      <CircularProgress 
        size={60} 
        thickness={4}
        sx={{ color: '#7c3aed' }}
      />
      <Typography 
        variant="h6" 
        color="text.secondary"
        sx={{ mt: 2 }}
      >
        {message}
      </Typography>
      {showProgress && (
        <LinearProgress 
          sx={{ 
            width: 300, 
            mt: 1,
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#7c3aed'
            }
          }} 
        />
      )}
    </Box>
  )
}

export default LoadingScreen