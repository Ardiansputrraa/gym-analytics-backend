import { Inject, Injectable } from '@nestjs/common';
import {
  IWorkoutRepository,
  WORKOUT_REPOSITORY_TOKEN,
} from '../../domain/repositories/workout.repository.interface';
import { WorkoutEntity } from '../../domain/entities/workout.entity';

@Injectable()
export class GetActiveWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY_TOKEN)
    private readonly workoutRepository: IWorkoutRepository,
  ) {}

  async execute(userId: string): Promise<WorkoutEntity | null> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Cancel any expired sessions from previous days
    await this.workoutRepository.cancelExpiredActiveSessions(userId, todayStart);

    // 2. Query today's active session
    const active = await this.workoutRepository.findActiveByUserId(userId);
    if (!active) return null;

    // Double check that active session started today
    if (active.startedAt) {
      const activeDate = new Date(active.startedAt);
      if (activeDate < todayStart) {
        await this.workoutRepository.cancelExpiredActiveSessions(userId, todayStart);
        return null;
      }
    }

    return active;
  }
}
