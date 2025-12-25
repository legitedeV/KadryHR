import { randomUUID } from 'crypto';

const ALLOWED_ENVS = ['production', 'staging'];

type DsnParts = {
  protocol: string;
  host: string;
  projectId: string;
  publicKey: string;
  secretKey?: string;
};

export type SentryContext = {
  request?: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
  };
};

function parseDsn(dsn: string): DsnParts | null {
  try {
    const parsed = new URL(dsn);
    const projectId = parsed.pathname.replace('/', '');
    if (!projectId) return null;

    return {
      protocol: parsed.protocol.replace(':', ''),
      host: parsed.host,
      projectId,
      publicKey: parsed.username,
      secretKey: parsed.password || undefined,
    };
  } catch (error) {
    console.error('Invalid Sentry DSN configuration', error);
    return null;
  }
}

function redactSensitiveHeaders(headers?: Record<string, string>): Record<string, string> {
  if (!headers) return {};

  const sanitized = { ...headers };

  if (sanitized.authorization) {
    sanitized.authorization = '[redacted]';
  }

  if (sanitized.cookie) {
    sanitized.cookie = '[redacted]';
  }

  return sanitized;
}

export function isSentryEnabled(): boolean {
  const nodeEnv = process.env.NODE_ENV || 'development';
  return ALLOWED_ENVS.includes(nodeEnv) && Boolean(process.env.SENTRY_DSN);
}

export async function captureException(error: unknown, context?: SentryContext): Promise<void> {
  if (!isSentryEnabled() || !process.env.SENTRY_DSN) {
    return;
  }

  const dsn = parseDsn(process.env.SENTRY_DSN);
  if (!dsn) return;

  const url = `${dsn.protocol}://${dsn.host}/api/${dsn.projectId}/store/`;
  const now = new Date();

  const event = {
    event_id: randomUUID().replace(/-/g, ''),
    timestamp: now.toISOString(),
    level: 'error',
    platform: 'node',
    environment: process.env.NODE_ENV || 'development',
    request: context?.request
      ? {
          method: context.request.method,
          url: context.request.url,
          headers: redactSensitiveHeaders(context.request.headers),
        }
      : undefined,
    message: { formatted: buildErrorMessage(error) },
  };

  const sentryAuthHeader = [
    'Sentry sentry_version=7',
    'sentry_client=kadryhr-api/1.0',
    `sentry_key=${dsn.publicKey}`,
    dsn.secretKey ? `sentry_secret=${dsn.secretKey}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': sentryAuthHeader,
      },
      body: JSON.stringify(event),
    });
  } catch (transportError) {
    console.error('Sentry transport failed', transportError);
  }
}

function buildErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
}
