import {
  CanActivate,
  ExecutionContext,
  Injectable,
  TooManyRequestsException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { RATE_LIMIT_METADATA, RateLimitOptions } from '../decorators/rate-limit.decorator';

type HitRecord = {
  count: number;
  expiresAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, HitRecord>();
  private readonly defaultLimit = 10;
  private readonly defaultTtlMs = 60_000;

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const { limit, ttlMs } = this.getLimitForContext(context);
    const key = this.buildKey(request, ttlMs);

    const record = this.hits.get(key);
    const now = Date.now();

    if (!record || record.expiresAt <= now) {
      this.hits.set(key, { count: 1, expiresAt: now + ttlMs });
      return true;
    }

    if (record.count >= limit) {
      const retryAfterSeconds = Math.ceil((record.expiresAt - now) / 1000);
      throw new TooManyRequestsException({
        message: 'Too many requests. Please try again soon.',
        retryAfterSeconds,
      });
    }

    record.count += 1;
    this.hits.set(key, record);
    return true;
  }

  private getLimitForContext(context: ExecutionContext): RateLimitOptions {
    const handlerOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (handlerOptions) return handlerOptions;

    return {
      limit: this.defaultLimit,
      ttlMs: this.defaultTtlMs,
    };
  }

  private buildKey(request: FastifyRequest, ttlMs: number): string {
    const ip = request?.ip || 'unknown';
    const path = request?.routerPath || request?.url || 'unknown';
    return `${ip}:${path}:${Math.floor(Date.now() / ttlMs)}`;
  }
}
