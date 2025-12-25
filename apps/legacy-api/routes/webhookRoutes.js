const express = require('express');
const { protect, requireRole } = require('../middleware/authMiddleware');
const {
  getWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
} = require('../controllers/webhookController');

const router = express.Router();

// All webhook routes require admin role
router.use(protect);
router.use(requireRole(['admin', 'super_admin']));

router.get('/', getWebhooks);
router.post('/', createWebhook);
router.get('/:id', getWebhook);
router.patch('/:id', updateWebhook);
router.delete('/:id', deleteWebhook);
router.post('/:id/test', testWebhook);

module.exports = router;
