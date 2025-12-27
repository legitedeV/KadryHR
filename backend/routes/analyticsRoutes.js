const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.post('/generate', analyticsController.generateAnalytics);
router.get('/', analyticsController.getAnalytics);
router.get('/latest', analyticsController.getLatestAnalytics);
router.delete('/:id', analyticsController.deleteAnalytics);

module.exports = router;
