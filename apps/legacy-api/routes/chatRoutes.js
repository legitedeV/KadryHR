const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getChatUsers
} = require('../controllers/chatController');

// All routes require authentication
router.use(protect);

// Get all users for chat
router.get('/users', getChatUsers);

// Conversation routes
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);

// Message routes
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);
router.put('/conversations/:id/read', markAsRead);

module.exports = router;
