const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { sseStream } = require('../controllers/realtimeController');

const router = express.Router();

/**
 * GET /api/realtime/events
 * Server-Sent Events stream for realtime updates
 */
router.get('/events', protect, sseStream);

module.exports = router;
