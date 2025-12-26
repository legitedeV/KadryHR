"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const core_2 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const sentry_exception_filter_1 = require("./common/filters/sentry-exception.filter");
const sentry_lite_1 = require("./common/observability/sentry-lite");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter());
    const apiPrefix = process.env.API_PREFIX || 'v2';
    app.setGlobalPrefix(apiPrefix);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: true,
    }));
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    });
    await registerSecurityHeaders(app);
    if ((0, sentry_lite_1.isSentryEnabled)()) {
        const httpAdapter = app.get(core_2.HttpAdapterHost);
        app.useGlobalFilters(new sentry_exception_filter_1.SentryExceptionFilter(httpAdapter));
    }
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv === 'development' || nodeEnv === 'staging') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('KadryHR API V2')
            .setDescription('Modern HR Management System API')
            .setVersion('2.0.0')
            .addTag('health', 'Health check endpoints')
            .addTag('version', 'Version information')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('docs', app, document, {
            customSiteTitle: 'KadryHR API V2 Documentation',
            customfavIcon: 'https://nestjs.com/img/logo-small.svg',
            customCss: '.swagger-ui .topbar { display: none }',
        });
        console.log(`📚 Swagger documentation available at: http://localhost:${process.env.PORT || 3001}/docs`);
    }
    const port = Number(process.env.PORT) || 3002;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 KadryHR API V2 is running on: http://localhost:${port}/${apiPrefix}`);
}
async function registerSecurityHeaders(app) {
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
//# sourceMappingURL=main.js.map