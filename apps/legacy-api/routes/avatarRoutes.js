const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/upload');
const { uploadAvatar, deleteAvatar } = require('../controllers/avatarController');

// Upload avatar
router.post('/upload', protect, upload.single('avatar'), uploadAvatar);

// Delete avatar
router.delete('/', protect, deleteAvatar);

module.exports = router;
