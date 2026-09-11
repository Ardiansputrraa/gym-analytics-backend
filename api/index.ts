import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { AppModule } from '../src/app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { GlobalExceptionFilter } from '../src/common/errors/http-exception.filter';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const server: Express = express();
let isAppReady = false;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Gym Analytics & Body Progress API')
    .setDescription('API documentation for Gym Analytics & Body Progress Platform')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
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

  await app.init();
  isAppReady = true;
}

export default async function handler(req: any, res: any) {
  if (!isAppReady) {
    await bootstrap();
  }
  return server(req, res);
}
