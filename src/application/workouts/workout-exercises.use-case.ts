import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IWorkoutRepository,
  WORKOUT_REPOSITORY_TOKEN,
} from '../../domain/repositories/workout.repository.interface';
import { WorkoutExerciseEntity, WorkoutEntity } from '../../domain/entities/workout.entity';
import { WorkoutStatus } from '../../domain/enums/workout.enums';

export interface AddExerciseInput {
  userId: string;
  workoutId: string;
  exerciseId: string;
}

export interface RemoveExerciseInput {
  userId: string;
  workoutId: string;
  exerciseId: string;
}

@Injectable()
export class WorkoutExercisesUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY_TOKEN)
    private readonly workoutRepository: IWorkoutRepository,
  ) {}

  async addExercise(input: AddExerciseInput): Promise<WorkoutExerciseEntity> {
    const workout = await this.workoutRepository.findById(input.workoutId);
    if (!workout || workout.userId !== input.userId) {
      throw new NotFoundException('Sesi latihan tidak ditemukan.');
    }

    if (workout.status !== WorkoutStatus.IN_PROGRESS) {
      throw new BadRequestException('Hanya sesi yang sedang berjalan yang dapat ditambahkan gerakan.');
    }

    const nextOrder = workout.exercises.length + 1;

    return this.workoutRepository.addExercise({
      workoutId: input.workoutId,
      exerciseId: input.exerciseId,
      orderIndex: nextOrder,
    });
  }

  async removeExercise(input: RemoveExerciseInput): Promise<WorkoutEntity> {
    const workout = await this.workoutRepository.findById(input.workoutId);
    if (!workout || workout.userId !== input.userId) {
      throw new NotFoundException('Sesi latihan tidak ditemukan.');
    }

    await this.workoutRepository.removeExercise(input.workoutId, input.exerciseId);

    const refreshed = await this.workoutRepository.findById(input.workoutId);
    if (!refreshed) throw new NotFoundException('Sesi latihan tidak ditemukan.');
    return refreshed;
  }
}
