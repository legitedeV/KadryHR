import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/index.js';
import { sessions, users, type Tenant } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const sessionId = request.cookies.sessionId;

  if (!sessionId) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
      with: {
        user: {
          with: {
            tenant: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return reply.code(401).send({ error: 'Session expired' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
      with: {
        tenant: true,
      },
    });

    if (!user || !user.tenant) {
      return reply.code(401).send({ error: 'User not found' });
    }

    const tenant = user.tenant as Tenant;

    request.user = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}

export async function optionalAuth(request: FastifyRequest) {
  const sessionId = request.cookies.sessionId;
  if (!sessionId) {
    return;
  }

  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
      with: {
        user: {
          with: {
            tenant: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
      with: {
        tenant: true,
      },
    });

    if (!user || !user.tenant) {
      return;
    }

    const tenant = user.tenant as Tenant;

    request.user = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  } catch (error) {
    console.error('Optional authentication error:', error);
  }
}

export function requireAuth(permissions?: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    await authenticate(request, reply);

    if (!request.user) {
      return;
    }

    if (permissions && permissions.length > 0) {
      const hasPermission = permissions.some((p) => {
        if (p === 'owner') return request.user?.role === 'owner';
        if (p === 'admin') return ['owner', 'admin'].includes(request.user?.role || '');
        if (p === 'manager')
          return ['owner', 'admin', 'manager'].includes(request.user?.role || '');
        return true;
      });

      if (!hasPermission) {
        return reply.code(403).send({ error: 'Forbidden' });
      }
    }
  };
}
