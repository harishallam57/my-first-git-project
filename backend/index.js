require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const apiRoutes = require('./routes');
const db = require('./database'); // Initialize DB

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Socket.IO Logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join Event Room
  socket.on('join_event', (eventId) => {
    socket.join(`event_${eventId}`);
    console.log(`Socket ${socket.id} joined event_${eventId}`);
    
    // Notify others in room
    socket.to(`event_${eventId}`).emit('participant_joined', {
      socketId: socket.id,
      timestamp: new Date()
    });
  });

  // Leave Event Room
  socket.on('leave_event', (eventId) => {
    socket.leave(`event_${eventId}`);
    console.log(`Socket ${socket.id} left event_${eventId}`);
  });

  // Sync Event Update (Admin broadcasting to everyone)
  socket.on('sync_event_update', (data) => {
    const { eventId, message, type } = data;
    // Broadcast to everyone in the room except the sender
    socket.to(`event_${eventId}`).emit('event_sync', {
      message,
      type,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
