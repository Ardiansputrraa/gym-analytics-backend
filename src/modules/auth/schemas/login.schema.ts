import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Must be a valid email address' })
    .max(255, { message: 'Email cannot exceed 255 characters' }),
  password: z.string().min(1, { message: 'Password is required' }),
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
});

export class LoginDto extends createZodDto(LoginSchema) {}
export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}

export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
