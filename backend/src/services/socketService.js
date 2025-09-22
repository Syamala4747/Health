const { Server } = require('socket.io');
const { logger } = require('../utils/logger');
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.id}`);

      // Join user to their personal room
      socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        logger.info(`User ${userId} joined personal room`);
      });

      // Join counseling session room
      socket.on('join_session', (sessionId) => {
        socket.join(`session_${sessionId}`);
        logger.info(`User joined session: ${sessionId}`);
      });

      // Handle chat messages
      socket.on('send_message', async (data) => {
        try {
          const { sessionId, message, senderId, senderRole } = data;
          
          // Save message to database
          const messageDoc = await db.collection('sessions').doc(sessionId)
            .collection('messages').add({
              content: message,
              senderId,
              senderRole,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              type: 'text'
            });

          // Broadcast to session room
          this.io.to(`session_${sessionId}`).emit('new_message', {
            id: messageDoc.id,
            content: message,
            senderId,
            senderRole,
            timestamp: new Date(),
            type: 'text'
          });

        } catch (error) {
          logger.error('Send message error:', error);
          socket.emit('message_error', { error: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        socket.to(`session_${data.sessionId}`).emit('user_typing', {
          userId: data.userId,
          isTyping: true
        });
      });

      socket.on('typing_stop', (data) => {
        socket.to(`session_${data.sessionId}`).emit('user_typing', {
          userId: data.userId,
          isTyping: false
        });
      });

      // Handle audio call events
      socket.on('call_request', (data) => {
        socket.to(`session_${data.sessionId}`).emit('incoming_call', {
          callerId: data.callerId,
          sessionId: data.sessionId
        });
      });

      socket.on('call_accept', (data) => {
        socket.to(`session_${data.sessionId}`).emit('call_accepted', {
          accepterId: data.accepterId
        });
      });

      socket.on('call_reject', (data) => {
        socket.to(`session_${data.sessionId}`).emit('call_rejected', {
          rejecterId: data.rejecterId
        });
      });

      socket.on('call_end', (data) => {
        socket.to(`session_${data.sessionId}`).emit('call_ended', {
          enderId: data.enderId
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
      });
    });
  }

  // Send notification to specific user
  sendNotification(userId, notification) {
    this.io.to(`user_${userId}`).emit('notification', notification);
  }

  // Send message to session
  sendSessionMessage(sessionId, message) {
    this.io.to(`session_${sessionId}`).emit('new_message', message);
  }
}

module.exports = SocketService;