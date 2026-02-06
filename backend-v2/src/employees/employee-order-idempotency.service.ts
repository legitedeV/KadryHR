import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import type { AppConfig } from '../config/configuration';

interface InMemoryEntry {
  hash: string;
  expiresAt: number;
}

@Injectable()
export class EmployeeOrderIdempotencyService {
  private readonly logger = new Logger(EmployeeOrderIdempotencyService.name);
  private readonly ttlSeconds = 120;
  private readonly cache = new Map<string, InMemoryEntry>();
  private readonly redisEnabled: boolean;
  private redisClient?: Redis;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    this.redisEnabled = this.configService.get('redis.enabled', {
      infer: true,
    });

    if (this.redisEnabled) {
      this.redisClient = new Redis({
        host: this.configService.get('redis.host', { infer: true }),
        port: this.configService.get('redis.port', { infer: true }),
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });

      this.redisClient.on('error', (error) => {
        this.logger.warn(
          `Redis idempotency unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      });
    }
  }

  hashPayload(payload: unknown): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  async checkOrSet(
    organisationId: string,
    idempotencyKey: string,
    payloadHash: string,
  ): Promise<'allowed' | 'duplicate' | 'conflict'> {
    const key = `org:${organisationId}:employee-order:${idempotencyKey}`;

    if (this.redisClient) {
      try {
        const setResult = await this.redisClient.set(
          key,
          payloadHash,
          'EX',
          this.ttlSeconds,
          'NX',
        );

        if (setResult === 'OK') {
          return 'allowed';
        }

        const existing = await this.redisClient.get(key);
        if (!existing) {
          return 'allowed';
        }

        return existing === payloadHash ? 'duplicate' : 'conflict';
      } catch (error) {
        this.logger.warn(
          `Redis idempotency fallback to memory: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }

    // Best-effort in-memory fallback (non-shared, resets on process restart).
    return this.checkOrSetInMemory(key, payloadHash);
  }

  private checkOrSetInMemory(
    cacheKey: string,
    payloadHash: string,
  ): 'allowed' | 'duplicate' | 'conflict' {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }

    const existing = this.cache.get(cacheKey);
    if (existing) {
      return existing.hash === payloadHash ? 'duplicate' : 'conflict';
    }

    this.cache.set(cacheKey, {
      hash: payloadHash,
      expiresAt: now + this.ttlSeconds * 1000,
    });

    return 'allowed';
  }
}
