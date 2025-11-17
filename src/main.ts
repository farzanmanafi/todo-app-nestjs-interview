import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { RateLimitMiddleware } from '@common/middleware/rate-limit.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get configuration service
  const configService = app.get(ConfigService);

  // CONFIGURATION VALUES
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', true);
  const corsEnabled = configService.get<boolean>('CORS_ENABLED', true);

  // GLOBAL PREFIX
  app.setGlobalPrefix(apiPrefix);
  logger.log(` Global API prefix set to: /${apiPrefix}`);

  // CORS CONFIGURATION
  if (corsEnabled) {
    const corsOrigins = configService
      .get<string>('CORS_ORIGIN', '*')
      .split(',')
      .map((origin) => origin.trim());

    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    logger.log(` CORS enabled for origins: ${corsOrigins.join(', ')}`);
  }

  // GLOBAL MIDDLEWARE

  const rateLimitMiddleware = new RateLimitMiddleware(configService);
  app.use(rateLimitMiddleware.use.bind(rateLimitMiddleware));
  logger.log(' Rate limiting middleware applied');

  // GLOBAL PIPES (VALIDATION)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert types
      },
      disableErrorMessages: nodeEnv === 'production', // Hide detailed errors in production
    }),
  );
  logger.log(' Global validation pipe configured');

  // SWAGGER API DOCUMENTATION
  if (swaggerEnabled) {
    setupSwagger(app, configService, port, logger);
  }

  // START APPLICATION
  await app.listen(port);

  // STARTUP LOGS
  logger.log('='.repeat(60));
  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔒 CORS: ${corsEnabled ? 'Enabled' : 'Disabled'}`);

  if (swaggerEnabled) {
    logger.log(`📖 API Documentation: http://localhost:${port}/api-docs`);
  }

  logger.log('='.repeat(60));
}

/**
 * Setup Swagger API Documentation
 */
function setupSwagger(
  app: any,
  configService: ConfigService,
  port: number,
  logger: Logger,
): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get<string>('SWAGGER_TITLE', 'Scalable Todo API'))
    .setDescription(
      configService.get<string>(
        'SWAGGER_DESCRIPTION',
        'A scalable Todo List API with NestJS, PostgreSQL, Redis, Bull Queue, and JWT Authentication',
      ),
    )
    .setVersion(configService.get<string>('SWAGGER_VERSION', '1.0.0'))
    .setContact(
      'API Support',
      'https://github.com/your-repo',
      'support@example.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token (without Bearer prefix)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Categories', 'Category management endpoints')
    .addTag('Todos', 'Todo management endpoints')
    .addTag('Notifications', 'Notification management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep auth token after page refresh
      tagsSorter: 'alpha', // Sort tags alphabetically
      operationsSorter: 'alpha', // Sort operations alphabetically
      docExpansion: 'none', // Don't expand operations by default
      filter: true, // Enable search filter
      displayRequestDuration: true, // Show request duration
    },
    customSiteTitle: 'Scalable Todo API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
    `,
  });

  logger.log(` Swagger documentation configured at /api-docs`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Application failed to start', error.stack);
  process.exit(1);
});
