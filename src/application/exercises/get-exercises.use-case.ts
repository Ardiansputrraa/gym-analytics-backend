import { Injectable, Inject } from '@nestjs/common';
import {
  EXERCISE_REPOSITORY,
  type IExerciseRepository,
} from '../../domain/repositories/exercise.repository.interface';
import {
  GetExercisesQueryDto,
  PaginatedExercisesResponseDto,
} from '../../modules/exercises/schemas/exercise.schema';
import { EquipmentCategory } from '../../domain/enums/exercise.enums';
import { mapExerciseToResponseDto } from './exercise-mapper.util';

@Injectable()
export class GetExercisesUseCase {
  constructor(
    @Inject(EXERCISE_REPOSITORY)
    private readonly exerciseRepository: IExerciseRepository,
  ) {}

  async execute(
    query: GetExercisesQueryDto,
    userId?: string,
  ): Promise<PaginatedExercisesResponseDto> {
    const isUuid =
      query.muscleGroup &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        query.muscleGroup,
      );

    const result = await this.exerciseRepository.findAllPaginated({
      userId,
      search: query.search,
      muscleGroupId: isUuid ? query.muscleGroup : undefined,
      muscleGroupName: !isUuid && query.muscleGroup ? query.muscleGroup : undefined,
      equipment: query.equipment as EquipmentCategory | undefined,
      isCustom: query.isCustom,
      page: query.page || 1,
      limit: query.limit || 8,
    });

    return {
      items: result.items.map((item) => mapExerciseToResponseDto(item)),
      pagination: {
        page: result.page,
        limit: result.limit,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      },
    };
  }
}
