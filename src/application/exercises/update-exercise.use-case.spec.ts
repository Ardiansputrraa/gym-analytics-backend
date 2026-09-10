import { UpdateExerciseUseCase } from './update-exercise.use-case';
import { IExerciseRepository } from '../../domain/repositories/exercise.repository.interface';
import { ExerciseEntity } from '../../domain/entities/exercise.entity';
import { MuscleGroupEntity } from '../../domain/entities/muscle-group.entity';
import { EquipmentCategory, ExerciseType } from '../../domain/enums/exercise.enums';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('UpdateExerciseUseCase', () => {
  let useCase: UpdateExerciseUseCase;
  let mockRepo: jest.Mocked<IExerciseRepository>;

  const mockMuscleGroup = new MuscleGroupEntity({
    id: 'mg-back',
    name: 'BACK',
    displayName: 'Punggung',
    orderIndex: 2,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const existingCustomExercise = new ExerciseEntity({
    id: 'ex-1',
    userId: 'user-1',
    name: 'My Custom Row',
    description: 'Old desc',
    equipment: EquipmentCategory.DUMBBELL,
    exerciseType: ExerciseType.STRENGTH,
    primaryMuscleGroupId: 'mg-back',
    primaryMuscleGroup: mockMuscleGroup,
    isCustom: true,
    isActive: true,
    isDeleted: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  beforeEach(() => {
    mockRepo = {
      findAllPaginated: jest.fn(),
      findById: jest.fn().mockResolvedValue(existingCustomExercise),
      findByNameAndUser: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      getMuscleGroups: jest.fn(),
      findMuscleGroupById: jest.fn().mockResolvedValue(mockMuscleGroup),
      findMuscleGroupByName: jest.fn().mockResolvedValue(mockMuscleGroup),
    };

    useCase = new UpdateExerciseUseCase(mockRepo);
  });

  it('should successfully update custom exercise for the owner', async () => {
    const updatedEntity = new ExerciseEntity({
      ...existingCustomExercise,
      name: 'Updated Row Name',
      description: 'New desc',
    });

    mockRepo.update.mockResolvedValue(updatedEntity);

    const result = await useCase.execute(
      'ex-1',
      { name: 'Updated Row Name', description: 'New desc' },
      'user-1',
    );

    expect(result.name).toBe('Updated Row Name');
    expect(mockRepo.update).toHaveBeenCalledWith('ex-1', expect.objectContaining({ name: 'Updated Row Name' }));
  });

  it('should throw ForbiddenException if user tries to update another user or system exercise', async () => {
    await expect(
      useCase.execute('ex-1', { name: 'Hacked Name' }, 'other-user', false),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if exercise does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent', { name: 'Name' }, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
