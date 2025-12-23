const express = require('express');
const leaveController = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Tworzenie wniosku urlopowego (user / admin)
router.post('/', leaveController.createLeave);

// Lista wniosków (na razie tylko admin – logika w kontrolerze)
router.get('/', leaveController.getLeaves);

// Akceptacja / odrzucenie / wstrzymanie (admin – logika w kontrolerze)
router.patch('/:id/approve', leaveController.approveLeave);
router.patch('/:id/reject', leaveController.rejectLeave);
router.patch('/:id/status', leaveController.updateLeaveStatus);

module.exports = router;

