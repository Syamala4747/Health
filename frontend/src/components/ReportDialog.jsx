import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  FormControl, InputLabel, Select, MenuItem, TextField, Box, Alert, CircularProgress
} from '@mui/material'
import { Report, Warning } from '@mui/icons-material'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

const REPORT_REASONS = [
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'unprofessional_conduct', label: 'Unprofessional Conduct' },
  { value: 'privacy_violation', label: 'Privacy Violation' },
  { value: 'spam', label: 'Spam or Irrelevant Content' },
  { value: 'safety_concern', label: 'Safety Concern' },
  { value: 'other', label: 'Other' }
]

export default function ReportDialog({ open, onClose, reportedUserId, reportedUserRole, sessionId }) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason for reporting')
      return
    }

    if (!description.trim()) {
      toast.error('Please provide a description of the issue')
      return
    }

    try {
      setSubmitting(true)
      
      // Submit report
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        reportedUserId,
        reportedUserRole,
        sessionId: sessionId || null,
        reason,
        description: description.trim(),
        status: 'open',
        priority: reason === 'safety_concern' ? 'high' : 'medium',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Create notification for college head
      await addDoc(collection(db, 'notifications'), {
        type: 'new_report',
        title: 'New User Report',
        message: `A ${reportedUserRole} has been reported for ${reason.replace('_', ' ')}`,
        reportId: 'pending', // Will be updated by the system
        priority: reason === 'safety_concern' ? 'high' : 'medium',
        read: false,
        createdAt: serverTimestamp()
      })
      
      toast.success('Report submitted successfully. We will review it promptly.')
      onClose()
      
      // Reset form
      setReason('')
      setDescription('')
      
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Report color="error" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Report User
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Reports are taken seriously and will be reviewed by your College Head. 
            False reports may result in action against your account.
          </Typography>
        </Alert>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Reason for Report</InputLabel>
          <Select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            label="Reason for Report"
          >
            {REPORT_REASONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide specific details about the incident, including what happened and when..."
          required
        />
        
        {reason === 'safety_concern' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Safety Concern:</strong> If you are in immediate danger, 
              please contact emergency services (911) or campus security immediately.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="error"
          onClick={handleSubmit}
          disabled={!reason || !description.trim() || submitting}
        >
          {submitting ? <CircularProgress size={20} /> : 'Submit Report'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}