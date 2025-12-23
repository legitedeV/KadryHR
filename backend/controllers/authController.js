// controllers/authController.js
// Logowanie bezpośrednio na kolekcji "users" – omijamy problemy ze schemą.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/User'); // tylko po to, żeby mieć dostęp do kolekcji

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SECURE_COOKIE = process.env.NODE_ENV === 'production';

function buildSafeUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    name: userDoc.name || 'Użytkownik',
    role: userDoc.role || 'user',
  };
}

function signToken(safeUser) {
  return jwt.sign({ id: safeUser.id, role: safeUser.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// helper do wysyłania tokena w cookie + JSON
function sendAuthResponse(res, userDoc) {
  const safeUser = buildSafeUser(userDoc);
  const token = signToken(safeUser);

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: SECURE_COOKIE,
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
const loginUser = asyncHandler(async (req, res) => {
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

  // Sprawdź czy użytkownik musi zmienić hasło
  if (rawUser.requirePasswordReset) {
    const safeUser = buildSafeUser(rawUser);
    const token = signToken(safeUser);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: SECURE_COOKIE,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: 'Musisz zmienić hasło przy pierwszym logowaniu',
      token,
      user: safeUser,
      requirePasswordReset: true,
    });
  }

  return sendAuthResponse(res, rawUser);
});

// POST /api/auth/register – prosta wersja (raczej tylko dla zaproszeń / testów)
const registerUser = asyncHandler(async (req, res) => {
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
const getMe = asyncHandler(async (req, res) => {
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

  // Pobierz dane przełożonego jeśli istnieje
  let supervisor = null;
  if (rawUser.supervisor) {
    const supervisorDoc = await User.collection.findOne({
      _id: new mongoose.Types.ObjectId(String(rawUser.supervisor)),
    });
    if (supervisorDoc) {
      supervisor = {
        id: supervisorDoc._id.toString(),
        name: supervisorDoc.name,
        email: supervisorDoc.email,
      };
    }
  }

  const safeUser = {
    ...buildSafeUser(rawUser),
    phone: rawUser.phone || '',
    themePreference: rawUser.themePreference || 'system',
    supervisor,
  };

  return res.status(200).json(safeUser);
});

// POST /api/auth/logout – usuwa cookie z tokenem
const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: 'lax',
  });

  return res.status(200).json({ message: 'Wylogowano' });
});

// POST /api/auth/demo – automatyczne logowanie do konta demo
const demoLogin = asyncHandler(async (req, res) => {
  const DEMO_EMAIL = 'demo@kadryhr.pl';
  
  // Znajdź lub utwórz użytkownika demo
  let demoUser = await User.collection.findOne({ email: DEMO_EMAIL });
  
  if (!demoUser) {
    // Utwórz konto demo jeśli nie istnieje
    const demoPassword = await bcrypt.hash('Demo1234!', 10);
    
    const insertResult = await User.collection.insertOne({
      name: 'Demo User',
      email: DEMO_EMAIL,
      passwordHash: demoPassword,
      role: 'admin', // Demo ma dostęp admina
      isActive: true,
      isDemo: true, // Flaga demo
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    demoUser = await User.collection.findOne({ _id: insertResult.insertedId });
    
    console.log('[AUTH] Utworzono konto demo:', {
      _id: demoUser._id.toString(),
      email: demoUser.email,
    });
  }
  
  console.log('[AUTH] Logowanie demo:', {
    _id: demoUser._id.toString(),
    email: demoUser.email,
  });
  
  return sendAuthResponse(res, demoUser);
});

// PUT /api/auth/profile – aktualizacja profilu użytkownika
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  const { name, email, phone } = req.body;

  const updateData = {};
  if (name) updateData.name = name.trim();
  if (email) updateData.email = email.toLowerCase().trim();
  if (phone !== undefined) updateData.phone = phone.trim();
  updateData.updatedAt = new Date();

  // Sprawdź czy email nie jest już zajęty przez innego użytkownika
  if (email) {
    const existing = await User.collection.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: new mongoose.Types.ObjectId(String(userId)) },
    });
    if (existing) {
      return res.status(400).json({ message: 'Ten email jest już zajęty' });
    }
  }

  await User.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(String(userId)) },
    { $set: updateData }
  );

  const updatedUser = await User.collection.findOne({
    _id: new mongoose.Types.ObjectId(String(userId)),
  });

  // Pobierz dane przełożonego jeśli istnieje
  let supervisor = null;
  if (updatedUser.supervisor) {
    const supervisorDoc = await User.collection.findOne({
      _id: new mongoose.Types.ObjectId(String(updatedUser.supervisor)),
    });
    if (supervisorDoc) {
      supervisor = {
        id: supervisorDoc._id.toString(),
        name: supervisorDoc.name,
        email: supervisorDoc.email,
      };
    }
  }

  const safeUser = {
    ...buildSafeUser(updatedUser),
    phone: updatedUser.phone || '',
    themePreference: updatedUser.themePreference || 'system',
    supervisor,
  };

  return res.status(200).json({
    message: 'Profil zaktualizowany pomyślnie',
    user: safeUser,
  });
});

// PUT /api/auth/change-password – zmiana hasła
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Obecne i nowe hasło są wymagane' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Nowe hasło musi mieć minimum 6 znaków' });
  }

  const rawUser = await User.collection.findOne({
    _id: new mongoose.Types.ObjectId(String(userId)),
  });

  if (!rawUser) {
    return res.status(404).json({ message: 'Użytkownik nie istnieje' });
  }

  const storedHash = rawUser.passwordHash || rawUser.password;

  if (!storedHash) {
    return res.status(400).json({ message: 'Nie można zmienić hasła' });
  }

  // Sprawdź obecne hasło
  const isMatch = await bcrypt.compare(currentPassword, storedHash);

  if (!isMatch) {
    return res.status(401).json({ message: 'Obecne hasło jest nieprawidłowe' });
  }

  // Hashuj nowe hasło
  const newHash = await bcrypt.hash(newPassword, 10);

  await User.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(String(userId)) },
    {
      $set: {
        passwordHash: newHash,
        requirePasswordReset: false, // Usuń flagę wymagania zmiany hasła
        updatedAt: new Date(),
      },
    }
  );

  return res.status(200).json({ message: 'Hasło zmienione pomyślnie' });
});

// PUT /api/auth/theme-preference – aktualizacja preferencji motywu
const updateThemePreference = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  const { themePreference } = req.body;

  if (!['light', 'dark', 'system'].includes(themePreference)) {
    return res.status(400).json({ message: 'Nieprawidłowa preferencja motywu' });
  }

  await User.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(String(userId)) },
    {
      $set: {
        themePreference,
        updatedAt: new Date(),
      },
    }
  );

  return res.status(200).json({
    message: 'Preferencja motywu zaktualizowana',
    themePreference,
  });
});

module.exports = {
  loginUser,
  registerUser,
  getMe,
  logoutUser,
  demoLogin,
  updateProfile,
  changePassword,
  updateThemePreference,
};
