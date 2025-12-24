const express = require('express');
const permissionController = require('../controllers/permissionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Wszystkie endpointy wymagają autoryzacji
router.use(protect);

// Pobierz wszystkie dostępne uprawnienia (tylko admin)
router.get('/', adminOnly, permissionController.getAllPermissions);

// Pobierz listę użytkowników z ich uprawnieniami (tylko admin)
router.get('/users', adminOnly, permissionController.getUsersWithPermissions);

// Pobierz uprawnienia konkretnego użytkownika
router.get('/user/:userId', permissionController.getUserPermissions);

// Przypisz uprawnienia użytkownikowi (tylko admin i super_admin)
router.post('/assign', adminOnly, permissionController.assignPermissions);

// Odbierz uprawnienia użytkownikowi (tylko admin i super_admin)
router.delete('/revoke/:userId', adminOnly, permissionController.revokePermissions);

// Inicjalizuj domyślne uprawnienia (tylko super admin - sprawdzane w kontrolerze)
router.post('/initialize', adminOnly, permissionController.initPermissions);

module.exports = router;
