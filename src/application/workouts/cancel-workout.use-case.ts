import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IWorkoutRepository,
  WORKOUT_REPOSITORY_TOKEN,
} from '../../domain/repositories/workout.repository.interface';
import { WorkoutEntity } from '../../domain/entities/workout.entity';
import { WorkoutStatus } from '../../domain/enums/workout.enums';

@Injectable()
export class CancelWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY_TOKEN)
    private readonly workoutRepository: IWorkoutRepository,
  ) {}

  async execute(userId: string, workoutId: string): Promise<WorkoutEntity> {
    const workout = await this.workoutRepository.findById(workoutId);
    if (!workout || workout.userId !== userId) {
      throw new NotFoundException('Sesi latihan tidak ditemukan.');
    }

    return this.workoutRepository.updateStatus(workoutId, WorkoutStatus.CANCELLED, new Date());
  }
}
