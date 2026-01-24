import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { positions, tags, schedules, shifts, availability, holidays, integrations, files, employees } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../lib/audit.js';
import { eq, and, gte, lte, count } from 'drizzle-orm';
import { uploadFile, getPresignedUrl, buckets } from '../lib/storage.js';
import { nanoid } from 'nanoid';

export default async function miscRoutes(fastify: FastifyInstance) {
  // Positions
  fastify.get('/positions', { preHandler: requireAuth() }, async (request, reply) => {
    const results = await db.query.positions.findMany({
      where: eq(positions.tenantId, request.user!.tenantId),
      orderBy: (positions, { asc }) => [asc(positions.name)],
    });
    return reply.send({ data: results });
  });

  fastify.post('/positions', { preHandler: requireAuth(['admin']) }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      color: z.string().regex(/^#[0-9a-f]{6}$/i),
    });
    const body = schema.parse(request.body);
    const [position] = await db
      .insert(positions)
      .values({ tenantId: request.user!.tenantId, ...body })
      .returning();
    await logAudit(request.user!.tenantId, request.user!.id, 'create', 'position', position.id);
    return reply.code(201).send({ data: position });
  });

  // Tags
  fastify.get('/tags', { preHandler: requireAuth() }, async (request, reply) => {
    const results = await db.query.tags.findMany({
      where: eq(tags.tenantId, request.user!.tenantId),
      orderBy: (tags, { asc }) => [asc(tags.name)],
    });
    return reply.send({ data: results });
  });

  fastify.post('/tags', { preHandler: requireAuth(['admin']) }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      color: z.string().regex(/^#[0-9a-f]{6}$/i),
    });
    const body = schema.parse(request.body);
    const [tag] = await db
      .insert(tags)
      .values({ tenantId: request.user!.tenantId, ...body })
      .returning();
    await logAudit(request.user!.tenantId, request.user!.id, 'create', 'tag', tag.id);
    return reply.code(201).send({ data: tag });
  });

  // Schedules
  fastify.get('/schedules', { preHandler: requireAuth() }, async (request, reply) => {
    const results = await db.query.schedules.findMany({
      where: eq(schedules.tenantId, request.user!.tenantId),
      orderBy: (schedules, { desc }) => [desc(schedules.isDefault), desc(schedules.createdAt)],
    });
    return reply.send({ data: results });
  });

  fastify.post('/schedules', { preHandler: requireAuth(['admin']) }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      isDefault: z.boolean().default(false),
    });
    const body = schema.parse(request.body);
    const [schedule] = await db
      .insert(schedules)
      .values({ tenantId: request.user!.tenantId, ...body })
      .returning();
    await logAudit(request.user!.tenantId, request.user!.id, 'create', 'schedule', schedule.id);
    return reply.code(201).send({ data: schedule });
  });

  // Dashboard stats
  fastify.get('/dashboard/stats', { preHandler: requireAuth() }, async (request, reply) => {
    const tenantId = request.user!.tenantId;
    
    const [employeesResult] = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.tenantId, tenantId));
    
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const shiftsThisMonth = await db.query.shifts.findMany({
      where: and(
        eq(shifts.tenantId, tenantId),
        gte(shifts.startTime, firstDay),
        lte(shifts.startTime, lastDay)
      ),
    });
    
    const pendingAvailability = await db.query.availability.findMany({
      where: and(
        eq(availability.tenantId, tenantId),
        eq(availability.status, 'pending')
      ),
    });

    return reply.send({
      data: {
        employeesCount: employeesResult?.count || 0,
        shiftsThisMonth: shiftsThisMonth.length,
        pendingAvailability: pendingAvailability.length,
      },
    });
  });

  // Holidays
  fastify.get('/holidays', { preHandler: requireAuth() }, async (request, reply) => {
    const { year } = request.query as { year?: string };
    const targetYear = year || new Date().getFullYear().toString();
    
    const results = await db.query.holidays.findMany({
      where: and(
        eq(holidays.tenantId, request.user!.tenantId),
        gte(holidays.date, `${targetYear}-01-01`),
        lte(holidays.date, `${targetYear}-12-31`)
      ),
      orderBy: (holidays, { asc }) => [asc(holidays.date)],
    });
    return reply.send({ data: results });
  });

  fastify.post('/holidays', { preHandler: requireAuth(['admin']) }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      type: z.enum(['national', 'company', 'regional']),
    });
    const body = schema.parse(request.body);
    const [holiday] = await db
      .insert(holidays)
      .values({ tenantId: request.user!.tenantId, ...body })
      .returning();
    await logAudit(request.user!.tenantId, request.user!.id, 'create', 'holiday', holiday.id);
    return reply.code(201).send({ data: holiday });
  });

  fastify.delete('/holidays/:id', { preHandler: requireAuth(['admin']) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(holidays).where(and(eq(holidays.id, id), eq(holidays.tenantId, request.user!.tenantId)));
    await logAudit(request.user!.tenantId, request.user!.id, 'delete', 'holiday', id);
    return reply.send({ success: true });
  });

  // Integrations
  fastify.get('/integrations', { preHandler: requireAuth(['admin']) }, async (request, reply) => {
    const results = await db.query.integrations.findMany({
      where: eq(integrations.tenantId, request.user!.tenantId),
    });
    return reply.send({ data: results });
  });

  fastify.patch('/integrations/:id', { preHandler: requireAuth(['admin']) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      enabled: z.boolean().optional(),
      config: z.record(z.unknown()).optional(),
    });
    const body = schema.parse(request.body);
    const [integration] = await db
      .update(integrations)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(integrations.id, id), eq(integrations.tenantId, request.user!.tenantId)))
      .returning();
    await logAudit(request.user!.tenantId, request.user!.id, 'update', 'integration', id);
    return reply.send({ data: integration });
  });

  // File upload
  fastify.post('/upload/avatar', { preHandler: requireAuth() }, async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      if (!data.mimetype.startsWith('image/')) {
        return reply.code(400).send({ error: 'Invalid file type' });
      }

      const buffer = await data.toBuffer();
      const ext = data.filename.split('.').pop() || 'jpg';
      const key = `avatars/${nanoid()}.${ext}`;

      await uploadFile('avatars', key, buffer, data.mimetype);

      const [file] = await db
        .insert(files)
        .values({
          tenantId: request.user!.tenantId,
          key,
          bucket: buckets.avatars,
          mimeType: data.mimetype,
          size: buffer.length,
          uploadedBy: request.user!.id,
        })
        .returning();

      const url = await getPresignedUrl('avatars', key);
      await logAudit(request.user!.tenantId, request.user!.id, 'upload', 'file', file.id);

      return reply.send({ data: { id: file.id, url } });
    } catch (error) {
      console.error('Upload error:', error);
      return reply.code(500).send({ error: 'Upload failed' });
    }
  });

  fastify.get('/files/:id/url', { preHandler: requireAuth() }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const file = await db.query.files.findFirst({
      where: and(eq(files.id, id), eq(files.tenantId, request.user!.tenantId)),
    });
    if (!file) {
      return reply.code(404).send({ error: 'File not found' });
    }
    const bucketKey = file.bucket === buckets.avatars ? 'avatars' : 'files';
    const url = await getPresignedUrl(bucketKey, file.key);
    return reply.send({ data: { url } });
  });
}
