const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret-change-me';

async function protect(req, res, next) {
  try {
    let token;

    // 1) Cookie z backendu
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // 2) Nagłówek Authorization (na wszelki wypadek)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Brak tokenu. Zaloguj się ponownie.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Użytkownik nie istnieje.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('authMiddleware protect error:', err);
    return res.status(401).json({ message: 'Nieautoryzowany.' });
  }
}

function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Nieautoryzowany.' });
    }

    // pozwalamy super adminowi na wszystko
    if (req.user.role === 'super_admin' || req.user.role === requiredRole) {
      return next();
    }

    return res.status(403).json({ message: 'Brak uprawnień.' });
  };
}

module.exports = {
  protect,
  requireRole,
};
