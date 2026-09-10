import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Gender } from '../../../domain/enums/gender.enum';
import { ActivityLevel } from '../../../domain/enums/activity-level.enum';
import { FitnessGoal } from '../../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../../domain/enums/diet-pace.enum';

export const UpsertProfileSchema = z.object({
  age: z
    .number({ message: 'Usia wajib diisi' })
    .int('Usia harus berupa bilangan bulat')
    .min(10, 'Usia minimal 10 tahun')
    .max(120, 'Usia maksimal 120 tahun'),
  gender: z.nativeEnum(Gender, {
    message: 'Jenis kelamin harus MALE atau FEMALE',
  }),
  heightCm: z
    .number({ message: 'Tinggi badan wajib diisi' })
    .min(50, 'Tinggi badan minimal 50 cm')
    .max(300, 'Tinggi badan maksimal 300 cm'),
  weightKg: z
    .number({ message: 'Berat badan wajib diisi' })
    .min(20, 'Berat badan minimal 20 kg')
    .max(500, 'Berat badan maksimal 500 kg'),
  activityLevel: z.nativeEnum(ActivityLevel, {
    message: 'Tingkat aktivitas wajib dipilih',
  }),
  fitnessGoal: z.nativeEnum(FitnessGoal, {
    message: 'Target kebugaran wajib dipilih',
  }),
  dietPace: z.nativeEnum(DietPace).default(DietPace.STANDARD).optional(),
  checkInIntervalDays: z.number().int().min(1).max(365).default(30).optional(),
});

export class UpsertProfileDto extends createZodDto(UpsertProfileSchema) {}

export const CheckInStatusSchema = z.object({
  needsUpdate: z.boolean(),
  daysSinceLastUpdate: z.number(),
  checkInIntervalDays: z.number(),
  message: z.string(),
});

export const ProfileResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  age: z.number(),
  gender: z.nativeEnum(Gender),
  heightCm: z.number(),
  weightKg: z.number(),
  activityLevel: z.nativeEnum(ActivityLevel),
  fitnessGoal: z.nativeEnum(FitnessGoal),
  dietPace: z.nativeEnum(DietPace),
  checkInIntervalDays: z.number(),
  checkInStatus: CheckInStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class ProfileResponseDto extends createZodDto(ProfileResponseSchema) {}
