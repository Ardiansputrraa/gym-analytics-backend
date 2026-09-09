import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/errors/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Gym Analytics & Body Progress API')
    .setDescription(
      'API documentation for Gym Analytics & Body Progress Platform. Covers Authentication, Workout Tracking, Body Metrics, Nutrition, Calorie Analytics, and Insight Engine.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT Bearer token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Gym Analytics API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);

  logger.log(`Gym Analytics API server running on http://localhost:${port}/api/v1`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();
