import { Inject, Injectable } from '@nestjs/common';
import {
  IWorkoutRepository,
  WORKOUT_REPOSITORY_TOKEN,
  WorkoutTelemetryAggregates,
} from '../../domain/repositories/workout.repository.interface';
import { WorkoutTimeframe } from '../../domain/enums/workout.enums';

@Injectable()
export class GetWorkoutAnalyticsUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY_TOKEN)
    private readonly workoutRepository: IWorkoutRepository,
  ) {}

  async execute(
    userId: string,
    timeframe: WorkoutTimeframe = WorkoutTimeframe.WEEK,
  ): Promise<WorkoutTelemetryAggregates> {
    return this.workoutRepository.getAnalytics(userId, timeframe);
  }
}
