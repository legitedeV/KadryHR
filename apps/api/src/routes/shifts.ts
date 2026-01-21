import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { shifts, schedules } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../lib/audit.js';
import { eq, and, gte, lte, or, lt, gt } from 'drizzle-orm';

const createShiftSchema = z.object({
  scheduleId: z.string().uuid(),
  employeeId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  positionId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const updateShiftSchema = createShiftSchema.partial();

export default async function shiftRoutes(fastify: FastifyInstance) {
  // Get shifts for a schedule
  fastify.get('/schedules/:id/shifts', { preHandler: requireAuth() }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

      const schedule = await db.query.schedules.findFirst({
        where: and(eq(schedules.id, id), eq(schedules.tenantId, request.user!.tenantId)),
      });

      if (!schedule) {
        return reply.code(404).send({ error: 'Schedule not found' });
      }

      const conditions = [
        eq(shifts.scheduleId, id),
        eq(shifts.tenantId, request.user!.tenantId)
      ];

      if (startDate && endDate) {
        conditions.push(gte(shifts.startTime, new Date(startDate)));
        conditions.push(lte(shifts.startTime, new Date(endDate)));
      }

      const results = await db.query.shifts.findMany({
        where: and(...conditions),
        with: {
          employee: true,
          position: true,
        },
        orderBy: (shifts, { asc }) => [asc(shifts.startTime)],
      });

      return reply.send({ data: results });
    } catch (error) {
      console.error('List shifts error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create shift
  fastify.post('/shifts', { preHandler: requireAuth(['manager']) }, async (request, reply) => {
    try {
      const body = createShiftSchema.parse(request.body);

      // Check if schedule exists and belongs to tenant
      const schedule = await db.query.schedules.findFirst({
        where: and(
          eq(schedules.id, body.scheduleId),
          eq(schedules.tenantId, request.user!.tenantId)
        ),
      });

      if (!schedule) {
        return reply.code(404).send({ error: 'Schedule not found' });
      }

      // Check publish lock
      const startTime = new Date(body.startTime);
      if (schedule.publishedUntil) {
        const publishedUntil = new Date(schedule.publishedUntil);
        if (startTime <= publishedUntil) {
          return reply.code(400).send({
            error: 'Cannot create shift in published period',
            publishedUntil: schedule.publishedUntil,
          });
        }
      }

      // Check for overlapping shifts
      const overlapping = await db.query.shifts.findFirst({
        where: and(
          eq(shifts.tenantId, request.user!.tenantId),
          eq(shifts.employeeId, body.employeeId),
          or(
            and(
              lt(shifts.startTime, new Date(body.endTime)),
              gt(shifts.endTime, new Date(body.startTime))
            )
          )
        ),
      });

      if (overlapping) {
        return reply.code(400).send({ error: 'Employee has overlapping shift' });
      }

      const [shift] = await db
        .insert(shifts)
        .values({
          tenantId: request.user!.tenantId,
          ...body,
          startTime: new Date(body.startTime),
          endTime: new Date(body.endTime),
        })
        .returning();

      await logAudit(
        request.user!.tenantId,
        request.user!.id,
        'create',
        'shift',
        shift.id,
        { shift: body }
      );

      return reply.code(201).send({ data: shift });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Create shift error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update shift
  fastify.patch('/shifts/:id', { preHandler: requireAuth(['manager']) }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateShiftSchema.parse(request.body);

      const existingShift = await db.query.shifts.findFirst({
        where: and(eq(shifts.id, id), eq(shifts.tenantId, request.user!.tenantId)),
        with: { schedule: true },
      });

      if (!existingShift) {
        return reply.code(404).send({ error: 'Shift not found' });
      }

      // Check publish lock
      if (existingShift.schedule.publishedUntil) {
        const publishedUntil = new Date(existingShift.schedule.publishedUntil);
        const shiftStart = new Date(body.startTime || existingShift.startTime);
        if (shiftStart <= publishedUntil) {
          return reply.code(400).send({
            error: 'Cannot modify shift in published period',
            publishedUntil: existingShift.schedule.publishedUntil,
          });
        }
      }

      // Check for overlapping shifts if time changed
      if (body.startTime || body.endTime || body.employeeId) {
        const startTime = new Date(body.startTime || existingShift.startTime);
        const endTime = new Date(body.endTime || existingShift.endTime);
        const employeeId = body.employeeId || existingShift.employeeId;

        const overlapping = await db.query.shifts.findFirst({
          where: and(
            eq(shifts.tenantId, request.user!.tenantId),
            eq(shifts.employeeId, employeeId),
            lt(shifts.startTime, endTime),
            gt(shifts.endTime, startTime),
            // Exclude current shift - SQL comparison works
            // @ts-expect-error - Drizzle type system limitation
            sql`${shifts.id} != ${id}`
          ),
        });

        if (overlapping) {
          return reply.code(400).send({ error: 'Employee has overlapping shift' });
        }
      }

      const [shift] = await db
        .update(shifts)
        .set({
          ...body,
          startTime: body.startTime ? new Date(body.startTime) : undefined,
          endTime: body.endTime ? new Date(body.endTime) : undefined,
          updatedAt: new Date(),
        })
        .where(and(eq(shifts.id, id), eq(shifts.tenantId, request.user!.tenantId)))
        .returning();

      await logAudit(
        request.user!.tenantId,
        request.user!.id,
        'update',
        'shift',
        shift.id,
        { updates: body }
      );

      return reply.send({ data: shift });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Update shift error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Delete shift
  fastify.delete('/shifts/:id', { preHandler: requireAuth(['manager']) }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const existingShift = await db.query.shifts.findFirst({
        where: and(eq(shifts.id, id), eq(shifts.tenantId, request.user!.tenantId)),
        with: { schedule: true },
      });

      if (!existingShift) {
        return reply.code(404).send({ error: 'Shift not found' });
      }

      // Check publish lock
      if (existingShift.schedule.publishedUntil) {
        const publishedUntil = new Date(existingShift.schedule.publishedUntil);
        const shiftStart = new Date(existingShift.startTime);
        if (shiftStart <= publishedUntil) {
          return reply.code(400).send({
            error: 'Cannot delete shift in published period',
            publishedUntil: existingShift.schedule.publishedUntil,
          });
        }
      }

      await db.delete(shifts).where(and(eq(shifts.id, id), eq(shifts.tenantId, request.user!.tenantId)));

      await logAudit(
        request.user!.tenantId,
        request.user!.id,
        'delete',
        'shift',
        id
      );

      return reply.send({ success: true });
    } catch (error) {
      console.error('Delete shift error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Publish schedule
  fastify.post('/schedules/:id/publish', { preHandler: requireAuth(['admin']) }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const schema = z.object({
        publishedUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      });
      const body = schema.parse(request.body);

      const [schedule] = await db
        .update(schedules)
        .set({ publishedUntil: body.publishedUntil, updatedAt: new Date() })
        .where(and(eq(schedules.id, id), eq(schedules.tenantId, request.user!.tenantId)))
        .returning();

      if (!schedule) {
        return reply.code(404).send({ error: 'Schedule not found' });
      }

      await logAudit(
        request.user!.tenantId,
        request.user!.id,
        'publish',
        'schedule',
        schedule.id,
        { publishedUntil: body.publishedUntil }
      );

      return reply.send({ data: schedule });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Publish schedule error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
