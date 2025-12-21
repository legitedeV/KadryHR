// routes/authRoutes.js
const express = require('express');
const router = express.Router();

const {
  loginUser,
  getMe,
  logoutUser,
  registerUser,
} = require('../controllers/authController');

// Zabezpieczenie przed sytuacją, w której import nie zwróci funkcji (np. błąd require)
const safeRegisterUser =
  typeof registerUser === 'function'
    ? registerUser
    : (req, res) =>
        res.status(501).json({ message: 'Rejestracja tymczasowo niedostępna' });

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
