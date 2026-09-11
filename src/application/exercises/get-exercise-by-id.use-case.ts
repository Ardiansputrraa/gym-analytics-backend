import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  EXERCISE_REPOSITORY,
  type IExerciseRepository,
} from '../../domain/repositories/exercise.repository.interface';
import { ExerciseResponseDto } from '../../modules/exercises/schemas/exercise.schema';
import { mapExerciseToResponseDto } from './exercise-mapper.util';

@Injectable()
export class GetExerciseByIdUseCase {
  constructor(
    @Inject(EXERCISE_REPOSITORY)
    private readonly exerciseRepository: IExerciseRepository,
  ) {}

  async execute(id: string, userId?: string): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepository.findById(id);

    if (!exercise) {
      throw new NotFoundException({
        message: 'Gerakan atau alat gym tidak ditemukan.',
        code: 'EXERCISE_NOT_FOUND',
        errors: [],
      });
    }

    // If it's a custom exercise with a specific userId, make sure user can access it
    if (exercise.userId && userId && exercise.userId !== userId) {
      throw new NotFoundException({
        message: 'Gerakan atau alat gym tidak ditemukan.',
        code: 'EXERCISE_NOT_FOUND',
        errors: [],
      });
    }

    return mapExerciseToResponseDto(exercise);
  }
}
