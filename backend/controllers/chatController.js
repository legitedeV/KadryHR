const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  const conversations = await Conversation.find({
    participants: userId
  })
    .populate('participants', 'name email avatarUrl')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name email avatarUrl'
      }
    })
    .sort({ lastMessageAt: -1 });

  return res.status(200).json({
    conversations
  });
});

// @desc    Get or create conversation with another user
// @route   POST /api/chat/conversations
// @access  Private
const createConversation = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { participantId } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  if (!participantId) {
    return res.status(400).json({ message: 'ID uczestnika jest wymagane' });
  }

  if (userId === participantId) {
    return res.status(400).json({ message: 'Nie możesz utworzyć konwersacji z samym sobą' });
  }

  // Check if participant exists
  const participant = await User.findById(participantId);
  if (!participant) {
    return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
  }

  // Check if conversation already exists
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, participantId], $size: 2 }
  })
    .populate('participants', 'name email avatarUrl')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name email avatarUrl'
      }
    });

  if (conversation) {
    return res.status(200).json({ conversation });
  }

  // Create new conversation
  conversation = await Conversation.create({
    participants: [userId, participantId]
  });

  await conversation.populate('participants', 'name email avatarUrl');

  return res.status(201).json({
    message: 'Konwersacja utworzona pomyślnie',
    conversation
  });
});

// @desc    Get messages for a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { id: conversationId } = req.params;
  const { limit = 50, before } = req.query;

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  // Check if user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ message: 'Konwersacja nie znaleziona' });
  }

  if (!conversation.isParticipant(userId)) {
    return res.status(403).json({ message: 'Brak dostępu do tej konwersacji' });
  }

  // Build query
  const query = {
    conversation: conversationId,
    isDeleted: false
  };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .populate('sender', 'name email avatarUrl')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  return res.status(200).json({
    messages: messages.reverse() // Return in chronological order
  });
});

// @desc    Send a message
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { id: conversationId } = req.params;
  const { content } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Treść wiadomości jest wymagana' });
  }

  // Check if user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ message: 'Konwersacja nie znaleziona' });
  }

  if (!conversation.isParticipant(userId)) {
    return res.status(403).json({ message: 'Brak dostępu do tej konwersacji' });
  }

  // Create message
  const message = await Message.create({
    conversation: conversationId,
    sender: userId,
    content: content.trim(),
    readBy: [{
      user: userId,
      readAt: new Date()
    }]
  });

  await message.populate('sender', 'name email avatarUrl');

  // Update conversation
  conversation.lastMessage = message._id;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  // Emit Socket.IO event to conversation room
  const io = req.app.get('io');
  if (io) {
    io.to(`conversation:${conversationId}`).emit('new_message', {
      message,
      conversationId
    });

    // Notify other participants
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== userId.toString()) {
        io.to(`user:${participantId}`).emit('conversation_updated', {
          conversationId,
          lastMessage: message
        });
      }
    });
  }

  return res.status(201).json({
    message
  });
});

// @desc    Mark messages as read
// @route   PUT /api/chat/conversations/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { id: conversationId } = req.params;

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  // Check if user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ message: 'Konwersacja nie znaleziona' });
  }

  if (!conversation.isParticipant(userId)) {
    return res.status(403).json({ message: 'Brak dostępu do tej konwersacji' });
  }

  // Mark all unread messages as read
  await Message.updateMany(
    {
      conversation: conversationId,
      'readBy.user': { $ne: userId }
    },
    {
      $push: {
        readBy: {
          user: userId,
          readAt: new Date()
        }
      }
    }
  );

  return res.status(200).json({
    message: 'Wiadomości oznaczone jako przeczytane'
  });
});

// @desc    Get all users for chat (excluding current user)
// @route   GET /api/chat/users
// @access  Private
const getChatUsers = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  const users = await User.find({
    _id: { $ne: userId },
    isActive: true
  }).select('name email avatarUrl role');

  return res.status(200).json({
    users
  });
});

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getChatUsers
};
