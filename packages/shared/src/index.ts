import { z } from 'zod';

// V1 Schemas (Legacy)
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

// V2 Schemas
export const v2HealthCheckSchema = z.object({
  status: z.string(),
  timestamp: z.coerce.date(),
  service: z.string(),
  version: z.string()
});

export type V2HealthCheck = z.infer<typeof v2HealthCheckSchema>;

export const v2VersionSchema = z.object({
  version: z.string(),
  apiVersion: z.string(),
  name: z.string(),
  description: z.string(),
  environment: z.string(),
  nodeVersion: z.string(),
  buildDate: z.coerce.date()
});

export type V2Version = z.infer<typeof v2VersionSchema>;

// Common V2 Response Schema
export const v2ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    timestamp: z.coerce.date()
  });

export type V2ApiResponse<T> = {
  success: boolean;
  data: T;
  timestamp: Date;
};
