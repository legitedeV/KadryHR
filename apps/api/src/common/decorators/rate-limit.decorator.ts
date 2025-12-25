import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_METADATA = 'rate-limit-options';

export type RateLimitOptions = {
  limit: number;
  ttlMs: number;
};

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_METADATA, options);
