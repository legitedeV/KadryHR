const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// GET /api/users/me - Get current user info
router.get('/me', protect, async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji' });
    }

    const user = await User.findById(userId)
      .select('-password')
      .populate('supervisor', 'name email');

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie istnieje' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
