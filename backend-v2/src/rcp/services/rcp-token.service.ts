import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface RcpTokenPayload {
  orgId: string;
  locationId: string;
  iat: number;
  exp: number;
  nonce: string;
}

export type RcpTokenValidationError = 'rcp_token_invalid' | 'rcp_token_expired';

@Injectable()
export class RcpTokenService {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    // Use JWT_ACCESS_SECRET or fallback to a dedicated RCP secret
    this.secret =
      this.configService.get<string>('RCP_TOKEN_SECRET') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'rcp-secret-changeme';
  }

  /**
   * Generate a signed token for RCP QR code
   */
  generateToken(
    organisationId: string,
    locationId: string,
    ttlSeconds: number = 3600,
  ): { token: string; expiresAt: Date } {
    const now = Math.floor(Date.now() / 1000);
    const payload: RcpTokenPayload = {
      orgId: organisationId,
      locationId: locationId,
      iat: now,
      exp: now + ttlSeconds,
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    const payloadStr = JSON.stringify(payload);
    const signature = this.createSignature(payloadStr);
    const token =
      Buffer.from(payloadStr).toString('base64url') + '.' + signature;

    return {
      token,
      expiresAt: new Date((now + ttlSeconds) * 1000),
    };
  }

  /**
   * Verify and decode a token
   */
  verifyToken(token: string): RcpTokenPayload | null {
    try {
      const [payloadBase64, signature] = token.split('.');
      if (!payloadBase64 || !signature) {
        return null;
      }

      const payloadStr = Buffer.from(payloadBase64, 'base64url').toString(
        'utf8',
      );
      const expectedSignature = this.createSignature(payloadStr);

      // Constant-time comparison to prevent timing attacks
      if (!this.secureCompare(signature, expectedSignature)) {
        return null;
      }

      const payload = JSON.parse(payloadStr) as RcpTokenPayload;

      // Verify expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  verifyTokenDetailed(
    token: string,
  ): { payload?: RcpTokenPayload; error?: RcpTokenValidationError } {
    try {
      const [payloadBase64, signature] = token.split('.');
      if (!payloadBase64 || !signature) {
        return { error: 'rcp_token_invalid' };
      }

      const payloadStr = Buffer.from(payloadBase64, 'base64url').toString(
        'utf8',
      );
      const expectedSignature = this.createSignature(payloadStr);

      if (!this.secureCompare(signature, expectedSignature)) {
        return { error: 'rcp_token_invalid' };
      }

      const payload = JSON.parse(payloadStr) as RcpTokenPayload;

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return { error: 'rcp_token_expired' };
      }

      return { payload };
    } catch (error) {
      return { error: 'rcp_token_invalid' };
    }
  }

  /**
   * Create hash of token for storage (we only store hashes, not raw tokens)
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private createSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('base64url');
  }

  private secureCompare(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a, 'utf8');
    const bBuffer = Buffer.from(b, 'utf8');

    if (aBuffer.length !== bBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(aBuffer, bBuffer);
  }
}
