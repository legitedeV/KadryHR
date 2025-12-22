const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// wszystkie endpointy wymagają zalogowania (cookie lub Bearer token)
router.use(protect);

// === PODSTAWOWE OPERACJE ===

// tworzenie / aktualizacja wpisu grafiku
router.post('/', scheduleController.createOrUpdateScheduleEntry);

// pobieranie grafiku
router.get('/', scheduleController.getSchedule);

// generator miesięcznego grafiku dla admina (stary sposób)
router.post('/monthly-template', scheduleController.createMonthlyTemplate);

// === ZAAWANSOWANE GENEROWANIE ===

// inteligentne generowanie grafiku z AI-podobną optymalizacją
router.post('/generate-intelligent', scheduleController.generateIntelligentSchedule);

// optymalizacja istniejącego grafiku
router.post('/optimize', scheduleController.optimizeExistingSchedule);

// === WALIDACJA I ZGODNOŚĆ ===

// walidacja zgodności z Kodeksem Pracy
router.get('/validate-compliance', scheduleController.validateCompliance);

// wykrywanie konfliktów w grafiku
router.get('/conflicts', scheduleController.detectConflicts);

// === ANALIZA KOSZTÓW ===

// analiza kosztów grafiku
router.get('/costs/analyze', scheduleController.analyzeCosts);

// optymalizacja kosztów
router.post('/costs/optimize', scheduleController.optimizeScheduleCosts);

// prognoza kosztów
router.get('/costs/forecast', scheduleController.forecastScheduleCosts);

module.exports = router;

