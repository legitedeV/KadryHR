const express = require('express');
const scheduleV2Controller = require('../controllers/scheduleV2Controller');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Schedule routes
router.get('/', scheduleV2Controller.getSchedules);
router.post('/', requirePermission('schedule.create', { allowAdmin: true }), scheduleV2Controller.createSchedule);
router.get('/:id', scheduleV2Controller.getScheduleById);
router.get('/:id/validation', scheduleV2Controller.getScheduleValidation);
router.put('/:id', requirePermission('schedule.edit', { allowAdmin: true }), scheduleV2Controller.updateSchedule);
router.delete('/:id', requirePermission('schedule.delete', { allowAdmin: true }), scheduleV2Controller.deleteSchedule);

// Assignment routes
router.get('/:id/assignments', scheduleV2Controller.getAssignments);
router.post('/:id/assignments', requirePermission('schedule.create', { allowAdmin: true }), scheduleV2Controller.createAssignment);
router.post('/:id/generate', requirePermission('schedule.create', { allowAdmin: true }), scheduleV2Controller.generateSchedule);

// Individual assignment operations
router.put('/assignments/:id', requirePermission('schedule.edit', { allowAdmin: true }), scheduleV2Controller.updateAssignment);
router.delete('/assignments/:id', requirePermission('schedule.delete', { allowAdmin: true }), scheduleV2Controller.deleteAssignment);

module.exports = router;
