import { Injectable, Inject } from '@nestjs/common';
import {
  EXERCISE_REPOSITORY,
  type IExerciseRepository,
} from '../../domain/repositories/exercise.repository.interface';
import { MuscleGroupResponseDto } from '../../modules/exercises/schemas/exercise.schema';

@Injectable()
export class GetMuscleGroupsUseCase {
  constructor(
    @Inject(EXERCISE_REPOSITORY)
    private readonly exerciseRepository: IExerciseRepository,
  ) {}

  async execute(): Promise<MuscleGroupResponseDto[]> {
    const muscleGroups = await this.exerciseRepository.getMuscleGroups();

    return muscleGroups.map((mg) => ({
      id: mg.id,
      name: mg.name,
      displayName: mg.displayName,
      description: mg.description,
      orderIndex: mg.orderIndex,
    }));
  }
}
