const express = require('express');
const permissionController = require('../controllers/permissionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Wszystkie endpointy wymagają autoryzacji
router.use(protect);

// Pobierz wszystkie dostępne uprawnienia
router.get('/', permissionController.getAllPermissions);

// Pobierz listę użytkowników z ich uprawnieniami
router.get('/users', permissionController.getUsersWithPermissions);

// Pobierz uprawnienia konkretnego użytkownika
router.get('/user/:userId', permissionController.getUserPermissions);

// Przypisz uprawnienia użytkownikowi (tylko admin)
router.post('/assign', permissionController.assignPermissions);

// Odbierz uprawnienia użytkownikowi (tylko admin)
router.delete('/revoke/:userId', permissionController.revokePermissions);

// Inicjalizuj domyślne uprawnienia (tylko super admin)
router.post('/initialize', permissionController.initPermissions);

module.exports = router;
