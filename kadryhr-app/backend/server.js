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
const PDFDocument = require('pdfkit');

// === KONFIGURACJA PODSTAWOWA ===
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kadryhr';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://kadryhr.pl';
const DEMO_MODE = process.env.DEMO_MODE === 'true';

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
const { protect } = require('./middleware/authMiddleware');
const employeeRoutes = require('./routes/employeeRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const sickLeaveRoutes = require('./routes/sickLeaveRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const reportRoutes = require('./routes/reportRoutes');

// === DANE DEMO (tryb offline bez MongoDB) ===
const demoEmployees = [
  { name: 'Anna Kowalska', email: 'anna@demo.pl', position: 'HR Manager', status: 'active' },
  { name: 'Jan Nowak', email: 'jan@demo.pl', position: 'Specjalista ds. kadr', status: 'active' },
  { name: 'Ewa Zielińska', email: 'ewa@demo.pl', position: 'Księgowa', status: 'inactive' },
];

let demoInvites = [
  {
    _id: 'demo-invite-1',
    email: 'nowy@demo.pl',
    role: 'user',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    used: false,
  },
];

const demoSummary = {
  totalEmployees: demoEmployees.length,
  activeEmployees: demoEmployees.filter((e) => e.status === 'active').length,
  totalPayrollAmount: 42000,
};

// === ROUTES MOUNT ===

// root – healthcheck
app.get('/', (req, res) => {
  res.json({
    message: 'KadryHR API działa (root)',
    mode: DEMO_MODE ? 'demo' : 'standard',
  });
});

// API
app.use('/api/auth', authRoutes);

if (DEMO_MODE) {
  console.warn('⚠️  Uruchomiono tryb DEMO_MODE – używane są dane w pamięci.');

  app.get('/api/employees/summary', protect, (req, res) => {
    res.json(demoSummary);
  });

  app.get('/api/invites', protect, (req, res) => {
    res.json(demoInvites);
  });

  app.post('/api/invites', protect, (req, res) => {
    const { email, role } = req.body || {};
    const invite = {
      _id: `demo-invite-${Date.now()}`,
      email: email || 'nowy@demo.pl',
      role: role || 'user',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      used: false,
    };
    demoInvites = [invite, ...demoInvites].slice(0, 10);

    return res.status(201).json({
      message: 'Link wygenerowany (tryb demo)',
      link: `https://kadryhr.pl/invite/${invite._id}`,
    });
  });

  app.post('/api/payroll/calculate', protect, (req, res) => {
    const hourlyRate = Number(req.body?.hourlyRate || 0);
    const baseHours = Number(req.body?.baseHours || 0);
    const overtimeHours = Number(req.body?.overtimeHours || 0);
    const overtimeMultiplier = Number(req.body?.overtimeMultiplier || 1);
    const bonus = Number(req.body?.bonus || 0);

    const base = Math.round(hourlyRate * baseHours * 100) / 100;
    const overtime =
      Math.round(hourlyRate * overtimeHours * overtimeMultiplier * 100) / 100;
    const gross = Math.round((base + overtime + bonus) * 100) / 100;
    const contributions = Math.round(gross * 0.2 * 100) / 100;
    const tax = Math.round(gross * 0.12 * 100) / 100;
    const net = Math.round((gross - contributions - tax) * 100) / 100;

    return res.json({ base, overtime, bonus, gross, contributions, tax, net });
  });

  app.get('/api/reports/employees/:type', protect, (req, res) => {
    const { type } = req.params;

    if (type === 'csv') {
      const csvContent = [
        'name,email,position,status',
        ...demoEmployees.map(
          (emp) =>
            `${emp.name},${emp.email},${emp.position},${emp.status || 'active'}`
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
      return res.send(csvContent);
    }

    const pdfDoc = new PDFDocument();
    const chunks = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="employees.pdf"'
      );
      res.send(pdfBuffer);
    });

    pdfDoc.fontSize(16).text('Raport pracowników (tryb demo)', { underline: true });
    pdfDoc.moveDown();
    demoEmployees.forEach((emp, idx) => {
      pdfDoc
        .fontSize(12)
        .text(`${idx + 1}. ${emp.name} – ${emp.position} (${emp.status})`);
    });
    pdfDoc.end();
  });

  // 404 dla nieistniejących endpointów API
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      message: `Endpoint w trybie demo nie istnieje: ${req.method} ${req.originalUrl}`,
    });
  });

  app.listen(PORT, () => {
    console.log(`✅ KadryHR backend (DEMO) słucha na porcie ${PORT}`);
    console.log(`   FRONTEND_URL: ${FRONTEND_URL}`);
  });
} else {
  app.use('/api/employees', employeeRoutes);
  app.use('/api/invites', inviteRoutes);
  app.use('/api/leaves', leaveRoutes);
  app.use('/api/sick-leaves', sickLeaveRoutes);
  app.use('/api/schedule', scheduleRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/payroll', payrollRoutes);
  app.use('/api/reports', reportRoutes);

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
}
