const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

/**
 * Lokalny middleware autoryzacji dla modułu powiadomień.
 */
async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Brak tokenu autoryzacyjnego.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Brak tokenu autoryzacyjnego.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Użytkownik nie istnieje.' });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err) {
    console.error('Błąd w auth (notificationRoutes):', err);
    return res.status(401).json({ message: 'Nieprawidłowy token.' });
  }
}

router.use(auth);

// Powiadomienia zalogowanego użytkownika
router.get('/', notificationController.getMyNotifications);

// Oznaczenie jako przeczytane
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;

