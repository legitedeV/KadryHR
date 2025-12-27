const express = require('express');
const wellnessController = require('../controllers/wellnessController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', requirePermission('wellness.manage', { allowAdmin: true }), wellnessController.createWellnessProgram);
router.get('/', wellnessController.getWellnessPrograms);
router.get('/my', wellnessController.getMyPrograms);
router.get('/:id', wellnessController.getWellnessProgram);
router.put('/:id', requirePermission('wellness.manage', { allowAdmin: true }), wellnessController.updateWellnessProgram);
router.delete('/:id', requirePermission('wellness.manage', { allowAdmin: true }), wellnessController.deleteWellnessProgram);
router.post('/:id/join', wellnessController.joinProgram);
router.post('/:id/progress', wellnessController.updateProgress);

module.exports = router;
