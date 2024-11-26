const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./config/database');

async function saveMessageToDb(message, senderId, receiverId) {
  try {
    const [result] = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content, is_read) VALUES (?, ?, ?, ?)',
      [senderId, receiverId, message, false]
    );
    
    const [savedMessage] = await db.query(
      `SELECT m.*, u.fullname as sender_name, u.avatar_url as sender_avatar, u.role_id
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );
    
    return savedMessage[0];
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

function setupSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: ["http://localhost:8080", "http://localhost:8081"],
      credentials: true
    }
  });

  const userSockets = new Map();
  const adminSockets = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`User connected: ${user.id} (${user.role_id === 1 ? 'Admin' : 'User'})`);

    if (user.role_id === 1) {
      adminSockets.set(user.id, socket);
    } else {
      userSockets.set(user.id, socket);
    }

    socket.on('send_message', async (data) => {
      try {
        const { message, receiverId } = data;
        const savedMessage = await saveMessageToDb(message, user.id, receiverId);

        if (user.role_id === 1) {
          const userSocket = userSockets.get(receiverId);
          if (userSocket) {
            userSocket.emit('new_message', savedMessage);
          }
        } else {
          adminSockets.forEach((adminSocket) => {
            adminSocket.emit('new_message', savedMessage);
          });
        }

        socket.emit('message_sent', savedMessage);
      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    socket.on('typing', (data) => {
      const { receiverId } = data;
      if (user.role_id === 1) {
        const userSocket = userSockets.get(receiverId);
        if (userSocket) {
          userSocket.emit('user_typing', { userId: user.id });
        }
      } else {
        adminSockets.forEach((adminSocket) => {
          adminSocket.emit('user_typing', { userId: user.id });
        });
      }
    });

    socket.on('disconnect', () => {
      if (user.role_id === 1) {
        adminSockets.delete(user.id);
      } else {
        userSockets.delete(user.id);
      }
      console.log(`User disconnected: ${user.id}`);
    });
  });

  return io;
}

module.exports = setupSocket; 