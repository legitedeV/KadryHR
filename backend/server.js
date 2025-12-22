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
  FRONTEND_URL,            // np. http://kadryhr.pl lub https://kadryhr.pl
  'http://kadryhr.pl',
  'https://kadryhr.pl',
  'http://www.kadryhr.pl',
  'https://www.kadryhr.pl',
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
  limit: 60,           // max 60 requestów / minutę na IP (zwiększone dla lepszej UX)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.',
  },
  skip: (req) => {
    // Pomijaj rate limiting dla healthcheck
    return req.path === '/' || req.path === '/health';
  },
});

// Bardziej restrykcyjny limit dla logowania
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  limit: 5,                  // max 5 prób logowania
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.',
  },
});

// ograniczamy tylko /api
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);

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
const availabilityRoutes = require('./routes/availabilityRoutes');
const shiftTemplateRoutes = require('./routes/shiftTemplateRoutes');

// === ROUTES MOUNT ===

// root – healthcheck
app.get('/', (req, res) => {
  res.json({ message: 'KadryHR API działa (root)' });
});

// API
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/sick-leaves', sickLeaveRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/swap-requests', swapRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/shift-templates', shiftTemplateRoutes);

// 404 dla nieistniejących endpointów API
app.all('/api/*', (req, res) => {
  res.status(404).json({
    message: `Nie znaleziono endpointu API: ${req.method} ${req.originalUrl}`,
  });
});

// === GLOBAL ERROR HANDLER ===
app.use((err, req, res, next) => {
  console.error('🔥 Global error handler:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Wewnętrzny błąd serwera';

  // Zwracaj stack trace tylko w development
  const response = {
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
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
