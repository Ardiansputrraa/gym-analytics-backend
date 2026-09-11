import 'reflect-metadata';
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
let bootstrapPromise: Promise<void> | null = null;

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
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    html {
      box-sizing: border-box;
      overflow-y: scroll;
      background: #090d16;
      color-scheme: dark;
    }
    *, *:before, *:after { box-sizing: inherit; }
    
    body {
      margin: 0;
      background: #090d16;
      color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    .swagger-ui {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #cbd5e1;
    }

    .swagger-ui .topbar {
      display: none;
    }

    /* Headings & Header Card */
    .swagger-ui .info {
      margin: 32px 0 24px 0;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%);
      border: 1px solid rgba(51, 65, 85, 0.7);
      border-radius: 16px;
      padding: 28px 32px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .swagger-ui .info .title {
      color: #f8fafc;
      font-weight: 700;
      font-size: 32px;
      letter-spacing: -0.5px;
    }
    .swagger-ui .info .title small.version-stamp {
      background: #3b82f6;
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 12px;
    }
    .swagger-ui .info p, .swagger-ui .info li {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
    }
    .swagger-ui .info a {
      color: #60a5fa;
      text-decoration: none;
    }

    /* Tag & Section Headers */
    .swagger-ui .opblock-tag {
      color: #f1f5f9 !important;
      font-size: 20px;
      font-weight: 700;
      border-bottom: 1px solid #1e293b;
      padding: 14px 0;
    }
    .swagger-ui .opblock-tag small {
      color: #64748b;
    }

    /* Operation Block Cards */
    .swagger-ui .opblock {
      border-radius: 12px;
      margin-bottom: 14px;
      border: 1px solid rgba(51, 65, 85, 0.6);
      background: #0f172a !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
    }
    .swagger-ui .opblock:hover {
      border-color: rgba(99, 102, 241, 0.6);
      box-shadow: 0 8px 16px -2px rgba(0, 0, 0, 0.4);
    }

    .swagger-ui .opblock .opblock-summary {
      padding: 12px 16px;
    }
    .swagger-ui .opblock .opblock-summary-path,
    .swagger-ui .opblock .opblock-summary-path__deprecated {
      color: #e2e8f0 !important;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 600;
    }
    .swagger-ui .opblock .opblock-summary-description {
      color: #94a3b8;
      font-size: 13px;
    }

    /* Method Badges */
    .swagger-ui .opblock.opblock-post { border-left: 4px solid #10b981; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #10b981; color: #ffffff; border-radius: 6px; font-weight: 700; }

    .swagger-ui .opblock.opblock-get { border-left: 4px solid #3b82f6; }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #3b82f6; color: #ffffff; border-radius: 6px; font-weight: 700; }

    .swagger-ui .opblock.opblock-put { border-left: 4px solid #f59e0b; }
    .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #f59e0b; color: #ffffff; border-radius: 6px; font-weight: 700; }

    .swagger-ui .opblock.opblock-patch { border-left: 4px solid #06b6d4; }
    .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #06b6d4; color: #ffffff; border-radius: 6px; font-weight: 700; }

    .swagger-ui .opblock.opblock-delete { border-left: 4px solid #ef4444; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #ef4444; color: #ffffff; border-radius: 6px; font-weight: 700; }

    /* Expanded Body */
    .swagger-ui .opblock-body {
      background: #090d16 !important;
      border-top: 1px solid #1e293b;
      padding: 20px;
    }
    .swagger-ui .opblock-section-header {
      background: #131c2e;
      border-radius: 8px;
      padding: 8px 14px;
      box-shadow: none;
    }
    .swagger-ui .opblock-section-header h4 {
      color: #cbd5e1;
    }
    .swagger-ui .tab li button.tablinks {
      color: #94a3b8;
    }
    .swagger-ui .tab li button.tablinks.active {
      color: #f8fafc;
      font-weight: 700;
    }

    /* Parameters & Tables */
    .swagger-ui table thead tr th, .swagger-ui table thead tr td {
      color: #94a3b8;
      border-bottom: 1px solid #334155;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .swagger-ui table tbody tr td {
      color: #e2e8f0;
      border-bottom: 1px solid #1e293b;
    }
    .swagger-ui .parameter__name {
      color: #f1f5f9;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }
    .swagger-ui .parameter__type {
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Forms, Inputs, Textareas, Selects */
    .swagger-ui input[type=text],
    .swagger-ui input[type=password],
    .swagger-ui input[type=email],
    .swagger-ui select,
    .swagger-ui textarea {
      background: #1e293b !important;
      border: 1px solid #334155 !important;
      color: #f8fafc !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
    }
    .swagger-ui input[type=text]:focus,
    .swagger-ui textarea:focus,
    .swagger-ui select:focus {
      border-color: #3b82f6 !important;
      outline: none !important;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
    }

    /* Buttons */
    .swagger-ui .btn {
      border-radius: 8px;
      font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: all 0.2s ease;
      box-shadow: none;
    }
    .swagger-ui .btn.authorize {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      border: none;
      padding: 8px 20px;
    }
    .swagger-ui .btn.authorize svg {
      fill: #ffffff;
    }
    .swagger-ui .btn.try-out__btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #cbd5e1;
    }
    .swagger-ui .btn.try-out__btn:hover {
      background: #334155;
      color: #f8fafc;
    }
    .swagger-ui .btn.execute {
      background: #3b82f6;
      border: none;
      color: #ffffff;
      font-weight: 700;
    }
    .swagger-ui .btn.execute:hover {
      background: #2563eb;
    }
    .swagger-ui .btn.cancel {
      background: #ef4444;
      border: none;
      color: #ffffff;
    }

    /* Responses & Code Blocks */
    .swagger-ui .highlight-code,
    .swagger-ui .microlight,
    .swagger-ui pre {
      background: #020617 !important;
      border: 1px solid #1e293b;
      border-radius: 8px;
      color: #38bdf8 !important;
      font-family: 'JetBrains Mono', monospace;
    }
    .swagger-ui .response-col_status {
      color: #f1f5f9;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
    }
    .swagger-ui .response-col_description {
      color: #94a3b8;
    }

    /* Models & Schemas */
    .swagger-ui section.models {
      border: 1px solid #1e293b;
      border-radius: 12px;
      background: #0f172a;
      margin-top: 40px;
    }
    .swagger-ui section.models h4 {
      color: #f1f5f9;
      border-bottom: 1px solid #1e293b;
    }
    .swagger-ui .model-box {
      background: #0b1120;
      border-radius: 8px;
      padding: 12px;
    }
    .swagger-ui .model, .swagger-ui .model-title {
      color: #cbd5e1;
      font-family: 'JetBrains Mono', monospace;
    }
    .swagger-ui .prop-type {
      color: #38bdf8;
    }
    .swagger-ui .prop-format {
      color: #94a3b8;
    }

    /* Modal / Auth Dialog */
    .swagger-ui .dialog-ux .modal-ux {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .swagger-ui .dialog-ux .modal-ux-header {
      border-bottom: 1px solid #1e293b;
    }
    .swagger-ui .dialog-ux .modal-ux-header h3 {
      color: #f8fafc;
    }
    .swagger-ui .dialog-ux .modal-ux-content {
      color: #cbd5e1;
    }
    .swagger-ui .dialog-ux .modal-ux-content h4 {
      color: #e2e8f0;
    }
    .swagger-ui .auth-container {
      border-bottom: 1px solid #1e293b;
    }
    .swagger-ui svg.close {
      fill: #94a3b8;
    }
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
    if (!bootstrapPromise) {
      bootstrapPromise = bootstrap();
    }
    try {
      await bootstrapPromise;
    } catch (err: any) {
      bootstrapPromise = null;
      console.error('NestJS Bootstrap Error:', err);
      return res.status(500).json({
        success: false,
        error: 'Bootstrap Error',
        message: err?.message || String(err),
        stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
      });
    }
  }
  return server(req, res);
}
