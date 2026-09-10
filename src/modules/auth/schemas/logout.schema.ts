import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const LogoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export const LogoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export class LogoutDto extends createZodDto(LogoutSchema) {}
export class LogoutResponseDto extends createZodDto(LogoutResponseSchema) {}

export type LogoutInput = z.infer<typeof LogoutSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
