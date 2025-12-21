const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev';
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const DEMO_USER = {
  id: 'demo-user',
  email: process.env.DEMO_USER_EMAIL || 'admin@demo.pl',
  name: process.env.DEMO_USER_NAME || 'Demo Admin',
  role: process.env.DEMO_USER_ROLE || 'admin',
};

async function protect(req, res, next) {
  try {
    let token;

    // 1) Cookie z backendu
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
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

    // W trybie demo token nie wymaga połączenia z MongoDB
    if (DEMO_MODE) {
      req.userId = decoded.userId || decoded.id || DEMO_USER.id;
      req.user = {
        ...DEMO_USER,
        role: decoded.role || DEMO_USER.role,
        id: req.userId,
      };
      return next();
    }

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({ message: 'Nieautoryzowany.' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Użytkownik nie istnieje.' });
    }

    req.user = user;
    req.userId = userId;
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
