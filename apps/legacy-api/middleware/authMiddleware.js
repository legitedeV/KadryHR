const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured');
}

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
        ip: req.ip,
        hasCookies: !!req.cookies,
        hasAuthHeader: !!req.headers.authorization,
      });
      return res
        .status(401)
        .json({ 
          message: 'Brak tokenu. Zaloguj się ponownie.',
          code: 'NO_TOKEN'
        });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUTH] Token znaleziony', { source: tokenSource, path: req.path });
    } else {
      console.log('[AUTH] Token znaleziony', { source: tokenSource, path: req.path });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      console.warn('[AUTH] Brak userId w tokenie', { ip: req.ip });
      return res.status(401).json({ 
        message: 'Nieautoryzowany - nieprawidłowy token.',
        code: 'INVALID_TOKEN'
      });
    }

    const rawUser = await User.collection.findOne({
      _id: new mongoose.Types.ObjectId(String(userId)),
    });

    if (!rawUser) {
      console.warn('[AUTH] Użytkownik nie istnieje w bazie:', { userId, ip: req.ip });
      return res.status(401).json({ 
        message: 'Użytkownik nie istnieje.',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = {
      id: rawUser._id.toString(),
      email: rawUser.email,
      name: rawUser.name || 'Użytkownik',
      role: rawUser.role || 'user',
      supervisor: rawUser.supervisor ? rawUser.supervisor.toString() : null,
      companyId: rawUser.companyId ? rawUser.companyId.toString() : undefined,
    };
    req.userId = req.user.id;

    console.log('[AUTH] Użytkownik zautoryzowany:', {
      userId: req.user.id,
      role: req.user.role,
      path: req.path,
    });

    next();
  } catch (err) {
    console.error('[AUTH] Błąd weryfikacji tokenu:', {
      error: err.message,
      name: err.name,
      path: req.path,
      ip: req.ip,
    });
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token wygasł. Zaloguj się ponownie.',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Nieprawidłowy token. Zaloguj się ponownie.',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(401).json({ 
      message: 'Nieautoryzowany.',
      code: 'UNAUTHORIZED'
    });
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

function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Nieautoryzowany.' });
  }

  if (req.user.role === 'admin' || req.user.role === 'super_admin') {
    return next();
  }

  return res.status(403).json({ message: 'Brak uprawnień. Tylko administratorzy.' });
}

module.exports = {
  protect,
  requireRole,
  adminOnly,
};
