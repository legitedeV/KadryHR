import { z } from 'zod';

export const healthCheckSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.coerce.date()
});

export type HealthCheckPayload = z.infer<typeof healthCheckSchema>;

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25)
});

export type PaginationInput = z.infer<typeof paginationSchema>;
