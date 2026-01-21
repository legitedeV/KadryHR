import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, tenants, sessions } from '../db/schema.js';
import { hashPassword, verifyPassword, generateSessionId, getSessionExpiry, generateToken } from '../lib/auth.js';
import { logAudit } from '../lib/audit.js';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  orgName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const recoverSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/auth/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, body.email),
      });

      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      // Create tenant
      const slug = body.orgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const [tenant] = await db
        .insert(tenants)
        .values({
          name: body.orgName,
          slug,
          settings: {},
        })
        .returning();

      // Create user
      const passwordHash = await hashPassword(body.password);
      const [user] = await db
        .insert(users)
        .values({
          tenantId: tenant.id,
          email: body.email,
          passwordHash,
          name: body.name,
          role: 'owner',
        })
        .returning();

      // Create session
      const sessionId = generateSessionId();
      const expiresAt = getSessionExpiry();
      
      await db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        expiresAt,
      });

      // Log audit
      await logAudit(tenant.id, user.id, 'register', 'user', user.id);

      // Set cookie
      reply.setCookie('sessionId', sessionId, {
        domain: process.env.COOKIE_DOMAIN || '.localtest.me',
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
      });

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Register error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Login
  fastify.post('/auth/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, body.email),
        with: {
          tenant: true,
        },
      });

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await verifyPassword(user.passwordHash, body.password);
      if (!isValid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Create session
      const sessionId = generateSessionId();
      const expiresAt = getSessionExpiry();
      
      await db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        expiresAt,
      });

      // Log audit
      await logAudit(user.tenantId, user.id, 'login', 'user', user.id);

      // Set cookie
      reply.setCookie('sessionId', sessionId, {
        domain: process.env.COOKIE_DOMAIN || '.localtest.me',
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
      });

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Login error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Logout
  fastify.post('/auth/logout', { preHandler: requireAuth() }, async (request, reply) => {
    try {
      const sessionId = request.cookies.sessionId;
      if (sessionId) {
        await db.delete(sessions).where(eq(sessions.id, sessionId));
        await logAudit(request.user!.tenantId, request.user!.id, 'logout', 'user', request.user!.id);
      }

      reply.clearCookie('sessionId', {
        domain: process.env.COOKIE_DOMAIN || '.localtest.me',
        path: '/',
      });

      return reply.send({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Me
  fastify.get('/auth/me', { preHandler: requireAuth() }, async (request, reply) => {
    return reply.send({
      user: request.user,
    });
  });

  // Recover password (generates token but doesn't send email in this implementation)
  fastify.post('/auth/recover', async (request, reply) => {
    try {
      const body = recoverSchema.parse(request.body);

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, body.email),
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return reply.send({ success: true, message: 'If the email exists, a recovery link has been sent' });
      }

      // Generate token (in production, save this and send via email)
      const token = generateToken();
      
      // Log audit
      await logAudit(user.tenantId, user.id, 'password_recovery_requested', 'user', user.id);

      // In production, save token to database with expiry and send email
      console.log(`Recovery token for ${user.email}: ${token}`);

      return reply.send({ 
        success: true, 
        message: 'If the email exists, a recovery link has been sent',
        // Only for development - remove in production!
        _dev_token: token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Recover error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Reset password (simplified - in production verify token from database)
  fastify.post('/auth/reset', async (request, reply) => {
    try {
      resetSchema.parse(request.body);

      // In production, verify token from database and get user
      // For now, this is a stub that always fails
      return reply.code(400).send({ error: 'Invalid or expired token' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Reset error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
