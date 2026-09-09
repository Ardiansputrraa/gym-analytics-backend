import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Gender } from '../../../domain/enums/gender.enum';
import { ActivityLevel } from '../../../domain/enums/activity-level.enum';
import { FitnessGoal } from '../../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../../domain/enums/diet-pace.enum';

export const UpsertProfileSchema = z.object({
  age: z
    .number({ message: 'Age is required' })
    .int('Age must be an integer')
    .min(10, 'Age must be at least 10 years')
    .max(120, 'Age must not exceed 120 years'),
  gender: z.nativeEnum(Gender, {
    message: 'Gender must be MALE or FEMALE',
  }),
  heightCm: z
    .number({ message: 'Height is required' })
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Height must not exceed 300 cm'),
  weightKg: z
    .number({ message: 'Weight is required' })
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight must not exceed 500 kg'),
  activityLevel: z.nativeEnum(ActivityLevel, {
    message: 'Activity level is required',
  }),
  fitnessGoal: z.nativeEnum(FitnessGoal, {
    message: 'Fitness goal is required',
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
