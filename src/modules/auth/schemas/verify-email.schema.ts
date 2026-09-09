import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const VerifyEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Must be a valid email address' })
    .max(255, { message: 'Email cannot exceed 255 characters' }),
  otp: z
    .string()
    .trim()
    .length(6, { message: 'OTP must be exactly 6 digits' })
    .regex(/^\d{6}$/, { message: 'OTP must consist of 6 numeric digits' }),
});

export const VerifyEmailResponseSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  isEmailVerified: z.boolean(),
  message: z.string(),
});

export class VerifyEmailDto extends createZodDto(VerifyEmailSchema) {}
export class VerifyEmailResponseDto extends createZodDto(
  VerifyEmailResponseSchema,
) {}

export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseSchema>;
