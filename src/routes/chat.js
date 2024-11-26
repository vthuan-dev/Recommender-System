const express = require('express');
const router = express.Router();
const pool = require('../database/dbconfig').pool;
const { authenticateJWT } = require('../middleware/auth');

// Lấy lịch sử chat
router.get('/messages', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [messages] = await pool.query(`
      SELECT m.*, 
             u.fullname as sender_name, 
             u.avatar_url as sender_avatar,
             u.role_id
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.created_at ASC
    `, [userId, userId]);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải tin nhắn', error: error.message });
  }
});

// Gửi tin nhắn mới
router.post('/messages', authenticateJWT, async (req, res) => {
  try {
    const { content, receiverId } = req.body;
    const senderId = req.user.userId;

    const [result] = await pool.query(`
      INSERT INTO messages (sender_id, receiver_id, content)
      VALUES (?, ?, ?)
    `, [senderId, receiverId, content]);

    // Emit socket event cho người nhận
    req.app.get('io').to(`user_${receiverId}`).emit('new_message', {
      id: result.insertId,
      sender_id: senderId,
      content,
      created_at: new Date()
    });

    res.status(201).json({ message: 'Tin nhắn đã được gửi' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi gửi tin nhắn', error: error.message });
  }
});

module.exports = router; 