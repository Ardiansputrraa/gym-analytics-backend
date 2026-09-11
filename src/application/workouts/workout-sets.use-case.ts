import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IWorkoutRepository,
  WORKOUT_REPOSITORY_TOKEN,
} from '../../domain/repositories/workout.repository.interface';
import { WorkoutSetEntity } from '../../domain/entities/workout.entity';

export interface CreateSetInput {
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

export interface UpdateSetInput {
  setId: string;
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

@Injectable()
export class WorkoutSetsUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY_TOKEN)
    private readonly workoutRepository: IWorkoutRepository,
  ) {}

  async addSet(input: CreateSetInput): Promise<WorkoutSetEntity> {
    return this.workoutRepository.addSet(input);
  }

  async updateSet(input: UpdateSetInput): Promise<WorkoutSetEntity> {
    return this.workoutRepository.updateSet(input.setId, input);
  }

  async removeSet(setId: string): Promise<boolean> {
    return this.workoutRepository.removeSet(setId);
  }
}
