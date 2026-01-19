import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.enableShutdownHooks();
  app.use(helmet());

  const baseOrigins = [
    'https://kadryhr.pl',
    'https://admin.kadryhr.pl',
    'https://panel.kadryhr.pl',
  ];
  const envOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = Array.from(new Set([...baseOrigins, ...envOrigins]));

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
