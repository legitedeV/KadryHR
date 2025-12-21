require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const xssClean = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { rateLimit } = require('express-rate-limit');

// === KONFIGURACJA PODSTAWOWA ===
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kadryhr';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://kadryhr.pl';

// do logów, żeby widzieć co przychodzi
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.path, 'IP:', req.ip);
  next();
});

// === SECURITY MIDDLEWARE ===
app.use(helmet());
app.use(xssClean());
app.use(mongoSanitize());
app.use(hpp());

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// === CORS ===
const allowedOrigins = [
  FRONTEND_URL,            // np. http://kadryhr.pl
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const corsOptions = {
  origin(origin, callback) {
    // pozwól na brak origin (np. curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const err = new Error(`Nieautoryzowany origin: ${origin}`);
    err.statusCode = 403;
    return callback(err);
  },
  credentials: true,
};

app.use(cors(corsOptions));

// === RATE LIMIT (bez custom keyGenerator, domyślny jest OK i bezpieczny) ===
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  limit: 30,           // max 30 requestów / minutę na IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.',
  },
});

// ograniczamy tylko /api
app.use('/api', apiLimiter);

// === ROUTES IMPORTY ===
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const sickLeaveRoutes = require('./routes/sickLeaveRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const reportRoutes = require('./routes/reportRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');
const swapRoutes = require('./routes/swapRoutes');

// W środowisku produkcyjnym zdarzało się, że require zwracał obiekt { default: router }
// (np. przy mieszanym ESM/CJS). Poniżej helper, który bezpiecznie wyciągnie router
// i nie pozwoli, żeby app.use wysadziło backend błędem "Router.use() requires middleware".
const normalizeRouter = (maybeRouter) => {
  if (maybeRouter && typeof maybeRouter === 'object' && maybeRouter.default) {
    return maybeRouter.default;
  }

  if (maybeRouter && typeof maybeRouter === 'function') {
    return maybeRouter;
  }

  if (maybeRouter && typeof maybeRouter.use === 'function') {
    return maybeRouter;
  }

  console.error('[ROUTER] Niepoprawny eksport routera, pomijam mount:', maybeRouter);
  return null;
};

// === ROUTES MOUNT ===

// root – healthcheck
app.get('/', (req, res) => {
  res.json({ message: 'KadryHR API działa (root)' });
});

// API (z bezpiecznym montowaniem routerów)
const safeUse = (path, router) => {
  const normalized = normalizeRouter(router);
  if (normalized) {
    app.use(path, normalized);
  } else {
    console.error(`[ROUTER] Pomijam mount ${path} – eksport nie jest routerem.`);
  }
};

safeUse('/api/auth', authRoutes);
safeUse('/api/employees', employeeRoutes);
safeUse('/api/invites', inviteRoutes);
safeUse('/api/leaves', leaveRoutes);
safeUse('/api/sick-leaves', sickLeaveRoutes);
safeUse('/api/schedule', scheduleRoutes);
safeUse('/api/notifications', notificationRoutes);
safeUse('/api/payroll', payrollRoutes);
safeUse('/api/reports', reportRoutes);
safeUse('/api/suggestions', suggestionRoutes);
safeUse('/api/swap-requests', swapRoutes);

// 404 dla nieistniejących endpointów API
app.all('/api/*', (req, res) => {
  res.status(404).json({
    message: `Nie znaleziono endpointu API: ${req.method} ${req.originalUrl}`,
  });
});

// === GLOBAL ERROR HANDLER ===
app.use((err, req, res, next) => {
  console.error('🔥 Global error handler:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Wewnętrzny błąd serwera';

  // jeżeli to błąd CORS / rate-limit, też trafia tutaj
  res.status(statusCode).json({ message });
});

// === START SERWERA PO POŁĄCZENIU Z MONGO ===
mongoose.set('strictQuery', true);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`✅ Połączono z MongoDB: ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`✅ KadryHR backend słucha na porcie ${PORT}`);
      console.log(`   FRONTEND_URL: ${FRONTEND_URL}`);
    });
  })
  .catch((err) => {
    console.error('❌ Błąd połączenia z MongoDB', err);
    process.exit(1);
  });
