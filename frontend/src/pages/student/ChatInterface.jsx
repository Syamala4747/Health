import { useState, useEffect, useRef } from 'react'
import {
  Box, Typography, Paper, TextField, Button, Avatar, Alert, Container,
  useTheme, alpha, IconButton, Tooltip
} from '@mui/material'
import { Send, Psychology, Person, Phone, PhoneOff, Mic, MicOff } from '@mui/icons-material'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import io from 'socket.io-client'
import toast from 'react-hot-toast'

export default function ChatInterface() {
  const theme = useTheme()
  const { sessionId } = useParams()
  const { user } = useAuth()
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)
  
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001')
    
    // Join session room
    socketRef.current.emit('join_session', sessionId)
    
    // Listen for messages
    socketRef.current.on('new_message', (message) => {
      setMessages(prev => [...prev, message])
    })
    
    // Listen for typing indicators
    socketRef.current.on('user_typing', (data) => {
      setIsTyping(data.isTyping && data.userId !== user.uid)
    })
    
    // Listen for call events
    socketRef.current.on('incoming_call', () => {
      toast.success('Incoming call from counselor')
    })
    
    socketRef.current.on('call_accepted', () => {
      setInCall(true)
      toast.success('Call connected')
    })
    
    socketRef.current.on('call_ended', () => {
      setInCall(false)
      toast.info('Call ended')
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [sessionId, user.uid])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const messageData = {
      sessionId,
      message: inputMessage.trim(),
      senderId: user.uid,
      senderRole: 'student'
    }

    socketRef.current.emit('send_message', messageData)
    setInputMessage('')
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleStartCall = () => {
    socketRef.current.emit('call_request', {
      sessionId,
      callerId: user.uid
    })
  }

  const handleEndCall = () => {
    socketRef.current.emit('call_end', {
      sessionId,
      enderId: user.uid
    })
    setInCall(false)
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Counseling Session
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!inCall ? (
              <Tooltip title="Start Audio Call">
                <IconButton onClick={handleStartCall} color="primary">
                  <Phone />
                </IconButton>
              </Tooltip>
            ) : (
              <>
                <Tooltip title={muted ? "Unmute" : "Mute"}>
                  <IconButton onClick={() => setMuted(!muted)} color={muted ? "error" : "primary"}>
                    {muted ? <MicOff /> : <Mic />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="End Call">
                  <IconButton onClick={handleEndCall} color="error">
                    <PhoneOff />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
        {inCall && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Audio call is active
          </Alert>
        )}
      </Paper>

      {/* Messages */}
      <Paper sx={{ flex: 1, p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.senderRole === 'student' ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '70%' }}>
                {message.senderRole === 'counselor' && (
                  <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 32, height: 32 }}>
                    <Psychology />
                  </Avatar>
                )}
                
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: message.senderRole === 'student' 
                      ? theme.palette.primary.main 
                      : alpha(theme.palette.secondary.main, 0.1),
                    color: message.senderRole === 'student' ? 'white' : 'inherit'
                  }}
                >
                  <Typography variant="body2">{message.content}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Typography>
                </Paper>
                
                {message.senderRole === 'student' && (
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                    <Person />
                  </Avatar>
                )}
              </Box>
            </Box>
          ))}
          
          {isTyping && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 32, height: 32 }}>
                <Psychology />
              </Avatar>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1) }}>
                <Typography variant="body2" color="text.secondary">
                  Counselor is typing...
                </Typography>
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Message Input */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            sx={{ minWidth: 56, height: 56, borderRadius: 3 }}
          >
            <Send />
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}