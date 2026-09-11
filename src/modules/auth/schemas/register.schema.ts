import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RegisterSchema = z
  .object({
    name: z
      .string({ message: 'Nama lengkap wajib diisi' })
      .trim()
      .min(1, { message: 'Nama lengkap wajib diisi' })
      .max(255, { message: 'Nama lengkap tidak boleh lebih dari 255 karakter' }),
    email: z
      .string({ message: 'Email wajib diisi' })
      .trim()
      .toLowerCase()
      .min(1, { message: 'Email wajib diisi' })
      .email({ message: 'Format email tidak valid' })
      .max(255, { message: 'Email tidak boleh lebih dari 255 karakter' }),
    phone: z
      .string()
      .trim()
      .regex(/^08\d{8,11}$/, {
        message:
          'Nomor telepon harus berupa nomor seluler Indonesia yang valid diawali dengan 08 (10-13 digit)',
      })
      .optional(),
    password: z
      .string({ message: 'Kata sandi wajib diisi' })
      .min(8, { message: 'Kata sandi minimal harus 8 karakter' })
      .max(100, { message: 'Kata sandi tidak boleh lebih dari 100 karakter' })
      .regex(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
          'Kata sandi harus mengandung minimal 1 huruf besar, 1 huruf kecil, dan 1 angka atau simbol',
      }),
    confirmPassword: z
      .string({ message: 'Konfirmasi kata sandi wajib diisi' })
      .min(1, { message: 'Konfirmasi kata sandi wajib diisi' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  });

export const RegisterResponseSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  isEmailVerified: z.boolean(),
  message: z.string(),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
export class RegisterResponseDto extends createZodDto(RegisterResponseSchema) {}

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
