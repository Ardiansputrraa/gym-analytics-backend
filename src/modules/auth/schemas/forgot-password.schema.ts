import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ForgotPasswordSchema = z.object({
  email: z
    .string({ message: 'Email wajib diisi' })
    .trim()
    .toLowerCase()
    .min(1, { message: 'Email wajib diisi' })
    .email({ message: 'Format email tidak valid' }),
});

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}

export const ForgotPasswordResponseSchema = z.object({
  message: z.string(),
});

export class ForgotPasswordResponseDto extends createZodDto(
  ForgotPasswordResponseSchema,
) {}
