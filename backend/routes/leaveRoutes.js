const express = require('express');
const leaveController = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Tworzenie wniosku urlopowego (user / admin)
router.post('/', leaveController.createLeave);

// Lista wniosków (na razie tylko admin – logika w kontrolerze)
router.get('/', leaveController.getLeaves);

// Akceptacja / odrzucenie (admin – logika w kontrolerze)
router.patch('/:id/approve', leaveController.approveLeave);
router.patch('/:id/reject', leaveController.rejectLeave);

module.exports = router;

