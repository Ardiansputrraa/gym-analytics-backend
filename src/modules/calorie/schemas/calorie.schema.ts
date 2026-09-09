import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Gender } from '../../../domain/enums/gender.enum';
import { ActivityLevel } from '../../../domain/enums/activity-level.enum';
import { FitnessGoal } from '../../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../../domain/enums/diet-pace.enum';

export const CalculateCaloriePreviewSchema = z.object({
  age: z.number().int().min(10).max(120),
  gender: z.nativeEnum(Gender),
  heightCm: z.number().min(50).max(300),
  weightKg: z.number().min(20).max(500),
  activityLevel: z.nativeEnum(ActivityLevel),
  fitnessGoal: z.nativeEnum(FitnessGoal),
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
