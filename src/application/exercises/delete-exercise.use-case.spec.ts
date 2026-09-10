import { DeleteExerciseUseCase } from './delete-exercise.use-case';
import { IExerciseRepository } from '../../domain/repositories/exercise.repository.interface';
import { ExerciseEntity } from '../../domain/entities/exercise.entity';
import { EquipmentCategory, ExerciseType } from '../../domain/enums/exercise.enums';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('DeleteExerciseUseCase', () => {
  let useCase: DeleteExerciseUseCase;
  let mockRepo: jest.Mocked<IExerciseRepository>;

  const existingCustomExercise = new ExerciseEntity({
    id: 'ex-1',
    userId: 'user-1',
    name: 'Custom Movement',
    equipment: EquipmentCategory.DUMBBELL,
    exerciseType: ExerciseType.STRENGTH,
    primaryMuscleGroupId: 'mg-1',
    isCustom: true,
    isActive: true,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockRepo = {
      findAllPaginated: jest.fn(),
      findById: jest.fn().mockResolvedValue(existingCustomExercise),
      findByNameAndUser: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn().mockResolvedValue(existingCustomExercise),
      getMuscleGroups: jest.fn(),
      findMuscleGroupById: jest.fn(),
      findMuscleGroupByName: jest.fn(),
    };

    useCase = new DeleteExerciseUseCase(mockRepo);
  });

  it('should successfully soft-delete custom exercise for owner', async () => {
    const result = await useCase.execute('ex-1', 'user-1');

    expect(result.success).toBe(true);
    expect(mockRepo.softDelete).toHaveBeenCalledWith('ex-1');
  });

  it('should throw ForbiddenException if user is not the owner', async () => {
    await expect(useCase.execute('ex-1', 'other-user')).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if exercise does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-id', 'user-1')).rejects.toThrow(NotFoundException);
  });
});
