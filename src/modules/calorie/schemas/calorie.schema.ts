import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Gender } from '../../../domain/enums/gender.enum';
import { ActivityLevel } from '../../../domain/enums/activity-level.enum';
import { FitnessGoal } from '../../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../../domain/enums/diet-pace.enum';

export const CalculateCaloriePreviewSchema = z.object({
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
});

export class CalculateCaloriePreviewDto extends createZodDto(
  CalculateCaloriePreviewSchema,
) {}

export const DailyCalorieTargetResponseSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  date: z.string(),
  bmr: z.number(),
  activityFactor: z.number(),
  tdee: z.number(),
  fitnessGoal: z.nativeEnum(FitnessGoal),
  dietPace: z.nativeEnum(DietPace),
  goalAdjustment: z.number(),
  targetCalories: z.number(),
  proteinGrams: z.number().nullable(),
  carbsGrams: z.number().nullable(),
  fatGrams: z.number().nullable(),
});

export class DailyCalorieTargetResponseDto extends createZodDto(
  DailyCalorieTargetResponseSchema,
) {}
