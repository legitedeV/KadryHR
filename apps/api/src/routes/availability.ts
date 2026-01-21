import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { availability } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../lib/audit.js';
import { eq, and, gte, lte } from 'drizzle-orm';

const createAvailabilitySchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['unavailable', 'available', 'partial']),
  notes: z.string().optional(),
});

const updateAvailabilitySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

export default async function availabilityRoutes(fastify: FastifyInstance) {
  // List availability
  fastify.get('/availability', { preHandler: requireAuth() }, async (request, reply) => {
    try {
      const { status, employeeId, startDate, endDate } = request.query as {
        status?: string;
        employeeId?: string;
        startDate?: string;
        endDate?: string;
      };

      const whereConditions = eq(availability.tenantId, request.user!.tenantId);

      const conditions = [whereConditions];
      if (status) {
        conditions.push(eq(availability.status, status as 'pending' | 'approved' | 'rejected'));
      }
      if (employeeId) {
        conditions.push(eq(availability.employeeId, employeeId));
      }
      if (startDate) {
        conditions.push(gte(availability.date, startDate));
      }
      if (endDate) {
        conditions.push(lte(availability.date, endDate));
      }

      const results = await db.query.availability.findMany({
        where: and(...conditions),
        with: {
          employee: true,
        },
        orderBy: (availability, { asc }) => [asc(availability.date)],
      });

      return reply.send({ data: results });
    } catch (error) {
      console.error('List availability error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create availability
  fastify.post('/availability', { preHandler: requireAuth() }, async (request, reply) => {
    try {
      const body = createAvailabilitySchema.parse(request.body);

      // Check if employee can create availability for this employee
      const canCreate =
        request.user!.role === 'owner' ||
        request.user!.role === 'admin' ||
        request.user!.role === 'manager';

      // If not admin/manager, can only create for own employee record
      if (!canCreate) {
        const employee = await db.query.employees.findFirst({
          where: and(
            eq(availability.employeeId, body.employeeId),
            eq(availability.tenantId, request.user!.tenantId)
          ),
        });

        if (!employee || employee.userId !== request.user!.id) {
          return reply.code(403).send({ error: 'Cannot create availability for other employees' });
        }
      }

      const [entry] = await db
        .insert(availability)
        .values({
          tenantId: request.user!.tenantId,
          ...body,
          status: 'pending',
        })
        .returning();

      await logAudit(
        request.user!.tenantId,
        request.user!.id,
        'create',
        'availability',
        entry.id,
        { availability: body }
      );

      return reply.code(201).send({ data: entry });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Create availability error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update availability (approve/reject)
  fastify.patch('/availability/:id', { preHandler: requireAuth(['manager']) }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateAvailabilitySchema.parse(request.body);

      const [entry] = await db
        .update(availability)
        .set({ ...body, updatedAt: new Date() })
        .where(and(eq(availability.id, id), eq(availability.tenantId, request.user!.tenantId)))
        .returning();

      if (!entry) {
        return reply.code(404).send({ error: 'Availability not found' });
      }

      await logAudit(
        request.user!.tenantId,
        request.user!.id,
        'update',
        'availability',
        entry.id,
        { updates: body }
      );

      return reply.send({ data: entry });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Update availability error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
