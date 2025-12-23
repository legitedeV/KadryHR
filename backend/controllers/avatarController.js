const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// @desc    Upload avatar
// @route   POST /api/avatar/upload
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Nie przesłano pliku' });
  }

  // Find user
  const user = await User.findById(userId);

  if (!user) {
    // Delete uploaded file if user not found
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
  }

  // Delete old avatar if exists
  if (user.avatarUrl) {
    const oldAvatarPath = path.join(__dirname, '../../uploads', user.avatarUrl.replace('/uploads/', ''));
    if (fs.existsSync(oldAvatarPath)) {
      try {
        fs.unlinkSync(oldAvatarPath);
      } catch (err) {
        console.error('Error deleting old avatar:', err);
      }
    }
  }

  // Update user with new avatar URL
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  user.avatarUrl = avatarUrl;
  await user.save();

  return res.status(200).json({
    message: 'Avatar przesłany pomyślnie',
    avatarUrl
  });
});

// @desc    Delete avatar
// @route   DELETE /api/avatar
// @access  Private
const deleteAvatar = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  // Find user
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
  }

  // Delete avatar file if exists
  if (user.avatarUrl) {
    const avatarPath = path.join(__dirname, '../../uploads', user.avatarUrl.replace('/uploads/', ''));
    if (fs.existsSync(avatarPath)) {
      try {
        fs.unlinkSync(avatarPath);
      } catch (err) {
        console.error('Error deleting avatar:', err);
      }
    }

    // Update user
    user.avatarUrl = null;
    await user.save();
  }

  return res.status(200).json({
    message: 'Avatar usunięty pomyślnie'
  });
});

module.exports = {
  uploadAvatar,
  deleteAvatar
};
