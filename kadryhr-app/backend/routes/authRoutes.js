// routes/authRoutes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

const { loginUser, getMe, logoutUser } = authController;

// Zabezpieczenie przed sytuacją, w której import nie zwróci funkcji (np. błąd require)
const safeRegisterUser = (() => {
  if (typeof authController.registerUser === 'function') {
    return authController.registerUser;
  }

  console.error('[AUTH] Brak handlera registerUser – zwracam 501');
  return (req, res) =>
    res.status(501).json({ message: 'Rejestracja tymczasowo niedostępna' });
})();

const { protect } = require('../middleware/authMiddleware');

// Logowanie
router.post('/login', loginUser);

// Ewentualna rejestracja (na razie zwraca 501 – patrz kontroler)
router.post('/register', safeRegisterUser);

// Dane zalogowanego usera
router.get('/me', protect, getMe);

// Wylogowanie (czyści cookie)
router.post('/logout', protect, logoutUser);

module.exports = router;
