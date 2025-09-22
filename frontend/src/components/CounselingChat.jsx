import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material'
import {
  Send,
  Phone,
  CallEnd,
  Mic,
  MicOff,
  Psychology,
  Person,
  VolumeUp,
  VolumeOff
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext.jsx'
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase.js'
import io from 'socket.io-client'
import toast from 'react-hot-toast'

export default function CounselingChat({ sessionId, counselorData, onEndSession }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [socket, setSocket] = useState(null)
  const [audioCall, setAudioCall] = useState({
    active: false,
    muted: false,
    speakerOn: true,
    connecting: false
  })
  const [endSessionDialog, setEndSessionDialog] = useState(false)
  const messagesEndRef = useRef(null)
  const audioRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (sessionId) {
      initializeSocket()
      loadChatHistory()
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [sessionId])

  const initializeSocket = () => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
      auth: {
        token: user.accessToken,
        sessionId,
        userId: user.uid
      }
    })

    newSocket.on('connect', () => {
      console.log('Connected to chat server')
      newSocket.emit('join-session', sessionId)
    })

    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message])
    })

    newSocket.on('audio-call-request', (data) => {
      handleIncomingCall(data)
    })

    newSocket.on('audio-call-accepted', () => {
      setAudioCall(prev => ({ ...prev, active: true, connecting: false }))
      toast.success('Audio call connected')
    })

    newSocket.on('audio-call-ended', () => {
      setAudioCall(prev => ({ ...prev, active: false, connecting: false }))
      toast.info('Audio call ended')
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server')
    })

    setSocket(newSocket)
  }

  const loadChatHistory = () => {
    const q = query(
      collection(db, 'counseling_messages'),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = []
      snapshot.forEach((doc) => {
        chatMessages.push({ id: doc.id, ...doc.data() })
      })
      setMessages(chatMessages)
    })

    return unsubscribe
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const messageText = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    try {
      const messageData = {
        sessionId,
        senderId: user.uid,
        senderRole: 'student', // or 'counselor' based on user role
        message: messageText,
        timestamp: new Date(),
        encrypted: true // Messages should be encrypted
      }

      // Save to Firestore
      await addDoc(collection(db, 'counseling_messages'), messageData)

      // Send via Socket.IO for real-time delivery
      if (socket) {
        socket.emit('send-message', messageData)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const startAudioCall = () => {
    if (!socket) return

    setAudioCall(prev => ({ ...prev, connecting: true }))
    socket.emit('start-audio-call', {
      sessionId,
      callerId: user.uid,
      callerName: user.displayName || user.email
    })
    toast.info('Initiating audio call...')
  }

  const endAudioCall = () => {
    if (!socket) return

    socket.emit('end-audio-call', { sessionId })
    setAudioCall(prev => ({ ...prev, active: false, connecting: false }))
  }

  const toggleMute = () => {
    setAudioCall(prev => ({ ...prev, muted: !prev.muted }))
    // In a real implementation, this would control the microphone
    toast.info(audioCall.muted ? 'Microphone unmuted' : 'Microphone muted')
  }

  const toggleSpeaker = () => {
    setAudioCall(prev => ({ ...prev, speakerOn: !prev.speakerOn }))
    // In a real implementation, this would control the speaker
    toast.info(audioCall.speakerOn ? 'Speaker off' : 'Speaker on')
  }

  const handleIncomingCall = (data) => {
    // Show incoming call notification
    toast((t) => (
      <Box>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Incoming audio call from {data.callerName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => {
              socket.emit('accept-audio-call', { sessionId })
              setAudioCall(prev => ({ ...prev, active: true }))
              toast.dismiss(t.id)
            }}
          >
            Accept
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              socket.emit('reject-audio-call', { sessionId })
              toast.dismiss(t.id)
            }}
          >
            Decline
          </Button>
        </Box>
      </Box>
    ), { duration: 10000 })
  }

  const handleEndSession = async () => {
    try {
      // Update session status
      await updateDoc(doc(db, 'counseling_sessions', sessionId), {
        status: 'completed',
        endedAt: new Date(),
        endedBy: user.uid
      })

      // Disconnect socket
      if (socket) {
        socket.emit('end-session', sessionId)
        socket.disconnect()
      }

      toast.success('Session ended successfully')
      onEndSession()
    } catch (error) {
      console.error('Error ending session:', error)
      toast.error('Failed to end session')
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Psychology />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Counseling Session
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {counselorData?.name || 'Anonymous Counselor'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Audio Call Controls */}
            {audioCall.active ? (
              <>
                <IconButton
                  onClick={toggleMute}
                  color={audioCall.muted ? 'error' : 'primary'}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {audioCall.muted ? <MicOff /> : <Mic />}
                </IconButton>
                <IconButton
                  onClick={toggleSpeaker}
                  color={audioCall.speakerOn ? 'primary' : 'default'}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {audioCall.speakerOn ? <VolumeUp /> : <VolumeOff />}
                </IconButton>
                <IconButton
                  onClick={endAudioCall}
                  color="error"
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <CallEnd />
                </IconButton>
              </>
            ) : (
              <IconButton
                onClick={startAudioCall}
                disabled={audioCall.connecting}
                color="primary"
                sx={{ bgcolor: 'background.paper' }}
              >
                {audioCall.connecting ? <CircularProgress size={20} /> : <Phone />}
              </IconButton>
            )}
            
            <Button
              variant="outlined"
              color="error"
              onClick={() => setEndSessionDialog(true)}
              size="small"
            >
              End Session
            </Button>
          </Box>
        </Box>
        
        {audioCall.active && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone />
              Audio call active
              {audioCall.muted && <Chip label="Muted" size="small" color="error" />}
            </Box>
          </Alert>
        )}
      </Paper>

      {/* Chat Messages */}
      <Paper 
        sx={{ 
          flex: 1, 
          p: 2, 
          mb: 2, 
          maxHeight: '60vh', 
          overflowY: 'auto',
          backgroundColor: '#f8fafc'
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Psychology sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Start your counseling session by sending a message
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.senderId === user.uid ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  maxWidth: '70%',
                  flexDirection: msg.senderId === user.uid ? 'row-reverse' : 'row'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: msg.senderId === user.uid ? 'primary.main' : 'secondary.main',
                    width: 32,
                    height: 32
                  }}
                >
                  {msg.senderId === user.uid ? <Person /> : <Psychology />}
                </Avatar>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: msg.senderId === user.uid ? 'primary.main' : 'white',
                    color: msg.senderId === user.uid ? 'white' : 'text.primary',
                    borderRadius: 2,
                    maxWidth: '100%'
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.message}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      opacity: 0.7, 
                      display: 'block', 
                      mt: 0.5,
                      fontSize: '0.75rem'
                    }}
                  >
                    {msg.timestamp?.toDate?.()?.toLocaleTimeString() || 
                     new Date(msg.timestamp).toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </Paper>

      {/* Message Input */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          disabled={loading}
          variant="outlined"
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || loading}
          sx={{ minWidth: 'auto', px: 2 }}
        >
          {loading ? <CircularProgress size={20} /> : <Send />}
        </Button>
      </Box>

      {/* End Session Dialog */}
      <Dialog open={endSessionDialog} onClose={() => setEndSessionDialog(false)}>
        <DialogTitle>End Counseling Session</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to end this counseling session? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndSessionDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleEndSession} 
            color="error" 
            variant="contained"
          >
            End Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden audio element for call functionality */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </Box>
  )
}