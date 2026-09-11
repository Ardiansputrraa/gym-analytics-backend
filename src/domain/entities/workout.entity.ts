import { WorkoutStatus, RecordType } from '../enums/workout.enums';

export interface WorkoutSetEntity {
  id: string;
  workoutExerciseId: string;
  orderIndex: number;
  weightKg: number;
  reps: number;
  durationSeconds: number;
  restSeconds: number;
  inclinePct?: number | null;
  speedKmh?: number | null;
  distanceKm?: number | null;
  caloriesBurned?: number | null;
  paceMinPerKm?: string | null;
  isCompleted: boolean;
  completedAt?: Date | null;
  rpe?: number | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutExerciseEntity {
  id: string;
  workoutId: string;
  exerciseId: string;
  exerciseName?: string;
  equipment?: string;
  equipmentName?: string;
  primaryMuscle?: string;
  primaryMuscleName?: string;
  orderIndex: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  notes?: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  sets: WorkoutSetEntity[];
}

export interface WorkoutEntity {
  id: string;
  userId: string;
  routineTemplateId?: string | null;
  routineTemplateName?: string | null;
  name: string;
  status: WorkoutStatus;
  startedAt?: Date | null;
  completedAt?: Date | null;
  notes?: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  exercises: WorkoutExerciseEntity[];
}

export interface RoutineTemplateExerciseEntity {
  id: string;
  routineTemplateId: string;
  exerciseId: string;
  exerciseName: string;
  equipment: string;
  primaryMuscle: string;
  orderIndex: number;
  targetSets: number;
  targetReps?: number | null;
  targetRestSeconds: number;
}

export interface RoutineTemplateEntity {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  isActive: boolean;
  exercises: RoutineTemplateExerciseEntity[];
}

export interface PersonalRecordEntity {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName?: string;
  workoutSetId?: string | null;
  recordType: RecordType;
  value: number;
  achievedAt: Date;
}
