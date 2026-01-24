import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, tenants, sessions, oauthAccounts, passwordResetTokens, type Tenant } from '../db/schema.js';
import { hashPassword, verifyPassword, generateSessionId, getSessionExpiry, generateToken } from '../lib/auth.js';
import { logAudit } from '../lib/audit.js';
import { eq, and, isNull } from 'drizzle-orm';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { buildPasswordResetEmail, getEmailProvider } from '../lib/email.js';
import { buckets } from '../lib/storage.js';
import crypto from 'crypto';

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

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

const unlinkSchema = z.object({
  password: z.string().min(8),
});

const googleAuthUrlSchema = z.object({
  state: z.string(),
  nonce: z.string(),
});

const googleCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

const sessionCookieOptions = {
  domain: process.env.COOKIE_DOMAIN || '.localtest.me',
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

const googleProvider = 'google';

function getAppBaseUrl(): string {
  return process.env.APP_BASE_URL || 'http://kadryhr.localtest.me:5173';
}

function getRoleRedirectUrl(role: string): string {
  const panelDomain = process.env.PANEL_DOMAIN || 'panel.kadryhr.localtest.me';
  const adminDomain = process.env.ADMIN_DOMAIN || 'admin.kadryhr.localtest.me';
  const base = role === 'admin' ? adminDomain : panelDomain;
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${base}/panel/dashboard`;
}

function createPasswordResetToken(): { raw: string; hash: string; expiresAt: Date } {
  const raw = generateToken();
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  return { raw, hash, expiresAt };
}

async function createSession(userId: string) {
  const sessionId = generateSessionId();
  const expiresAt = getSessionExpiry();
  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });
  return { sessionId, expiresAt };
}

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

      const { sessionId, expiresAt } = await createSession(user.id);

      // Log audit
      await logAudit(tenant.id, user.id, 'register', 'user', user.id);

      // Set cookie
      reply.setCookie('sessionId', sessionId, {
        ...sessionCookieOptions,
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

      if (!user || !user.tenant) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await verifyPassword(user.passwordHash, body.password);
      if (!isValid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const { sessionId, expiresAt } = await createSession(user.id);

      // Log audit
      await logAudit(user.tenantId, user.id, 'login', 'user', user.id);

      // Set cookie
      reply.setCookie('sessionId', sessionId, {
        ...sessionCookieOptions,
        expires: expiresAt,
      });

      const tenant = user.tenant as Tenant;

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

  const handleForgotPassword = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = forgotPasswordSchema.parse(request.body);
      const user = await db.query.users.findFirst({
        where: eq(users.email, body.email),
      });

      if (!user) {
        return reply.send({ success: true, message: 'If the email exists, a recovery link has been sent' });
      }

      const { raw, hash, expiresAt } = createPasswordResetToken();

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash: hash,
        expiresAt,
      });

      const resetUrl = `${getAppBaseUrl()}/reset-hasla?token=${raw}`;
      const emailProvider = getEmailProvider();
      await emailProvider.sendEmail(buildPasswordResetEmail(user.email, resetUrl));

      await logAudit(user.tenantId, user.id, 'password_recovery_requested', 'user', user.id, {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({ success: true, message: 'If the email exists, a recovery link has been sent' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Forgot password error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  };

  const handleResetPassword = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = resetPasswordSchema.parse(request.body);
      const tokenHash = crypto.createHash('sha256').update(body.token).digest('hex');

      const tokenEntry = await db.query.passwordResetTokens.findFirst({
        where: and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt)
        ),
      });

      if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
        return reply.code(400).send({ error: 'Invalid or expired token' });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, tokenEntry.userId),
      });

      if (!user) {
        return reply.code(400).send({ error: 'Invalid or expired token' });
      }

      const passwordHash = await hashPassword(body.password);
      await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));
      await db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, tokenEntry.id));

      await logAudit(user.tenantId, user.id, 'password_reset', 'user', user.id, {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Reset password error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  };

  // Forgot password
  fastify.post('/auth/forgot-password', handleForgotPassword);

  // Reset password
  fastify.post('/auth/reset-password', handleResetPassword);

  // Legacy endpoints (backwards compatible)
  fastify.post('/auth/recover', handleForgotPassword);

  fastify.post('/auth/reset', handleResetPassword);

  // Google OAuth
  fastify.get('/auth/google', async (_request, reply) => {
    try {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
        return reply.code(500).send({ error: 'Google OAuth is not configured' });
      }
      const state = generateToken();
      const nonce = generateToken();
      googleAuthUrlSchema.parse({ state, nonce });

      reply.setCookie('google_oauth_state', state, {
        ...sessionCookieOptions,
        maxAge: 10 * 60,
      });
      reply.setCookie('google_oauth_nonce', nonce, {
        ...sessionCookieOptions,
        maxAge: 10 * 60,
      });

      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
        response_type: 'code',
        scope: 'openid email profile',
        state,
        nonce,
        access_type: 'offline',
        prompt: 'consent',
      });

      return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    } catch (error) {
      console.error('Google auth start error:', error);
      return reply.code(500).send({ error: 'OAuth start failed' });
    }
  });

  fastify.get('/auth/google/callback', async (request, reply) => {
    try {
      await optionalAuth(request);
      const { code, state } = googleCallbackSchema.parse(request.query);

      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
        return reply.code(500).send({ error: 'Google OAuth is not configured' });
      }

      const storedState = request.cookies.google_oauth_state;
      if (!storedState || storedState !== state) {
        return reply.code(400).send({ error: 'Invalid state' });
      }

      reply.clearCookie('google_oauth_state', sessionCookieOptions);
      reply.clearCookie('google_oauth_nonce', sessionCookieOptions);

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        return reply.code(400).send({ error: `OAuth token exchange failed: ${errorText}` });
      }

      const tokenPayload = await tokenResponse.json();
      const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenPayload.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        return reply.code(400).send({ error: 'Failed to fetch Google profile' });
      }

      const profile = await userInfoResponse.json();
      const providerUserId = profile.sub as string;
      const email = profile.email as string;
      const name = profile.name as string;
      const avatarUrl = profile.picture as string | undefined;

      let user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      const existingOauthAccount = await db.query.oauthAccounts.findFirst({
        where: and(eq(oauthAccounts.provider, googleProvider), eq(oauthAccounts.providerUserId, providerUserId)),
      });

      if (existingOauthAccount) {
        user = await db.query.users.findFirst({
          where: eq(users.id, existingOauthAccount.userId),
        });

        await db
          .update(oauthAccounts)
          .set({
            accessToken: tokenPayload.access_token,
            refreshToken: tokenPayload.refresh_token,
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(oauthAccounts.id, existingOauthAccount.id));
      } else if (request.user) {
        user = await db.query.users.findFirst({
          where: eq(users.id, request.user.id),
        });
        if (!user) {
          return reply.code(400).send({ error: 'User not found' });
        }

        const alreadyLinked = await db.query.oauthAccounts.findFirst({
          where: and(eq(oauthAccounts.userId, user.id), eq(oauthAccounts.provider, googleProvider)),
        });

        if (!alreadyLinked) {
          await db.insert(oauthAccounts).values({
            userId: user.id,
            provider: googleProvider,
            providerUserId,
            email,
            accessToken: tokenPayload.access_token,
            refreshToken: tokenPayload.refresh_token,
            lastUsedAt: new Date(),
          });
        }
      } else if (user) {
        const alreadyLinked = await db.query.oauthAccounts.findFirst({
          where: and(eq(oauthAccounts.userId, user.id), eq(oauthAccounts.provider, googleProvider)),
        });

        if (!alreadyLinked) {
          await db.insert(oauthAccounts).values({
            userId: user.id,
            provider: googleProvider,
            providerUserId,
            email,
            accessToken: tokenPayload.access_token,
            refreshToken: tokenPayload.refresh_token,
            lastUsedAt: new Date(),
          });
        }
      } else {
        const tenantName = name ? `${name} Workspace` : 'KadryHR Workspace';
        const slug = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const [tenant] = await db
          .insert(tenants)
          .values({
            name: tenantName,
            slug,
            settings: {},
          })
          .returning();

        const randomPassword = generateToken();
        const passwordHash = await hashPassword(randomPassword);
        const [createdUser] = await db
          .insert(users)
          .values({
            tenantId: tenant.id,
            email,
            passwordHash,
            name: name || email,
            avatarUrl: avatarUrl || null,
            role: 'owner',
          })
          .returning();
        user = createdUser;

        await db.insert(oauthAccounts).values({
          userId: user.id,
          provider: googleProvider,
          providerUserId,
          email,
          accessToken: tokenPayload.access_token,
          refreshToken: tokenPayload.refresh_token,
          lastUsedAt: new Date(),
        });
      }

      if (!user) {
        return reply.code(400).send({ error: 'User not found' });
      }

      if (avatarUrl && !user.avatarUrl) {
        await db.update(users).set({ avatarUrl, updatedAt: new Date() }).where(eq(users.id, user.id));
      }

      const { sessionId, expiresAt } = await createSession(user.id);
      reply.setCookie('sessionId', sessionId, {
        ...sessionCookieOptions,
        expires: expiresAt,
      });

      await logAudit(user.tenantId, user.id, 'oauth_login', 'user', user.id, {
        provider: googleProvider,
        bucket: buckets.avatars,
      });

      return reply.redirect(getRoleRedirectUrl(user.role));
    } catch (error) {
      console.error('Google callback error:', error);
      return reply.code(500).send({ error: 'OAuth callback failed' });
    }
  });

  fastify.post('/auth/google/unlink', { preHandler: requireAuth() }, async (request, reply) => {
    try {
      const body = unlinkSchema.parse(request.body);
      const user = await db.query.users.findFirst({
        where: eq(users.id, request.user!.id),
      });
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const validPassword = await verifyPassword(user.passwordHash, body.password);
      if (!validPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const existingAccount = await db.query.oauthAccounts.findFirst({
        where: and(eq(oauthAccounts.userId, user.id), eq(oauthAccounts.provider, googleProvider)),
      });
      if (!existingAccount) {
        return reply.code(404).send({ error: 'Google account not linked' });
      }

      await db.delete(oauthAccounts).where(eq(oauthAccounts.id, existingAccount.id));
      await logAudit(user.tenantId, user.id, 'oauth_unlink', 'user', user.id, {
        provider: googleProvider,
      });

      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Unlink error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
