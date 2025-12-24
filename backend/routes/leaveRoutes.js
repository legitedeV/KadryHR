const express = require('express');
const leaveController = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

router.use(protect);

// Tworzenie wniosku urlopowego (user / admin)
router.post('/', leaveController.createLeave);

// Lista wniosków (na razie tylko admin – logika w kontrolerze)
router.get('/', leaveController.getLeaves);

// Akceptacja / odrzucenie / wstrzymanie (admin – logika w kontrolerze)
router.patch('/:id/approve', requirePermission('requests.manage', { allowAdmin: true }), leaveController.approveLeave);
router.patch('/:id/reject', requirePermission('requests.manage', { allowAdmin: true }), leaveController.rejectLeave);
router.patch('/:id/status', requirePermission('requests.manage', { allowAdmin: true }), leaveController.updateLeaveStatus);

module.exports = router;

