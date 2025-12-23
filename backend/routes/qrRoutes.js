const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  generateQRToken,
  startByQRToken,
  verifyQRToken,
  cleanupExpiredTokens
} = require('../controllers/qrController');

// Public routes (token-based)
router.post('/start-by-token', startByQRToken);
router.post('/verify-token', verifyQRToken);

// Protected routes
router.post('/generate-token', protect, generateQRToken);

// Admin routes
router.delete('/cleanup-expired', protect, adminOnly, cleanupExpiredTokens);

module.exports = router;
