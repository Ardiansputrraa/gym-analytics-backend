import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const EquipmentCategoryEnum = z.enum([
  'BARBELL',
  'DUMBBELL',
  'CABLE',
  'MACHINE',
  'SMITH',
  'BODYWEIGHT',
  'TREADMILL',
  'STATIONARY_BIKE',
  'STAIR_MASTER',
  'ROWING_MACHINE',
  'ELLIPTICAL',
  'OTHER',
]);

export const ExerciseTypeEnum = z.enum([
  'STRENGTH',
  'CARDIO_TREADMILL',
  'CARDIO_GENERIC',
  'BODYWEIGHT',
]);

export const GetExercisesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  muscleGroup: z.string().trim().optional(),
  equipment: z.string().trim().optional(),
  isCustom: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
});

export class GetExercisesQueryDto extends createZodDto(GetExercisesQuerySchema) {}

export const CreateExerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama gerakan minimal 2 karakter')
    .max(255, 'Nama gerakan maksimal 255 karakter'),
  description: z.string().trim().max(1000, 'Deskripsi maksimal 1000 karakter').optional(),
  equipment: EquipmentCategoryEnum.default('DUMBBELL'),
  exerciseType: ExerciseTypeEnum.default('STRENGTH'),
  muscleGroup: z.string().trim().min(1, 'Target kelompok otot wajib dipilih'),
});

export class CreateExerciseDto extends createZodDto(CreateExerciseSchema) {}

export const UpdateExerciseSchema = z.object({
  name: z.string().trim().min(2, 'Nama gerakan minimal 2 karakter').max(255).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  equipment: EquipmentCategoryEnum.optional(),
  exerciseType: ExerciseTypeEnum.optional(),
  muscleGroup: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export class UpdateExerciseDto extends createZodDto(UpdateExerciseSchema) {}

export interface MuscleGroupResponseDto {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  orderIndex: number;
}

export interface EquipmentCategoryOptionDto {
  key: string;
  label: string;
}

export interface ExerciseResponseDto {
  id: string;
  name: string;
  description: string | null;
  equipment: string;
  equipmentName: string;
  exerciseType: string;
  primaryMuscleGroupId: string;
  primaryMuscle: string;
  primaryMuscleName: string;
  isCustom: boolean;
  isActive: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedExercisesResponseDto {
  items: ExerciseResponseDto[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
