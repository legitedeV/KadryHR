require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const xssClean = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { rateLimit } = require('express-rate-limit');
const compression = require('compression');
const { Server } = require('socket.io');

// Custom middleware i utilities
const performanceMonitor = require('./middleware/performanceMonitor');
const { cacheMiddleware, getCacheStats } = require('./middleware/cacheMiddleware');
const logger = require('./utils/logger');

// === KONFIGURACJA PODSTAWOWA ===
const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kadryhr';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://kadryhr.pl';

// === COMPRESSION ===
app.use(compression({
  level: 6, // Poziom kompresji (0-9)
  threshold: 1024, // Kompresuj tylko odpowiedzi > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// === PERFORMANCE MONITORING ===
app.use(performanceMonitor);

// Kolorowe logowanie requestów
app.use((req, res, next) => {
  logger.request(req);
  next();
});

// === SECURITY MIDDLEWARE ===
app.use(helmet());
app.use(xssClean());
app.use(mongoSanitize());
app.use(hpp());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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

// === SOCKET.IO SETUP ===
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-dev');
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);

  // Join user's personal room
  socket.join(`user:${socket.userId}`);

  // Handle joining conversation rooms
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    logger.info(`User ${socket.userId} joined conversation ${conversationId}`);
  });

  // Handle leaving conversation rooms
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    logger.info(`User ${socket.userId} left conversation ${conversationId}`);
  });

  // Handle typing indicator
  socket.on('typing', ({ conversationId, isTyping }) => {
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id} (User: ${socket.userId})`);
  });
});

// Make io accessible to routes
app.set('io', io);

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
const scheduleV2Routes = require('./routes/scheduleV2Routes');
const notificationRoutes = require('./routes/notificationRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const reportRoutes = require('./routes/reportRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');
const swapRoutes = require('./routes/swapRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const shiftTemplateRoutes = require('./routes/shiftTemplateRoutes');
const timeTrackingRoutes = require('./routes/timeTrackingRoutes');
const qrRoutes = require('./routes/qrRoutes');
const avatarRoutes = require('./routes/avatarRoutes');
const chatRoutes = require('./routes/chatRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const realtimeRoutes = require('./routes/realtimeRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// === ROUTES MOUNT ===

// root – healthcheck
app.get('/', (req, res) => {
  res.json({ message: 'KadryHR API działa (root)' });
});

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const cacheStats = getCacheStats();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    },
    memory: {
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
    },
    cache: {
      entries: cacheStats.size,
      enabled: true,
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    },
    environment: process.env.NODE_ENV || 'development',
    version: '1.1.0',
  };
  
  logger.info('Health check requested', { status: health.status });
  res.json(health);
});

// API - z cache dla GET requestów (5 minut)
app.use('/api/auth', authRoutes);
app.use('/api/employees', cacheMiddleware(3 * 60 * 1000), employeeRoutes); // 3 min cache
app.use('/api/invites', inviteRoutes);
app.use('/api/leaves', cacheMiddleware(2 * 60 * 1000), leaveRoutes); // 2 min cache
app.use('/api/sick-leaves', cacheMiddleware(2 * 60 * 1000), sickLeaveRoutes); // 2 min cache
app.use('/api/schedule', cacheMiddleware(5 * 60 * 1000), scheduleRoutes); // 5 min cache (old system)
app.use('/api/schedules/v2', scheduleV2Routes); // New schedule system (no cache for now)
app.use('/api/notifications', notificationRoutes); // Bez cache - dane real-time
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', cacheMiddleware(10 * 60 * 1000), reportRoutes); // 10 min cache
app.use('/api/suggestions', cacheMiddleware(5 * 60 * 1000), suggestionRoutes); // 5 min cache
app.use('/api/swap-requests', swapRoutes);
app.use('/api/availability', cacheMiddleware(5 * 60 * 1000), availabilityRoutes); // 5 min cache
app.use('/api/shift-templates', cacheMiddleware(10 * 60 * 1000), shiftTemplateRoutes); // 10 min cache
app.use('/api/time-tracking', timeTrackingRoutes); // No cache - real-time data
app.use('/api/qr', qrRoutes); // QR token routes
app.use('/api/avatar', avatarRoutes); // Avatar upload routes
app.use('/api/chat', chatRoutes); // Chat routes
app.use('/api/permissions', permissionRoutes); // Permissions management routes
app.use('/api/realtime', realtimeRoutes); // Realtime SSE events
app.use('/api/webhooks', webhookRoutes); // Webhook management

// Serve static files (avatars)
app.use('/uploads', express.static('uploads'));

// 404 dla nieistniejących endpointów API
app.all('/api/*', (req, res) => {
  res.status(404).json({
    message: `Nie znaleziono endpointu API: ${req.method} ${req.originalUrl}`,
  });
});

// === GLOBAL ERROR HANDLER ===
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Wewnętrzny błąd serwera';

  // Kategoryzacja błędów
  let errorType = 'UNKNOWN';
  if (statusCode >= 400 && statusCode < 500) errorType = 'CLIENT_ERROR';
  if (statusCode >= 500) errorType = 'SERVER_ERROR';
  if (err.name === 'ValidationError') errorType = 'VALIDATION_ERROR';
  if (err.name === 'CastError') errorType = 'CAST_ERROR';
  if (err.name === 'MongoError') errorType = 'DATABASE_ERROR';

  logger.error(`${errorType}: ${message}`, {
    path: req.path,
    method: req.method,
    statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Zwracaj stack trace tylko w development
  const response = {
    error: true,
    type: errorType,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.errors,
    }),
  };

  res.status(statusCode).json(response);
});

// === START SERWERA PO POŁĄCZENIU Z MONGO ===
mongoose.set('strictQuery', true);

// Optymalizacja połączenia MongoDB
const mongooseOptions = {
  maxPoolSize: 10, // Maksymalna liczba połączeń w puli
  minPoolSize: 2,  // Minimalna liczba połączeń w puli
  socketTimeoutMS: 45000, // Timeout dla operacji
  serverSelectionTimeoutMS: 5000, // Timeout dla wyboru serwera
  family: 4, // Użyj IPv4
};

// Event listeners dla MongoDB
mongoose.connection.on('connected', () => {
  logger.success('MongoDB connected', { uri: MONGO_URI.replace(/\/\/.*@/, '//***@') });
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.warn('SIGINT received, closing MongoDB connection...');
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
});

mongoose
  .connect(MONGO_URI, mongooseOptions)
  .then(() => {
    logger.separator();
    logger.startup('KadryHR Backend Started Successfully! 🎉');
    logger.separator();
    
    // Start session worker for auto-closing expired sessions
    const { startSessionWorker } = require('./utils/sessionWorker');
    startSessionWorker(5); // Check every 5 minutes
    
    // Initialize webhook dispatcher
    require('./utils/webhookDispatcher');
    logger.info('Webhook dispatcher initialized');
    
    server.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
      logger.info(`Frontend URL: ${FRONTEND_URL}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Node version: ${process.version}`);
      logger.separator();
      
      // Wyświetl dostępne endpointy
      logger.info('Available endpoints:');
      console.log('  GET  / - Root healthcheck');
      console.log('  GET  /health - Enhanced health check');
      console.log('  POST /api/auth/login - User login');
      console.log('  POST /api/auth/demo - Demo login');
      console.log('  POST /api/auth/register - User registration');
      console.log('  GET  /api/auth/me - Get current user');
      logger.separator();
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
