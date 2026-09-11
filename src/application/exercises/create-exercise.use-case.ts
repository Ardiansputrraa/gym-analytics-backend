import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  EXERCISE_REPOSITORY,
  type IExerciseRepository,
} from '../../domain/repositories/exercise.repository.interface';
import {
  CreateExerciseDto,
  ExerciseResponseDto,
} from '../../modules/exercises/schemas/exercise.schema';
import { EquipmentCategory, ExerciseType } from '../../domain/enums/exercise.enums';
import { mapExerciseToResponseDto } from './exercise-mapper.util';

@Injectable()
export class CreateExerciseUseCase {
  constructor(
    @Inject(EXERCISE_REPOSITORY)
    private readonly exerciseRepository: IExerciseRepository,
  ) {}

  async execute(dto: CreateExerciseDto, userId: string): Promise<ExerciseResponseDto> {
    // 1. Resolve Muscle Group (by UUID or name)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      dto.muscleGroup,
    );

    let muscleGroup = isUuid
      ? await this.exerciseRepository.findMuscleGroupById(dto.muscleGroup)
      : await this.exerciseRepository.findMuscleGroupByName(dto.muscleGroup);

    if (!muscleGroup) {
      // Fallback: try by name if isUuid failed or vice versa
      muscleGroup = await this.exerciseRepository.findMuscleGroupByName(dto.muscleGroup);
    }

    if (!muscleGroup) {
      throw new NotFoundException({
        message: `Kelompok otot "${dto.muscleGroup}" tidak valid atau tidak ditemukan.`,
        code: 'MUSCLE_GROUP_NOT_FOUND',
        errors: [],
      });
    }

    // 2. Check for duplicate name for this user
    const existing = await this.exerciseRepository.findByNameAndUser(dto.name, userId);
    if (existing) {
      throw new ConflictException({
        message: `Gerakan dengan nama "${dto.name}" sudah ada dalam daftar Anda.`,
        code: 'EXERCISE_NAME_DUPLICATE',
        errors: [],
      });
    }

    // 3. Create Custom Exercise
    const created = await this.exerciseRepository.create({
      userId,
      name: dto.name,
      description: dto.description || null,
      equipment: dto.equipment as EquipmentCategory,
      exerciseType: dto.exerciseType as ExerciseType,
      primaryMuscleGroupId: muscleGroup.id,
      isCustom: true,
    });

    created.primaryMuscleGroup = muscleGroup;

    return mapExerciseToResponseDto(created);
  }
}
