import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ResetPasswordSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}

export const ResetPasswordResponseSchema = z.object({
  message: z.string(),
});

export class ResetPasswordResponseDto extends createZodDto(
  ResetPasswordResponseSchema,
) {}
