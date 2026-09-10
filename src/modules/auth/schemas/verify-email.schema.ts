import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const VerifyEmailSchema = z.object({
  email: z
    .string({ message: 'Email wajib diisi' })
    .trim()
    .toLowerCase()
    .min(1, { message: 'Email wajib diisi' })
    .email({ message: 'Format email tidak valid' })
    .max(255, { message: 'Email tidak boleh lebih dari 255 karakter' }),
  otp: z
    .string({ message: 'Kode OTP wajib diisi' })
    .trim()
    .length(6, { message: 'Kode OTP harus tepat 6 digit' })
    .regex(/^\d{6}$/, { message: 'Kode OTP harus berupa 6 digit angka' }),
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
