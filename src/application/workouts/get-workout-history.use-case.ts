import { Inject, Injectable } from '@nestjs/common';
import {
  IWorkoutRepository,
  WORKOUT_REPOSITORY_TOKEN,
  PaginatedWorkouts,
  WorkoutHistoryFilter,
} from '../../domain/repositories/workout.repository.interface';

@Injectable()
export class GetWorkoutHistoryUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY_TOKEN)
    private readonly workoutRepository: IWorkoutRepository,
  ) {}

  async execute(filter: WorkoutHistoryFilter): Promise<PaginatedWorkouts> {
    return this.workoutRepository.findHistory(filter);
  }
}
