import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip
} from '@mui/material'
import {
  Report,
  Warning,
  Block,
  Send
} from '@mui/icons-material'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

const reportTypes = [
  {
    id: 'inappropriate_behavior',
    label: 'Inappropriate Behavior',
    description: 'Unprofessional conduct or inappropriate comments'
  },
  {
    id: 'harassment',
    label: 'Harassment',
    description: 'Unwanted contact or harassment'
  },
  {
    id: 'privacy_violation',
    label: 'Privacy Violation',
    description: 'Sharing personal information without consent'
  },
  {
    id: 'unprofessional_conduct',
    label: 'Unprofessional Conduct',
    description: 'Behavior that violates professional standards'
  },
  {
    id: 'spam_abuse',
    label: 'Spam or Abuse',
    description: 'Spam messages or abusive language'
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other concerns not listed above'
  }
]

const severityLevels = [
  { id: 'low', label: 'Low', color: 'success' },
  { id: 'medium', label: 'Medium', color: 'warning' },
  { id: 'high', label: 'High', color: 'error' },
  { id: 'critical', label: 'Critical', color: 'error' }
]

export default function ReportingSystem({ 
  open, 
  onClose, 
  reportedUser, 
  sessionId = null,
  context = 'general' // 'chat', 'booking', 'general'
}) {
  const { user } = useAuth()
  const [reportType, setReportType] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [description, setDescription] = useState('')
  const [evidence, setEvidence] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitReport = async () => {
    if (!reportType || !description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)

      const reportData = {
        // Reporter information
        reporterId: anonymous ? null : user.uid,
        reporterEmail: anonymous ? null : user.email,
        reporterRole: anonymous ? null : user.role || 'student',
        
        // Reported user information
        reportedUserId: reportedUser.id,
        reportedUserEmail: reportedUser.email,
        reportedUserRole: reportedUser.role,
        reportedUserName: reportedUser.name || `${reportedUser.profile?.firstName} ${reportedUser.profile?.lastName}`,
        
        // Report details
        type: reportType,
        severity,
        description: description.trim(),
        evidence: evidence.trim(),
        context,
        sessionId,
        
        // Metadata
        status: 'open', // 'open', 'investigating', 'resolved', 'closed'
        priority: severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'normal',
        anonymous,
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Auto-assign to college head if available
        assignedTo: null, // Will be set by backend logic
        collegeId: reportedUser.college?.id || null
      }

      // Save report
      const reportRef = await addDoc(collection(db, 'user_reports'), reportData)

      // Create notification for college head
      if (reportedUser.college?.id) {
        await addDoc(collection(db, 'notifications'), {
          type: 'new_report',
          title: 'New User Report',
          message: `A ${reportType.replace('_', ' ')} report has been submitted regarding ${reportedUser.name || 'a user'}.`,
          reportId: reportRef.id,
          severity,
          collegeId: reportedUser.college.id,
          targetRole: 'college_head',
          read: false,
          createdAt: new Date()
        })
      }

      // Create admin notification for critical reports
      if (severity === 'critical') {
        await addDoc(collection(db, 'notifications'), {
          type: 'critical_report',
          title: 'Critical User Report',
          message: `A critical ${reportType.replace('_', ' ')} report requires immediate attention.`,
          reportId: reportRef.id,
          severity,
          targetRole: 'admin',
          read: false,
          createdAt: new Date()
        })
      }

      toast.success('Report submitted successfully')
      onClose()
      
      // Reset form
      setReportType('')
      setSeverity('medium')
      setDescription('')
      setEvidence('')
      setAnonymous(false)

    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Report color="error" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Report User
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Report inappropriate behavior or policy violations
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* User being reported */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Reporting:</strong> {reportedUser.name || `${reportedUser.profile?.firstName} ${reportedUser.profile?.lastName}`}
            {reportedUser.role && (
              <Chip 
                label={reportedUser.role} 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Alert>

        {/* Report Type */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Report Type *</InputLabel>
          <Select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            label="Report Type *"
          >
            {reportTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                <Box>
                  <Typography variant="body1">{type.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {type.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Severity */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Severity Level
          </Typography>
          <RadioGroup
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            row
          >
            {severityLevels.map((level) => (
              <FormControlLabel
                key={level.id}
                value={level.id}
                control={<Radio />}
                label={
                  <Chip 
                    label={level.label} 
                    size="small" 
                    color={level.color}
                    variant="outlined"
                  />
                }
              />
            ))}
          </RadioGroup>
        </FormControl>

        {/* Description */}
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Description *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please describe what happened in detail. Include specific examples of the behavior or incident."
          sx={{ mb: 3 }}
          required
        />

        {/* Evidence */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Evidence (Optional)"
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          placeholder="Any additional evidence such as specific messages, timestamps, or other relevant details."
          sx={{ mb: 3 }}
        />

        {/* Anonymous Option */}
        <FormControl sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Report Anonymously
          </Typography>
          <RadioGroup
            value={anonymous}
            onChange={(e) => setAnonymous(e.target.value === 'true')}
          >
            <FormControlLabel
              value={false}
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body2">Include my information</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Your identity will be shared with administrators for follow-up
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              value={true}
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body2">Submit anonymously</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Your identity will be kept confidential
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>

        {/* Important Notice */}
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Important:</strong> False reports or misuse of the reporting system may result in 
            disciplinary action. Please ensure your report is accurate and made in good faith.
          </Typography>
        </Alert>

        {/* What happens next */}
        <Alert severity="info">
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>What happens next:</strong>
          </Typography>
          <Typography variant="body2" component="div">
            • Your report will be reviewed by your College Head within 24 hours
            • {severity === 'critical' && 'Critical reports are escalated to administrators immediately'}
            • {severity === 'high' && 'High priority reports receive expedited review'}
            • You will be notified of any actions taken (if not anonymous)
            • All reports are handled confidentially and professionally
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmitReport}
          disabled={!reportType || !description.trim() || submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
          sx={{ borderRadius: 2, px: 3 }}
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Component for College Heads to manage reports
export function ReportManagement() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [actionDialog, setActionDialog] = useState(false)
  const [actionType, setActionType] = useState('') // 'block', 'warn', 'dismiss'
  const [actionReason, setActionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  // This would be implemented with proper data fetching and management
  // For now, showing the structure

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Report Management
      </Typography>
      
      {/* Reports would be displayed here with actions */}
      <Alert severity="info">
        Report management interface for College Heads to review and take action on user reports.
      </Alert>
    </Box>
  )
}