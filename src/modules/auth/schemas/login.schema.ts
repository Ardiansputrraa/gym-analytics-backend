import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const LoginSchema = z.object({
  email: z
    .string({ message: 'Email wajib diisi' })
    .trim()
    .toLowerCase()
    .min(1, { message: 'Email wajib diisi' })
    .email({ message: 'Format email tidak valid' })
    .max(255, { message: 'Email tidak boleh lebih dari 255 karakter' }),
  password: z
    .string({ message: 'Kata sandi wajib diisi' })
    .min(1, { message: 'Kata sandi wajib diisi' }),
});

export const LoginUserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  isAdmin: z.boolean(),
});

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  user: LoginUserResponseSchema,
  message: z.string().default('Login berhasil.'),
});

export class LoginDto extends createZodDto(LoginSchema) {}
export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}

export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
