export interface AppConfig {
  app: {
    port: number;
    jwt: {
      accessTokenTtl: string;
      refreshTokenTtl: string;
      secret: string;
    };
    refreshTokenSecret: string;
  };
  database: {
    url: string;
    maxRetries: number;
    retryDelayMs: number;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    enabled: boolean;
  };
  sms: {
    enabled: boolean;
    provider: string;
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  redis: {
    host: string;
    port: number;
  };
  leads: {
    defaultOrganisationId: string;
    notificationEmail: string;
    autoReplyEnabled: boolean;
    ipHashSalt: string;
  };
  newsletter: {
    defaultOrganisationId: string;
  };
}

export const configuration = (): AppConfig => ({
  app: {
    port: Number(process.env.APP_PORT ?? 3000),
    jwt: {
      secret: process.env.JWT_ACCESS_SECRET ?? 'changeme-access',
      accessTokenTtl: process.env.JWT_ACCESS_TTL ?? '15m',
      refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? '7d',
    },
    refreshTokenSecret:
      process.env.JWT_REFRESH_SECRET ?? 'changeme-refresh-secret',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
    maxRetries: Number(process.env.DATABASE_MAX_RETRIES ?? 5),
    retryDelayMs: Number(process.env.DATABASE_RETRY_DELAY_MS ?? 2000),
  },
  email: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 0),
    secure: (process.env.SMTP_SECURE ?? 'false') === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? '',
    enabled: (process.env.EMAIL_ENABLED ?? 'true') !== 'false',
  },
  sms: {
    enabled: (process.env.SMS_ENABLED ?? 'false') === 'true',
    provider: process.env.SMS_PROVIDER ?? 'console',
    accountSid: process.env.SMS_ACCOUNT_SID ?? '',
    authToken: process.env.SMS_AUTH_TOKEN ?? '',
    fromNumber: process.env.SMS_FROM_NUMBER ?? '',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
  leads: {
    defaultOrganisationId: process.env.LEADS_DEFAULT_ORGANISATION_ID ?? '',
    notificationEmail:
      process.env.LEADS_NOTIFICATION_EMAIL || 'powiadomienia@kadryhr.pl',
    autoReplyEnabled:
      (process.env.LEADS_AUTO_REPLY_ENABLED ?? 'true') !== 'false',
    ipHashSalt: process.env.LEADS_IP_HASH_SALT ?? 'kadryhr-leads',
  },
  newsletter: {
    defaultOrganisationId: process.env.NEWSLETTER_DEFAULT_ORGANISATION_ID ?? '',
  },
});
