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
    .email({ message: 'Must be a valid email address' })
    .optional()
    .describe('Verified Google account email address'),
  name: z
    .string()
    .trim()
    .optional()
    .describe('Full name from Google profile'),
  avatarUrl: z
    .string()
    .url()
    .optional()
    .describe('Google account avatar picture URL'),
  phone: z
    .string()
    .trim()
    .regex(/^08\d{8,11}$/, {
      message:
        'Phone number must be a valid Indonesian mobile number starting with 08 (10-13 digits)',
    })
    .optional()
    .describe('Optional phone number for contact'),
});

export class GoogleAuthDto extends createZodDto(GoogleAuthSchema) {}

export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
