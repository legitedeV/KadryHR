import { db } from '../db/index.js';
import { auditLogs } from '../db/schema.js';

export async function logAudit(
  tenantId: string,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
) {
  try {
    await db.insert(auditLogs).values({
      tenantId,
      userId,
      action,
      resourceType,
      resourceId,
      details: details || {},
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}
