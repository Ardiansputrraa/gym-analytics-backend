import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ResetPasswordSchema = z.object({
  email: z
    .string({ message: 'Email wajib diisi' })
    .trim()
    .toLowerCase()
    .min(1, { message: 'Email wajib diisi' })
    .email({ message: 'Format email tidak valid' }),
  otp: z
    .string({ message: 'Kode OTP wajib diisi' })
    .trim()
    .length(6, { message: 'Kode OTP harus tepat 6 digit' })
    .regex(/^\d{6}$/, { message: 'Kode OTP harus berupa 6 digit angka' }),
  newPassword: z
    .string({ message: 'Kata sandi baru wajib diisi' })
    .min(8, { message: 'Kata sandi minimal harus 8 karakter' })
    .max(128, { message: 'Kata sandi tidak boleh lebih dari 128 karakter' })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      { message: 'Kata sandi harus mengandung minimal 1 huruf besar, 1 huruf kecil, dan 1 angka' },
    ),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}

export const ResetPasswordResponseSchema = z.object({
  message: z.string(),
});

export class ResetPasswordResponseDto extends createZodDto(
  ResetPasswordResponseSchema,
) {}
