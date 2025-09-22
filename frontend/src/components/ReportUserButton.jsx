import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  IconButton,
  CircularProgress
} from '@mui/material'
import { Report, Close } from '@mui/icons-material'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function ReportUserButton({ 
  targetUserId, 
  targetUserName, 
  targetUserRole,
  buttonProps = {},
  variant = 'button' // 'button' or 'icon'
}) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' })
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    severity: 'medium'
  })

  const reportReasons = [
    'Inappropriate behavior',
    'Harassment or bullying',
    'Spam or unwanted messages',
    'Inappropriate content sharing',
    'Professional misconduct',
    'Violation of platform rules',
    'Other'
  ]

  const handleSubmit = async () => {
    if (!formData.reason.trim()) {
      setAlert({
        show: true,
        message: 'Please select a reason for reporting',
        severity: 'error'
      })
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, 'reports'), {
        reporterUserId: user.uid,
        reportedUserId: targetUserId,
        reason: formData.reason,
        description: formData.description.trim(),
        severity: formData.severity,
        status: 'pending',
        createdAt: serverTimestamp(),
        targetUserName: targetUserName,
        targetUserRole: targetUserRole
      })

      setAlert({
        show: true,
        message: 'Report submitted successfully. Our team will review it shortly.',
        severity: 'success'
      })

      // Reset form
      setFormData({
        reason: '',
        description: '',
        severity: 'medium'
      })

      // Close dialog after a delay
      setTimeout(() => {
        setOpen(false)
        setAlert({ show: false, message: '', severity: 'info' })
      }, 2000)

    } catch (error) {
      console.error('Error submitting report:', error)
      setAlert({
        show: true,
        message: 'Failed to submit report. Please try again.',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setOpen(false)
      setAlert({ show: false, message: '', severity: 'info' })
    }
  }

  const ReportButtonComponent = variant === 'icon' ? (
    <IconButton
      color="error"
      onClick={() => setOpen(true)}
      size="small"
      {...buttonProps}
    >
      <Report />
    </IconButton>
  ) : (
    <Button
      variant="outlined"
      color="error"
      startIcon={<Report />}
      onClick={() => setOpen(true)}
      size="small"
      {...buttonProps}
    >
      Report User
    </Button>
  )

  return (
    <>
      {ReportButtonComponent}
      
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Box>
            <Typography variant="h6" component="div">
              Report User
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Report {targetUserName} ({targetUserRole})
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={loading}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {alert.show && (
            <Alert 
              severity={alert.severity} 
              sx={{ mb: 3 }}
              onClose={() => setAlert({ show: false, message: '', severity: 'info' })}
            >
              {alert.message}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Reason for reporting *</InputLabel>
              <Select
                value={formData.reason}
                label="Reason for reporting *"
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                disabled={loading}
              >
                {reportReasons.map(reason => (
                  <MenuItem key={reason} value={reason}>
                    {reason}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Additional details (optional)"
              placeholder="Please provide any additional context or details about this report..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
            />

            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={formData.severity}
                label="Severity"
                onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                disabled={loading}
              >
                <MenuItem value="low">Low - Minor issue</MenuItem>
                <MenuItem value="medium">Medium - Moderate concern</MenuItem>
                <MenuItem value="high">High - Serious violation</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info" sx={{ mt: 1 }}>
              All reports are reviewed by our moderation team. False reports may result in account restrictions.
            </Alert>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            color="error"
            disabled={loading || !formData.reason.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <Report />}
            sx={{ borderRadius: 2 }}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}