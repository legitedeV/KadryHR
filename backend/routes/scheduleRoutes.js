const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// wszystkie endpointy wymagają zalogowania (obsługa cookie + Bearer)
router.use(protect);

// tworzenie / aktualizacja wpisu grafiku
router.post('/', scheduleController.createOrUpdateScheduleEntry);

// pobieranie grafiku
router.get('/', scheduleController.getSchedule);

module.exports = router;

