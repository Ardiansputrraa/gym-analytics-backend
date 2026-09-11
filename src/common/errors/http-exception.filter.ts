import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';

interface HttpExceptionBody {
  message?: string | string[];
  code?: string;
  errors?: unknown[];
  error?: string;
  issues?: unknown[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ZodError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Validasi data gagal.',
        code: 'VALIDATION_ERROR',
        errors: exception.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message = exception.message;
      let code = this.statusToCode(status);
      let errors: unknown[] = [];

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const body = exceptionResponse as HttpExceptionBody;

        if (Array.isArray(body.issues)) {
          // ZodValidationException from nestjs-zod
          message = 'Validasi data gagal.';
          code = 'VALIDATION_ERROR';
          errors = body.issues;
        } else if (Array.isArray(body.errors)) {
          errors = body.errors;
          code = body.code ?? this.statusToCode(status);
          message = typeof body.message === 'string' ? body.message : message;
        } else if (Array.isArray(body.message)) {
          message = 'Validasi data gagal.';
          code = body.code ?? 'VALIDATION_ERROR';
          errors = body.message;
        } else if (typeof body.message === 'string') {
          message = body.message;
          code = body.code ?? this.statusToCode(status);
          errors = body.errors ?? [];
        }
      }

      response.status(status).json({
        success: false,
        message,
        code,
        errors,
      });
    } else {
      this.logger.error('Unhandled exception:', exception);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Terjadi kesalahan internal pada server.',
        code: 'INTERNAL_ERROR',
        errors: [],
      });
    }
  }

  private statusToCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
    };
    return codes[status] ?? 'UNKNOWN_ERROR';
  }
}
