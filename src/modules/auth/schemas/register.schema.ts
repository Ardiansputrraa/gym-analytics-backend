import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: 'Name is required' })
      .max(255, { message: 'Name cannot exceed 255 characters' }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email({ message: 'Must be a valid email address' })
      .max(255, { message: 'Email cannot exceed 255 characters' }),
    phone: z
      .string()
      .trim()
      .regex(/^08\d{8,11}$/, {
        message:
          'Phone number must be a valid Indonesian mobile number starting with 08 (10-13 digits)',
      })
      .optional(),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .max(100, { message: 'Password cannot exceed 100 characters' })
      .regex(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
          'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
      }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
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
