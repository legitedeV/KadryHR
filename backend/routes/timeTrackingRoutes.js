const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  scanQRCode,
  getMyTimeEntries,
  getCurrentStatus,
  getAllTimeEntries,
  generateQRCode,
  deleteTimeEntry,
  autoCloseSessions
} = require('../controllers/timeTrackingController');

// User routes
router.post('/scan', protect, scanQRCode);
router.get('/my-entries', protect, getMyTimeEntries);
router.get('/status', protect, getCurrentStatus);

// Admin routes
router.get('/entries', protect, adminOnly, getAllTimeEntries);
router.post('/generate-qr', protect, adminOnly, generateQRCode);
router.delete('/entries/:id', protect, adminOnly, deleteTimeEntry);
router.post('/auto-close-sessions', protect, adminOnly, autoCloseSessions);

module.exports = router;
