import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Rating, TextField, Box, Alert, CircularProgress
} from '@mui/material'
import { Star, Psychology } from '@mui/icons-material'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function FeedbackDialog({ open, onClose, counselorId, sessionId }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating')
      return
    }

    try {
      setSubmitting(true)
      
      // Submit anonymous feedback
      await addDoc(collection(db, 'feedback'), {
        counselorId,
        sessionId,
        rating,
        comment: comment.trim() || null,
        anonymous: true,
        createdAt: serverTimestamp()
      })
      
      toast.success('Thank you for your feedback!')
      onClose()
      
      // Reset form
      setRating(0)
      setComment('')
      
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Psychology color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Rate Your Session
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Your feedback is completely anonymous and helps us improve our counseling services.
        </Alert>
        
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            How would you rate your counseling session?
          </Typography>
          <Rating
            value={rating}
            onChange={(event, newValue) => setRating(newValue)}
            size="large"
            emptyIcon={<Star style={{ opacity: 0.55 }} fontSize="inherit" />}
          />
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Additional Comments (Optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about the session, what was helpful, or suggestions for improvement..."
          sx={{ mt: 2 }}
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Skip
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? <CircularProgress size={20} /> : 'Submit Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}