import { ExerciseEntity } from '../../domain/entities/exercise.entity';
import { ExerciseResponseDto } from '../../modules/exercises/schemas/exercise.schema';
import { EQUIPMENT_DISPLAY_NAMES } from './get-equipments.use-case';

export function mapExerciseToResponseDto(exercise: ExerciseEntity): ExerciseResponseDto {
  const muscleGroup = exercise.primaryMuscleGroup;
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    equipment: exercise.equipment,
    equipmentName: EQUIPMENT_DISPLAY_NAMES[exercise.equipment] || exercise.equipment,
    exerciseType: exercise.exerciseType,
    primaryMuscleGroupId: exercise.primaryMuscleGroupId,
    primaryMuscle: muscleGroup?.name || 'OTHER',
    primaryMuscleName: muscleGroup?.displayName || 'Lainnya',
    isCustom: exercise.isCustom,
    isActive: exercise.isActive,
    userId: exercise.userId,
    createdAt: exercise.createdAt.toISOString(),
    updatedAt: exercise.updatedAt.toISOString(),
  };
}
