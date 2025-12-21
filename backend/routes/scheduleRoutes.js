const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// wszystkie endpointy wymagają zalogowania (cookie lub Bearer token)
router.use(protect);

// tworzenie / aktualizacja wpisu grafiku
router.post('/', scheduleController.createOrUpdateScheduleEntry);

// generator miesięcznego grafiku dla admina
router.post('/monthly-template', scheduleController.createMonthlyTemplate);

// pobieranie grafiku
router.get('/', scheduleController.getSchedule);

module.exports = router;

