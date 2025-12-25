const express = require('express');
const shiftTemplateController = require('../controllers/shiftTemplateController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Get all shift templates
router.get('/', shiftTemplateController.getShiftTemplates);

// Create default templates
router.post('/defaults', shiftTemplateController.createDefaultTemplates);

// Get single shift template
router.get('/:id', shiftTemplateController.getShiftTemplate);

// Create shift template (admin only)
router.post('/', shiftTemplateController.createShiftTemplate);

// Update shift template (admin only)
router.patch('/:id', shiftTemplateController.updateShiftTemplate);

// Delete shift template (admin only)
router.delete('/:id', shiftTemplateController.deleteShiftTemplate);

module.exports = router;
