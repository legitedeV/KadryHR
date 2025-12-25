"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter());
    const apiPrefix = process.env.API_PREFIX || 'v2';
    app.setGlobalPrefix(apiPrefix);
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    });
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
    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 KadryHR API V2 is running on: http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
//# sourceMappingURL=main.js.map