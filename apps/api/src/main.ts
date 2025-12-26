import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { isSentryEnabled } from './common/observability/sentry-lite';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const apiPrefix = process.env.API_PREFIX || 'v2';
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  await registerSecurityHeaders(app);

  if (isSentryEnabled()) {
    const httpAdapter = app.get(HttpAdapterHost);
    app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));
  }

  // Swagger/OpenAPI - only in dev/staging
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'development' || nodeEnv === 'staging') {
    const config = new DocumentBuilder()
      .setTitle('KadryHR API V2')
      .setDescription('Modern HR Management System API')
      .setVersion('2.0.0')
      .addTag('health', 'Health check endpoints')
      .addTag('version', 'Version information')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'KadryHR API V2 Documentation',
      customfavIcon: 'https://nestjs.com/img/logo-small.svg',
      customCss: '.swagger-ui .topbar { display: none }',
    });

    console.log(
      `📚 Swagger documentation available at: http://localhost:${process.env.PORT || 3001}/docs`,
    );
  }

  const port = Number(process.env.PORT) || 3002;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 KadryHR API V2 is running on: http://localhost:${port}/${apiPrefix}`);
}

async function registerSecurityHeaders(app: NestFastifyApplication) {
  const fastify = app.getHttpAdapter().getInstance();
  const isProdLike = (process.env.NODE_ENV || 'development') !== 'development';

  fastify.addHook('onSend', async (_request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'SAMEORIGIN');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Cross-Origin-Opener-Policy', 'same-origin');
    reply.header('Cross-Origin-Resource-Policy', 'cross-origin');

    if (isProdLike) {
      reply.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }

    return payload;
  });
}

bootstrap();
