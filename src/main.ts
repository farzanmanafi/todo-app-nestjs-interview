import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { RateLimitMiddleware } from '@common/middleware/rate-limit.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', true);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Set global prefix BEFORE Swagger setup so documentation reflects the prefix
  app.setGlobalPrefix(apiPrefix);

  // CORS configuration
  const corsEnabled = configService.get<boolean>('CORS_ENABLED', true);
  if (corsEnabled) {
    const corsOrigins = configService
      .get<string>('CORS_ORIGIN', '*')
      .split(',');
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
    });
    logger.log(`CORS enabled for origins: ${corsOrigins.join(', ')}`);
  }

  // Rate limiting middleware
  app.use(
    new RateLimitMiddleware(configService).use.bind(
      new RateLimitMiddleware(configService),
    ),
  );

  // Global validation pipe
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

  // Swagger documentation
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get<string>('SWAGGER_TITLE', 'Scalable Todo API'))
      .setDescription(
        configService.get<string>(
          'SWAGGER_DESCRIPTION',
          'A scalable Todo List API with NestJS, Redis, Bull Queue, and JWT Authentication',
        ),
      )
      .setVersion(configService.get<string>('SWAGGER_VERSION', '1.0'))
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter your JWT token',
          in: 'header',
        },
        'JWT-auth', // This is the name used in @ApiBearerAuth()
      )
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management')
      .addTag('Categories', 'Category management')
      .addTag('Todos', 'Todo management')
      .addTag('Notifications', 'Notification management')
      .build();

    // The document is created *after* the global prefix is set
    const document = SwaggerModule.createDocument(app, swaggerConfig);

    // Setup Swagger at a specific path (not affected by global prefix)
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Scalable Todo API Documentation',
      customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    });

    logger.log(
      `📚 Swagger documentation available at: http://localhost:${port}/api-docs`,
    );
  }

  await app.listen(port);

  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  logger.log(`🌍 Environment: ${nodeEnv}`);

  if (swaggerEnabled) {
    logger.log(`📖 API Documentation: http://localhost:${port}/api-docs`);
  }
}

bootstrap();
