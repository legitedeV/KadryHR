// controllers/authController.js
// Logowanie bezpośrednio na kolekcji "users" – omijamy problemy ze schemą.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/User'); // tylko po to, żeby mieć dostęp do kolekcji

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev';
const JWT_EXPIRES_IN = '7d';

// helper do wysyłania tokena w cookie + JSON
function sendAuthResponse(res, userDoc) {
  const safeUser = {
    id: userDoc._id.toString(),
    email: userDoc.email,
    name: userDoc.name || 'Użytkownik',
    role: userDoc.role || 'user',
  };

  const token = jwt.sign(
    { userId: safeUser.id, role: safeUser.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: false,        // na produkcji z SSL możesz dać true
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dni
  });

  return res.status(200).json({
    message: 'Zalogowano pomyślnie',
    token,
    user: safeUser,
  });
}

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email i hasło są wymagane' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  // surowy dokument z Mongo – BEZ schemy Mongoose
  const rawUser = await User.collection.findOne({ email: normalizedEmail });

  if (!rawUser) {
    console.warn('[AUTH] Brak użytkownika dla email:', normalizedEmail);
    return res
      .status(401)
      .json({ message: 'Nieprawidłowy email lub hasło' });
  }

  let storedHash = rawUser.passwordHash || rawUser.password;

  // JEŚLI BRAK HASŁA W DOKUMENCIE → migrujemy "w locie"
  if (!storedHash) {
    console.warn(
      '[AUTH] Użytkownik nie ma pola z hasłem w bazie, ustawiam nowe hasło dla:',
      { _id: rawUser._id.toString(), email: rawUser.email }
    );

    // hashujemy hasło podane w formularzu
    const newHash = await bcrypt.hash(password, 10);

    await User.collection.updateOne(
      { _id: rawUser._id },
      {
        $set: {
          passwordHash: newHash,
          // zostawiamy też ślad, że to hasło już zrobione
          migratedPasswordAt: new Date(),
        },
      }
    );

    storedHash = newHash;
  }

  const ok = await bcrypt.compare(password, storedHash);

  if (!ok) {
    console.warn('[AUTH] Złe hasło dla użytkownika:', {
      _id: rawUser._id.toString(),
      email: rawUser.email,
    });
    return res
      .status(401)
      .json({ message: 'Nieprawidłowy email lub hasło' });
  }

  console.log('[AUTH] Użytkownik zalogowany:', {
    _id: rawUser._id.toString(),
    email: rawUser.email,
    role: rawUser.role,
  });

  return sendAuthResponse(res, rawUser);
});

// POST /api/auth/register – prosta wersja (raczej tylko dla zaproszeń / testów)
exports.register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Imię, email i hasło są wymagane' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  const existing = await User.collection.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(400).json({ message: 'Użytkownik już istnieje' });
  }

  const hash = await bcrypt.hash(password, 10);

  const insertResult = await User.collection.insertOne({
    name,
    email: normalizedEmail,
    passwordHash: hash,
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const newUser = await User.collection.findOne({ _id: insertResult.insertedId });

  console.log('[AUTH] Zarejestrowano użytkownika:', {
    _id: newUser._id.toString(),
    email: newUser.email,
  });

  return sendAuthResponse(res, newUser);
});

// GET /api/auth/me – zwraca dane zalogowanego usera
exports.getMe = asyncHandler(async (req, res) => {
  // zakładam, że authMiddleware wstawia req.userId
  const userId = req.userId || (req.user && req.user.id);

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  const rawUser = await User.collection.findOne({
    _id: new mongoose.Types.ObjectId(String(userId)),
  });

  if (!rawUser) {
    return res.status(404).json({ message: 'Użytkownik nie istnieje' });
  }

  return res.status(200).json({
    id: rawUser._id.toString(),
    email: rawUser.email,
    name: rawUser.name || 'Użytkownik',
    role: rawUser.role || 'user',
  });
});
