import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const StartWorkoutSchema = z.object({
  name: z.string().trim().min(2, 'Nama sesi minimal 2 karakter').max(255).optional(),
  routineTemplateId: z.string().uuid().optional().nullable(),
});

export class StartWorkoutDto extends createZodDto(StartWorkoutSchema) {}

export const AddWorkoutExerciseSchema = z.object({
  exerciseId: z.string().uuid('ID gerakan harus berupa format UUID yang valid'),
});

export class AddWorkoutExerciseDto extends createZodDto(AddWorkoutExerciseSchema) {}

export const CreateWorkoutSetSchema = z.object({
  workoutExerciseId: z.string().uuid(),
  orderIndex: z.coerce.number().int().min(1).default(1),
  weightKg: z.coerce.number().min(0, 'Beban tidak boleh negatif').default(0),
  reps: z.coerce.number().int().min(0, 'Repetisi tidak boleh negatif').default(0),
  durationSeconds: z.coerce.number().int().min(0).default(0),
  restSeconds: z.coerce.number().int().min(0).default(90),
  inclinePct: z.coerce.number().min(0).max(100).optional().nullable(),
  speedKmh: z.coerce.number().min(0).max(50).optional().nullable(),
  distanceKm: z.coerce.number().min(0).optional().nullable(),
  caloriesBurned: z.coerce.number().int().min(0).optional().nullable(),
  isCompleted: z.boolean().default(false),
});

export class CreateWorkoutSetDto extends createZodDto(CreateWorkoutSetSchema) {}

export const UpdateWorkoutSetSchema = z.object({
  weightKg: z.coerce.number().min(0, 'Beban tidak boleh negatif').optional(),
  reps: z.coerce.number().int().min(0, 'Repetisi tidak boleh negatif').optional(),
  durationSeconds: z.coerce.number().int().min(0).optional(),
  restSeconds: z.coerce.number().int().min(0).optional(),
  inclinePct: z.coerce.number().min(0).max(100).optional().nullable(),
  speedKmh: z.coerce.number().min(0).max(50).optional().nullable(),
  distanceKm: z.coerce.number().min(0).optional().nullable(),
  caloriesBurned: z.coerce.number().int().min(0).optional().nullable(),
  isCompleted: z.boolean().optional(),
  rpe: z.coerce.number().min(1).max(10).optional().nullable(),
});

export class UpdateWorkoutSetDto extends createZodDto(UpdateWorkoutSetSchema) {}

export const UpdateWorkoutNameSchema = z.object({
  name: z.string().trim().min(2, 'Nama sesi minimal 2 karakter').max(255),
});

export class UpdateWorkoutNameDto extends createZodDto(UpdateWorkoutNameSchema) {}

export const GetWorkoutHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export class GetWorkoutHistoryQueryDto extends createZodDto(GetWorkoutHistoryQuerySchema) {}

export const GetWorkoutAnalyticsQuerySchema = z.object({
  timeframe: z.enum(['TODAY', '7_DAYS', 'MONTH', 'YEAR']).default('7_DAYS'),
});

export class GetWorkoutAnalyticsQueryDto extends createZodDto(GetWorkoutAnalyticsQuerySchema) {}
