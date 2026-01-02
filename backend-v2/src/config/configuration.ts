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
});
