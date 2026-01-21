import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { employees } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../lib/audit.js';
import { eq, and, ilike, inArray, or } from 'drizzle-orm';

const createEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  positionId: z.string().uuid().optional(),
  tags: z.array(z.string().uuid()).default([]),
  status: z.enum(['active', 'inactive', 'terminated']).default('active'),
  hireDate: z.string().optional(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

export default async function employeeRoutes(fastify: FastifyInstance) {
  // List employees
  fastify.get('/employees', { preHandler: requireAuth() }, async (request, reply) => {
    try {
      const { search, status, position, tags, role } = request.query as {
        search?: string;
        status?: string;
        position?: string;
        tags?: string;
        role?: string;
      };

      let query = db.query.employees.findMany({
        where: and(
          eq(employees.tenantId, request.user!.tenantId),
          search
            ? or(
                ilike(employees.firstName, `%${search}%`),
                ilike(employees.lastName, `%${search}%`),
                ilike(employees.email, `%${search}%`)
              )
            : undefined,
          status ? eq(employees.status, status as typeof employees.status.$inferSelect) : undefined,
          position ? eq(employees.positionId, position) : undefined
        ),
        with: {
          position: true,
        },
        orderBy: (employees, { asc }) => [asc(employees.firstName)],
      });

      const results = await query;
      return reply.send({ data: results });
    } catch (error) {
      console.error('List employees error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create employee
  fastify.post('/employees', { preHandler: requireAuth(['admin']) }, async (request, reply) => {
    try {
      const body = createEmployeeSchema.parse(request.body);

      const [employee] = await db
        .insert(employees)
        .values({
          tenantId: request.user!.tenantId,
          ...body,
        })
        .returning();

      await logAudit(
        request.user!.tenantId,
        request.user!.id,
        'create',
        'employee',
        employee.id,
        { employee: body }
      );

      return reply.code(201).send({ data: employee });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Create employee error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update employee
  fastify.patch('/employees/:id', { preHandler: requireAuth(['admin']) }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateEmployeeSchema.parse(request.body);

      const [employee] = await db
        .update(employees)
        .set({ ...body, updatedAt: new Date() })
        .where(and(eq(employees.id, id), eq(employees.tenantId, request.user!.tenantId)))
        .returning();

      if (!employee) {
        return reply.code(404).send({ error: 'Employee not found' });
      }

      await logAudit(
        request.user!.tenantId,
        request.user!.id,
        'update',
        'employee',
        employee.id,
        { updates: body }
      );

      return reply.send({ data: employee });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      console.error('Update employee error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Delete employee
  fastify.delete('/employees/:id', { preHandler: requireAuth(['admin']) }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const [employee] = await db
        .delete(employees)
        .where(and(eq(employees.id, id), eq(employees.tenantId, request.user!.tenantId)))
        .returning();

      if (!employee) {
        return reply.code(404).send({ error: 'Employee not found' });
      }

      await logAudit(
        request.user!.tenantId,
        request.user!.id,
        'delete',
        'employee',
        employee.id
      );

      return reply.send({ success: true });
    } catch (error) {
      console.error('Delete employee error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
