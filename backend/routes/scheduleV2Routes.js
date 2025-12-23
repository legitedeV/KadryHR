const express = require('express');
const scheduleV2Controller = require('../controllers/scheduleV2Controller');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Schedule routes
router.get('/', scheduleV2Controller.getSchedules);
router.post('/', adminOnly, scheduleV2Controller.createSchedule);
router.get('/:id', scheduleV2Controller.getScheduleById);
router.put('/:id', adminOnly, scheduleV2Controller.updateSchedule);
router.delete('/:id', adminOnly, scheduleV2Controller.deleteSchedule);

// Assignment routes
router.get('/:id/assignments', scheduleV2Controller.getAssignments);
router.post('/:id/assignments', adminOnly, scheduleV2Controller.createAssignment);
router.post('/:id/generate', adminOnly, scheduleV2Controller.generateSchedule);

// Individual assignment operations
router.put('/assignments/:id', adminOnly, scheduleV2Controller.updateAssignment);
router.delete('/assignments/:id', adminOnly, scheduleV2Controller.deleteAssignment);

module.exports = router;
