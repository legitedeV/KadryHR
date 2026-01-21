import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyMultipart from '@fastify/multipart';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import shiftRoutes from './routes/shifts.js';
import availabilityRoutes from './routes/availability.js';
import miscRoutes from './routes/misc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
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
        url: `http://localhost:${process.env.API_PORT || 3000}`,
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

// Register routes
await fastify.register(authRoutes, { prefix: '/api' });
await fastify.register(employeeRoutes, { prefix: '/api' });
await fastify.register(shiftRoutes, { prefix: '/api' });
await fastify.register(availabilityRoutes, { prefix: '/api' });
await fastify.register(miscRoutes, { prefix: '/api' });

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.API_PORT || '3000');
    const host = process.env.API_HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`Server listening on ${host}:${port}`);
    console.log(`API docs available at http://localhost:${port}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
