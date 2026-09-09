import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { OtpType } from '../../../domain/enums/otp-type.enum';

export const ResendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Must be a valid email address' })
    .max(255, { message: 'Email cannot exceed 255 characters' }),
  type: z
    .nativeEnum(OtpType, {
      message: 'Invalid OTP type. Allowed: EMAIL_VERIFICATION, PASSWORD_RESET',
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
