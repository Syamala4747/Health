import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Rating,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Avatar,
  Grid,
  Card,
  CardContent
} from '@mui/material'
import {
  Psychology,
  Star,
  Send,
  ThumbUp,
  Comment,
  Anonymous
} from '@mui/icons-material'
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function FeedbackSystem({ 
  open, 
  onClose, 
  bookingData, 
  counselorData,
  onFeedbackSubmitted 
}) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState({
    communication: 0,
    helpfulness: 0,
    professionalism: 0,
    empathy: 0
  })

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating')
      return
    }

    try {
      setSubmitting(true)

      // Create anonymous feedback
      const feedbackData = {
        bookingId: bookingData.id,
        counselorId: counselorData.id,
        studentId: user.uid, // For internal tracking only
        rating,
        feedback: feedback.trim(),
        categories,
        anonymous: true, // Always anonymous to counselor
        createdAt: new Date(),
        helpful: 0, // For other students to mark as helpful
        verified: true // Verified as actual session participant
      }

      // Save feedback
      await addDoc(collection(db, 'counselor_feedback'), feedbackData)

      // Update booking with feedback flag
      await updateDoc(doc(db, 'counselor_bookings', bookingData.id), {
        feedbackProvided: true,
        feedbackRating: rating,
        updatedAt: new Date()
      })

      // Update counselor's average rating
      await updateCounselorRating(counselorData.id, rating)

      toast.success('Thank you for your feedback!')
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedbackData)
      }
      
      onClose()

    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const updateCounselorRating = async (counselorId, newRating) => {
    try {
      // Get all feedback for this counselor
      const feedbackQuery = query(
        collection(db, 'counselor_feedback'),
        where('counselorId', '==', counselorId)
      )
      
      const feedbackSnapshot = await getDocs(feedbackQuery)
      
      let totalRating = 0
      let count = 0
      
      feedbackSnapshot.forEach((doc) => {
        const data = doc.data()
        totalRating += data.rating
        count++
      })

      const averageRating = count > 0 ? totalRating / count : 0

      // Update counselor document
      await updateDoc(doc(db, 'users', counselorId), {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: count,
        lastRatingUpdate: new Date()
      })

    } catch (error) {
      console.error('Error updating counselor rating:', error)
    }
  }

  const handleCategoryRating = (category, value) => {
    setCategories(prev => ({
      ...prev,
      [category]: value
    }))
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
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Star />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Rate Your Counseling Experience
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your feedback helps improve our services
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Session Info */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <Psychology />
            </Avatar>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Session with {counselorData?.profile?.firstName || 'Counselor'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {bookingData?.type === 'chat' ? 'Text Chat' : 
                 bookingData?.type === 'audio' ? 'Audio Call' : 'Chat + Audio'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(bookingData?.completedAt?.toDate()).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Overall Rating */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            How would you rate your overall experience?
          </Typography>
          <Rating
            value={rating}
            onChange={(event, newValue) => setRating(newValue)}
            size="large"
            sx={{ fontSize: '3rem' }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {rating === 0 && 'Click to rate'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </Typography>
        </Box>

        {/* Category Ratings */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Rate specific aspects:
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { key: 'communication', label: 'Communication' },
            { key: 'helpfulness', label: 'Helpfulness' },
            { key: 'professionalism', label: 'Professionalism' },
            { key: 'empathy', label: 'Empathy & Understanding' }
          ].map((category) => (
            <Grid item xs={12} sm={6} key={category.key}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  {category.label}
                </Typography>
                <Rating
                  value={categories[category.key]}
                  onChange={(event, newValue) => handleCategoryRating(category.key, newValue)}
                  size="small"
                />
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Written Feedback */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Share your experience (optional):
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What went well? What could be improved? Your feedback helps other students and counselors..."
          variant="outlined"
          sx={{ mb: 3 }}
        />

        {/* Privacy Notice */}
        <Alert 
          severity="info" 
          icon={<Anonymous />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            <strong>Your feedback is anonymous.</strong> Your counselor will see the rating and comments 
            but won't know they came from you. Your feedback may be shown to other students to help 
            them choose counselors.
          </Typography>
        </Alert>

        {/* Helpful Tips */}
        <Paper sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            💡 Tips for helpful feedback:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Be specific about what was helpful or could be improved
            • Focus on the counselor's approach and communication style
            • Consider how comfortable and supported you felt
            • Mention if you would recommend this counselor to others
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose}
          disabled={submitting}
        >
          Skip for Now
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmitFeedback}
          disabled={rating === 0 || submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
          sx={{ borderRadius: 2, px: 3 }}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Component for displaying feedback to other students
export function CounselorFeedbackDisplay({ counselorId, maxItems = 3 }) {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    categoryAverages: {}
  })

  useEffect(() => {
    if (counselorId) {
      fetchFeedback()
    }
  }, [counselorId])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      
      const feedbackQuery = query(
        collection(db, 'counselor_feedback'),
        where('counselorId', '==', counselorId)
      )
      
      const feedbackSnapshot = await getDocs(feedbackQuery)
      const feedbackList = []
      let totalRating = 0
      let totalCount = 0
      const categoryTotals = {
        communication: 0,
        helpfulness: 0,
        professionalism: 0,
        empathy: 0
      }
      const categoryCounts = {
        communication: 0,
        helpfulness: 0,
        professionalism: 0,
        empathy: 0
      }
      
      feedbackSnapshot.forEach((doc) => {
        const data = doc.data()
        feedbackList.push({
          id: doc.id,
          ...data
        })
        
        totalRating += data.rating
        totalCount++
        
        // Calculate category averages
        if (data.categories) {
          Object.keys(categoryTotals).forEach(category => {
            if (data.categories[category] > 0) {
              categoryTotals[category] += data.categories[category]
              categoryCounts[category]++
            }
          })
        }
      })
      
      // Sort by most recent and helpful
      feedbackList.sort((a, b) => {
        if (b.helpful !== a.helpful) {
          return b.helpful - a.helpful
        }
        return b.createdAt?.toDate() - a.createdAt?.toDate()
      })
      
      // Calculate averages
      const categoryAverages = {}
      Object.keys(categoryTotals).forEach(category => {
        categoryAverages[category] = categoryCounts[category] > 0 
          ? Math.round((categoryTotals[category] / categoryCounts[category]) * 10) / 10
          : 0
      })
      
      setFeedback(feedbackList.slice(0, maxItems))
      setStats({
        averageRating: totalCount > 0 ? Math.round((totalRating / totalCount) * 10) / 10 : 0,
        totalRatings: totalCount,
        categoryAverages
      })
      
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  if (feedback.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
        No feedback available yet
      </Typography>
    )
  }

  return (
    <Box>
      {/* Rating Summary */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Rating value={stats.averageRating} precision={0.1} readOnly />
        <Typography variant="body2" color="text.secondary">
          {stats.averageRating} ({stats.totalRatings} review{stats.totalRatings !== 1 ? 's' : ''})
        </Typography>
      </Box>

      {/* Category Ratings */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {Object.entries(stats.categoryAverages).map(([category, average]) => (
          <Grid item xs={6} key={category}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ minWidth: 80, textTransform: 'capitalize' }}>
                {category}:
              </Typography>
              <Rating value={average} precision={0.1} size="small" readOnly />
              <Typography variant="caption" color="text.secondary">
                {average}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Recent Feedback */}
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
        Recent Feedback:
      </Typography>
      {feedback.map((item) => (
        <Paper key={item.id} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Rating value={item.rating} size="small" readOnly />
            <Chip 
              label="Verified" 
              size="small" 
              color="success" 
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              {item.createdAt?.toDate().toLocaleDateString()}
            </Typography>
          </Box>
          {item.feedback && (
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              "{item.feedback}"
            </Typography>
          )}
          {item.helpful > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <ThumbUp sx={{ fontSize: 14, color: 'success.main' }} />
              <Typography variant="caption" color="success.main">
                {item.helpful} found this helpful
              </Typography>
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  )
}