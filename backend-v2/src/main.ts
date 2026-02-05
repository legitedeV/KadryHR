import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'crypto';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.enableShutdownHooks();
  app.set('trust proxy', 1);
  app.use(helmet());

  const baseOrigins = ['https://kadryhr.pl', 'http://localhost:3000'];
  const envOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = Array.from(new Set([...baseOrigins, ...envOrigins]));

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  const requestLogger = new Logger('RequestLogger');
  app.use((req: any, res, next) => {
    const headerRequestId = req.headers?.['x-request-id'];
    const requestId =
      (Array.isArray(headerRequestId)
        ? headerRequestId[0]
        : headerRequestId) ?? randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    res.on('finish', () => {
      if (res.statusCode < 400) return;
      const payload = JSON.stringify({
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
      });
      if (res.statusCode >= 500) {
        requestLogger.error(payload);
      } else {
        requestLogger.warn(payload);
      }
    });
    next();
  });

  app.use((req: any, _res, next) => {
    const cookieHeader = req.headers?.cookie as string | undefined;
    const parsed = cookieHeader
      ? Object.fromEntries(
          cookieHeader.split(';').map((entry) => {
            const [key, ...rest] = entry.trim().split('=');
            return [
              decodeURIComponent(key),
              decodeURIComponent(rest.join('=') ?? ''),
            ];
          }),
        )
      : {};
    req.cookies = parsed;
    next();
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.APP_PORT ? Number(process.env.APP_PORT) : 4000;
  await app.listen(port);
}

bootstrap();
