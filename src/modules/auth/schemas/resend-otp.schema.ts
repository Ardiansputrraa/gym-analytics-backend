import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { OtpType } from '../../../domain/enums/otp-type.enum';

export const ResendOtpSchema = z.object({
  email: z
    .string({ message: 'Email wajib diisi' })
    .trim()
    .toLowerCase()
    .min(1, { message: 'Email wajib diisi' })
    .email({ message: 'Format email tidak valid' })
    .max(255, { message: 'Email tidak boleh lebih dari 255 karakter' }),
  type: z
    .nativeEnum(OtpType, {
      message:
        'Tipe OTP tidak valid. Pilihan yang diizinkan: EMAIL_VERIFICATION, PASSWORD_RESET',
    })
    .default(OtpType.EMAIL_VERIFICATION),
});

export const ResendOtpResponseSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  message: z.string(),
});

export class ResendOtpDto extends createZodDto(ResendOtpSchema) {}
export class ResendOtpResponseDto extends createZodDto(
  ResendOtpResponseSchema,
) {}

export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;
export type ResendOtpResponse = z.infer<typeof ResendOtpResponseSchema>;
