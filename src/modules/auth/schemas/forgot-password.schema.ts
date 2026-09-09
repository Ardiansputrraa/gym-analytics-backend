import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
});

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}

export const ForgotPasswordResponseSchema = z.object({
  message: z.string(),
});

export class ForgotPasswordResponseDto extends createZodDto(
  ForgotPasswordResponseSchema,
) {}
