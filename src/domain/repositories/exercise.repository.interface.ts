import { ExerciseEntity } from '../entities/exercise.entity';
import { MuscleGroupEntity } from '../entities/muscle-group.entity';
import { EquipmentCategory, ExerciseType } from '../enums/exercise.enums';

export interface FindExercisesFilter {
  userId?: string;
  search?: string;
  muscleGroupName?: string;
  muscleGroupId?: string;
  equipment?: EquipmentCategory;
  isCustom?: boolean;
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface CreateExerciseData {
  userId?: string | null;
  name: string;
  description?: string | null;
  equipment: EquipmentCategory;
  exerciseType?: ExerciseType;
  primaryMuscleGroupId: string;
  isCustom?: boolean;
}

export interface UpdateExerciseData {
  name?: string;
  description?: string | null;
  equipment?: EquipmentCategory;
  exerciseType?: ExerciseType;
  primaryMuscleGroupId?: string;
  isActive?: boolean;
}

export const EXERCISE_REPOSITORY = Symbol('IExerciseRepository');

export interface IExerciseRepository {
  findAllPaginated(filter: FindExercisesFilter): Promise<PaginatedResult<ExerciseEntity>>;
  findById(id: string): Promise<ExerciseEntity | null>;
  findByNameAndUser(name: string, userId?: string | null): Promise<ExerciseEntity | null>;
  create(data: CreateExerciseData): Promise<ExerciseEntity>;
  update(id: string, data: UpdateExerciseData): Promise<ExerciseEntity>;
  softDelete(id: string): Promise<ExerciseEntity>;
  getMuscleGroups(): Promise<MuscleGroupEntity[]>;
  findMuscleGroupById(id: string): Promise<MuscleGroupEntity | null>;
  findMuscleGroupByName(name: string): Promise<MuscleGroupEntity | null>;
}
