const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev';

async function protect(req, res, next) {
  try {
    let token;
    let tokenSource = 'none';

    // 1) Cookie z backendu
    if (req.cookies && (req.cookies.jwt || req.cookies.token)) {
      token = req.cookies.jwt || req.cookies.token;
      tokenSource = 'cookie';
    }
    // 2) Nagłówek Authorization (na wszelki wypadek)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
      tokenSource = 'header';
    }

    if (!token) {
      console.warn('[AUTH] Brak tokenu w żądaniu:', {
        path: req.path,
        method: req.method,
        hasCookies: !!req.cookies,
        hasAuthHeader: !!req.headers.authorization,
      });
      return res
        .status(401)
        .json({ message: 'Brak tokenu. Zaloguj się ponownie.' });
    }

    console.log('[AUTH] Token znaleziony:', {
      source: tokenSource,
      path: req.path,
      tokenPreview: token.substring(0, 20) + '...',
    });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      console.warn('[AUTH] Brak userId w tokenie:', { decoded });
      return res.status(401).json({ message: 'Nieautoryzowany - nieprawidłowy token.' });
    }

    const rawUser = await User.collection.findOne({
      _id: new mongoose.Types.ObjectId(String(userId)),
    });

    if (!rawUser) {
      console.warn('[AUTH] Użytkownik nie istnieje w bazie:', { userId });
      return res.status(401).json({ message: 'Użytkownik nie istnieje.' });
    }

    req.user = {
      id: rawUser._id.toString(),
      email: rawUser.email,
      name: rawUser.name || 'Użytkownik',
      role: rawUser.role || 'user',
    };
    req.userId = req.user.id;

    console.log('[AUTH] Użytkownik zautoryzowany:', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      path: req.path,
    });

    next();
  } catch (err) {
    console.error('[AUTH] Błąd weryfikacji tokenu:', {
      error: err.message,
      name: err.name,
      path: req.path,
    });
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token wygasł. Zaloguj się ponownie.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Nieprawidłowy token. Zaloguj się ponownie.' });
    }
    
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
