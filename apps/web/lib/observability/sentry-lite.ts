const ALLOWED_ENVS = ['production', 'staging'];

type DsnParts = {
  protocol: string;
  host: string;
  projectId: string;
  publicKey: string;
  secretKey?: string;
};

type SentryEvent = {
  event_id: string;
  message: { formatted: string };
  timestamp: string;
  level: 'error';
  platform: 'javascript';
  environment: string;
  request?: {
    url?: string;
  };
};

function parseDsn(dsn?: string | null): DsnParts | null {
  if (!dsn) return null;

  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace('/', '');
    if (!projectId) return null;

    return {
      protocol: url.protocol.replace(':', ''),
      host: url.host,
      projectId,
      publicKey: url.username,
      secretKey: url.password || undefined,
    };
  } catch (error) {
    console.error('Invalid browser Sentry DSN', error);
    return null;
  }
}

function isEnabled(): boolean {
  const nodeEnv = process.env.NODE_ENV || 'development';
  return ALLOWED_ENVS.includes(nodeEnv) && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function setupBrowserSentry() {
  if (!isEnabled()) return;
  const dsn = parseDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!dsn) return;

  const endpoint = `${dsn.protocol}://${dsn.host}/api/${dsn.projectId}/store/`;

  const send = async (event: SentryEvent) => {
    const authHeader = [
      'Sentry sentry_version=7',
      'sentry_client=kadryhr-web/1.0',
      `sentry_key=${dsn.publicKey}`,
      dsn.secretKey ? `sentry_secret=${dsn.secretKey}` : null,
    ]
      .filter(Boolean)
      .join(', ');

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': authHeader,
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Browser Sentry transport failed', error);
    }
  };

  const capture = (input: unknown) => {
    const message = input instanceof Error ? `${input.name}: ${input.message}` : `${input}`;
    const event: SentryEvent = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      message: { formatted: message },
      timestamp: new Date().toISOString(),
      level: 'error',
      platform: 'javascript',
      environment: process.env.NODE_ENV || 'development',
      request: typeof window !== 'undefined' ? { url: window.location.href } : undefined,
    };

    void send(event);
  };

  window.addEventListener('error', (event) => capture(event.error || event.message));
  window.addEventListener('unhandledrejection', (event) => capture(event.reason));
}
