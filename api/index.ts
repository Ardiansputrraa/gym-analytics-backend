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
let swaggerDocument: any = null;

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

  swaggerDocument = SwaggerModule.createDocument(app, config);

  await app.init();
  isAppReady = true;
}

// Custom Swagger Routes (Zero filesystem dependency, 100% Serverless-safe)
server.get(
  [
    '/api/docs-json',
    '/docs-json',
    '/api/docs/swagger.json',
    '/docs/swagger.json',
  ],
  (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerDocument);
  },
);

server.get(['/api/docs', '/api/docs/', '/docs', '/docs/'], (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Gym Analytics API Docs</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui.min.css" />
  <link rel="icon" type="image/png" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/favicon-32x32.png" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-bundle.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-standalone-preset.min.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/docs-json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
});

export default async function handler(req: any, res: any) {
  if (!isAppReady) {
    await bootstrap();
  }
  return server(req, res);
}
