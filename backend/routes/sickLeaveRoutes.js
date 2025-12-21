const express = require('express');
const sickLeaveController = require('../controllers/sickLeaveController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Dodanie L4 (admin)
router.post('/', sickLeaveController.createSickLeave);

// Lista L4 (admin – logika w kontrolerze)
router.get('/', sickLeaveController.getSickLeaves);

module.exports = router;
