import { EquipmentCategory, ExerciseType } from '../enums/exercise.enums';
import { MuscleGroupEntity } from './muscle-group.entity';

export class ExerciseEntity {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  equipment: EquipmentCategory;
  exerciseType: ExerciseType;
  primaryMuscleGroupId: string;
  isCustom: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Joined / computed details
  primaryMuscleGroup?: MuscleGroupEntity;

  constructor(partial: Partial<ExerciseEntity>) {
    Object.assign(this, partial);
  }
}
