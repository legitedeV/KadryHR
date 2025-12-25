const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const controller = require('../controllers/scheduleTemplateController');

router.get('/', protect, controller.getTemplates);
router.post('/', protect, requirePermission('schedule.edit', { allowAdmin: true }), controller.createTemplate);
router.put('/:id', protect, requirePermission('schedule.edit', { allowAdmin: true }), controller.updateTemplate);
router.delete('/:id', protect, requirePermission('schedule.edit', { allowAdmin: true }), controller.deleteTemplate);
router.post('/:id/apply', protect, requirePermission('schedule.edit', { allowAdmin: true }), controller.applyTemplate);

module.exports = router;
