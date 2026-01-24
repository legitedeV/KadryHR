import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyMultipart from '@fastify/multipart';
import fastifyHelmet from '@fastify/helmet';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { nanoid } from 'nanoid';

import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import shiftRoutes from './routes/shifts.js';
import availabilityRoutes from './routes/availability.js';
import miscRoutes from './routes/misc.js';
import { httpRequestDuration, httpRequestErrors, registerMetricsRoute } from './lib/metrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const apiPort = parseInt(process.env.API_PORT || process.env.PORT || '3000');

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
  genReqId: () => nanoid(16),
});

// CORS
await fastify.register(fastifyCors, {
  origin: (origin, cb) => {
    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
});

// Cookie
await fastify.register(fastifyCookie, {
  secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
});

// Security headers
await fastify.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
});

// Rate limiting
await fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Multipart
await fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Swagger
await fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'KadryHR API',
      description: 'KadryHR v2 REST API',
      version: '2.0.0',
    },
    servers: [
      {
        url: `http://localhost:${apiPort}`,
      },
    ],
  },
});

await fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});

// Global error handler
fastify.setErrorHandler((error, _request, reply) => {
  fastify.log.error(error);
  
  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation error',
      details: error.validation,
    });
  }

  return reply.code(error.statusCode || 500).send({
    error: error.message || 'Internal server error',
  });
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

fastify.addHook('onRequest', async (request) => {
  const startTime = Date.now();
  request.log = request.log.child({ requestId: request.id });
  (request as { startTime?: number }).startTime = startTime;
});

fastify.addHook('onResponse', async (request, reply) => {
  const startTime = (request as { startTime?: number }).startTime || Date.now();
  const duration = (Date.now() - startTime) / 1000;
  const route = request.routerPath || request.url;
  const labels = {
    method: request.method,
    route,
    status: reply.statusCode.toString(),
  };

  httpRequestDuration.observe(labels, duration);
  if (reply.statusCode >= 400) {
    httpRequestErrors.inc(labels);
  }

  request.log.info(
    {
      userId: request.user?.id,
      tenantId: request.user?.tenantId,
      statusCode: reply.statusCode,
      duration,
    },
    'request completed'
  );
});

fastify.addHook('onSend', async (request, reply) => {
  reply.header('x-request-id', request.id);
});

await registerMetricsRoute(fastify);

// Register routes
await fastify.register(authRoutes, { prefix: '/api' });
await fastify.register(employeeRoutes, { prefix: '/api' });
await fastify.register(shiftRoutes, { prefix: '/api' });
await fastify.register(availabilityRoutes, { prefix: '/api' });
await fastify.register(miscRoutes, { prefix: '/api' });

// Start server
const start = async () => {
  try {
    const host = process.env.API_HOST || '0.0.0.0';
    
    await fastify.listen({ port: apiPort, host });
    
    console.log(`Server listening on ${host}:${apiPort}`);
    console.log(`API docs available at http://localhost:${apiPort}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
