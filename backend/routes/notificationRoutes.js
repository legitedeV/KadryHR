const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Powiadomienia zalogowanego użytkownika
router.get('/', notificationController.getMyNotifications);

// Oznaczenie jako przeczytane
router.patch('/:id/read', notificationController.markAsRead);

// Oznaczenie wszystkich jako przeczytane
router.post('/mark-all-read', notificationController.markAllAsRead);

// Usunięcie powiadomienia
router.delete('/:id', notificationController.deleteNotification);

// Proste tworzenie powiadomienia (np. z dashboardu)
router.post('/', notificationController.createNotificationManual);

module.exports = router;

