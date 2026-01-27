import { Injectable } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RcpRateLimitService {
  private readonly rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly MAX_ATTEMPTS = 3;
  private readonly WINDOW_SECONDS = 60;

  /**
   * Check if user is rate limited for a specific location
   * @returns true if allowed, false if rate limited
   */
  checkRateLimit(userId: string, locationId: string): boolean {
    const key = `${userId}:${locationId}`;
    const now = Math.floor(Date.now() / 1000);

    const entry = this.rateLimitMap.get(key);

    if (!entry || entry.resetAt <= now) {
      // Create new entry
      this.rateLimitMap.set(key, {
        count: 1,
        resetAt: now + this.WINDOW_SECONDS,
      });
      return true;
    }

    if (entry.count >= this.MAX_ATTEMPTS) {
      return false; // Rate limited
    }

    // Increment counter
    entry.count++;
    this.rateLimitMap.set(key, entry);
    return true;
  }

  /**
   * Clean up expired entries periodically
   */
  cleanup(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (entry.resetAt <= now) {
        this.rateLimitMap.delete(key);
      }
    }
  }
}
