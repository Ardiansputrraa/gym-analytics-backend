import {
  WorkoutEntity,
  WorkoutExerciseEntity,
  WorkoutSetEntity,
  RoutineTemplateEntity,
  PersonalRecordEntity,
} from '../entities/workout.entity';
import { WorkoutStatus, WorkoutTimeframe } from '../enums/workout.enums';

export interface CreateWorkoutParams {
  userId: string;
  name?: string;
  routineTemplateId?: string | null;
  startedAt?: Date;
}

export interface AddExerciseParams {
  workoutId: string;
  exerciseId: string;
  orderIndex: number;
}

export interface AddSetParams {
  workoutExerciseId: string;
  orderIndex: number;
  weightKg?: number;
  reps?: number;
  durationSeconds?: number;
  restSeconds?: number;
  inclinePct?: number | null;
  speedKmh?: number | null;
  distanceKm?: number | null;
  caloriesBurned?: number | null;
  isCompleted?: boolean;
}

export interface UpdateSetParams {
  weightKg?: number;
  reps?: number;
  durationSeconds?: number;
  restSeconds?: number;
  inclinePct?: number | null;
  speedKmh?: number | null;
  distanceKm?: number | null;
  caloriesBurned?: number | null;
  isCompleted?: boolean;
  rpe?: number | null;
}

export interface WorkoutHistoryFilter {
  userId: string;
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  status?: WorkoutStatus;
}

export interface PaginatedWorkouts {
  items: WorkoutEntity[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface WorkoutTelemetryAggregates {
  totalVolumeKg: number;
  volumeDeltaPct: number;
  totalSessions: number;
  totalSets: number;
  totalDurationMinutes: number;
  activeRatioPct: number;
  totalCardioMinutes: number;
  totalDistanceKm: number;
  totalCaloriesBurned: number;
  newPrCount: number;
  chartData: {
    date: string;
    label: string;
    volumeKg: number;
    activeMinutes: number;
    restMinutes: number;
    totalMinutes: number;
  }[];
}

export interface IWorkoutRepository {
  create(params: CreateWorkoutParams): Promise<WorkoutEntity>;
  findActiveByUserId(userId: string): Promise<WorkoutEntity | null>;
  findById(id: string): Promise<WorkoutEntity | null>;
  updateStatus(id: string, status: WorkoutStatus, completedAt?: Date): Promise<WorkoutEntity>;
  updateName(id: string, name: string): Promise<WorkoutEntity>;
  cancelExpiredActiveSessions(userId: string, todayStart: Date): Promise<number>;
  
  addExercise(params: AddExerciseParams): Promise<WorkoutExerciseEntity>;
  removeExercise(workoutId: string, exerciseId: string): Promise<boolean>;
  
  addSet(params: AddSetParams): Promise<WorkoutSetEntity>;
  updateSet(setId: string, params: UpdateSetParams): Promise<WorkoutSetEntity>;
  removeSet(setId: string): Promise<boolean>;

  findHistory(filter: WorkoutHistoryFilter): Promise<PaginatedWorkouts>;
  getAnalytics(userId: string, timeframe: WorkoutTimeframe): Promise<WorkoutTelemetryAggregates>;
  
  // Routine Templates
  findRoutineTemplates(): Promise<RoutineTemplateEntity[]>;
  findRoutineTemplateById(id: string): Promise<RoutineTemplateEntity | null>;

  // Personal Records
  findUserPRs(userId: string, exerciseIds?: string[]): Promise<PersonalRecordEntity[]>;
  savePRs(records: Omit<PersonalRecordEntity, 'id' | 'achievedAt'>[]): Promise<PersonalRecordEntity[]>;
}

export const WORKOUT_REPOSITORY_TOKEN = Symbol('IWorkoutRepository');
