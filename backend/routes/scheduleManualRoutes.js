const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const controller = require('../controllers/scheduleManualController');

const router = express.Router();

router.use(protect);

router.get('/:month', controller.getScheduleForMonth);
router.put('/:month', requirePermission('schedule.edit', { allowAdmin: true }), controller.upsertScheduleForMonth);
router.post('/:month/shifts', requirePermission('schedule.edit', { allowAdmin: true }), controller.createShiftForMonth);
router.put('/:month/shifts/:shiftId', requirePermission('schedule.edit', { allowAdmin: true }), controller.updateShiftForMonth);
router.delete('/:month/shifts/:shiftId', requirePermission('schedule.edit', { allowAdmin: true }), controller.deleteShiftForMonth);

module.exports = router;
