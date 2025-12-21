const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const leaveController = require('../controllers/leaveController');

const router = express.Router();

/**
 * Lokalny middleware autoryzacji dla modułu urlopów.
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
    console.error('Błąd w auth (leaveRoutes):', err);
    return res.status(401).json({ message: 'Nieprawidłowy token.' });
  }
}

router.use(auth);

// Tworzenie wniosku urlopowego (user / admin)
router.post('/', leaveController.createLeave);

// Lista wniosków (na razie tylko admin – logika w kontrolerze)
router.get('/', leaveController.getLeaves);

// Akceptacja / odrzucenie (admin – logika w kontrolerze)
router.patch('/:id/approve', leaveController.approveLeave);
router.patch('/:id/reject', leaveController.rejectLeave);

module.exports = router;

