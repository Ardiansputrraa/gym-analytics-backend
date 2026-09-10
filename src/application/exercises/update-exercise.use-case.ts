import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import {
  EXERCISE_REPOSITORY,
  type IExerciseRepository,
} from '../../domain/repositories/exercise.repository.interface';
import {
  UpdateExerciseDto,
  ExerciseResponseDto,
} from '../../modules/exercises/schemas/exercise.schema';
import { EquipmentCategory, ExerciseType } from '../../domain/enums/exercise.enums';
import { mapExerciseToResponseDto } from './exercise-mapper.util';

@Injectable()
export class UpdateExerciseUseCase {
  constructor(
    @Inject(EXERCISE_REPOSITORY)
    private readonly exerciseRepository: IExerciseRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateExerciseDto,
    userId: string,
    isAdmin = false,
  ): Promise<ExerciseResponseDto> {
    const existing = await this.exerciseRepository.findById(id);

    if (!existing) {
      throw new NotFoundException({
        message: 'Gerakan atau alat gym tidak ditemukan.',
        code: 'EXERCISE_NOT_FOUND',
        errors: [],
      });
    }

    // Ownership check: system master exercises cannot be modified by regular users
    if (!isAdmin && existing.userId !== userId) {
      throw new ForbiddenException({
        message: 'Anda hanya dapat mengubah gerakan kustom milik Anda sendiri.',
        code: 'EXERCISE_FORBIDDEN',
        errors: [],
      });
    }

    let primaryMuscleGroupId = existing.primaryMuscleGroupId;
    let muscleGroupEntity = existing.primaryMuscleGroup;

    if (dto.muscleGroup) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        dto.muscleGroup,
      );

      const foundGroup = isUuid
        ? await this.exerciseRepository.findMuscleGroupById(dto.muscleGroup)
        : await this.exerciseRepository.findMuscleGroupByName(dto.muscleGroup);

      if (!foundGroup) {
        throw new NotFoundException({
          message: `Kelompok otot "${dto.muscleGroup}" tidak ditemukan.`,
          code: 'MUSCLE_GROUP_NOT_FOUND',
          errors: [],
        });
      }

      primaryMuscleGroupId = foundGroup.id;
      muscleGroupEntity = foundGroup;
    }

    // If name changed, check duplicate
    if (dto.name && dto.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await this.exerciseRepository.findByNameAndUser(
        dto.name,
        existing.userId,
      );
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException({
          message: `Gerakan dengan nama "${dto.name}" sudah ada.`,
          code: 'EXERCISE_NAME_DUPLICATE',
          errors: [],
        });
      }
    }

    const updated = await this.exerciseRepository.update(id, {
      name: dto.name,
      description: dto.description,
      equipment: dto.equipment as EquipmentCategory | undefined,
      exerciseType: dto.exerciseType as ExerciseType | undefined,
      primaryMuscleGroupId,
      isActive: dto.isActive,
    });

    updated.primaryMuscleGroup = muscleGroupEntity;

    return mapExerciseToResponseDto(updated);
  }
}
