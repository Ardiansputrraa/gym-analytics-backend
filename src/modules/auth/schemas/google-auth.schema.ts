import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const GoogleAuthSchema = z.object({
  idToken: z
    .string()
    .optional()
    .describe('Google OAuth ID Token / Credential from Google Identity Services'),
  credential: z
    .string()
    .optional()
    .describe('Google GSI One-Tap credential JWT string'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Format email tidak valid' })
    .optional()
    .describe('Verified Google account email address'),
  name: z
    .string()
    .trim()
    .optional()
    .describe('Full name from Google profile'),
  avatarUrl: z
    .string()
    .url({ message: 'Format URL foto profil tidak valid' })
    .optional()
    .describe('Google account avatar picture URL'),
  phone: z
    .string()
    .trim()
    .regex(/^08\d{8,11}$/, {
      message:
        'Nomor telepon harus berupa nomor seluler Indonesia yang valid diawali dengan 08 (10-13 digit)',
    })
    .optional()
    .describe('Optional phone number for contact'),
});

export class GoogleAuthDto extends createZodDto(GoogleAuthSchema) {}

export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
