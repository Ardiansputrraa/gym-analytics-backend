import { CreateExerciseUseCase } from './create-exercise.use-case';
import { IExerciseRepository } from '../../domain/repositories/exercise.repository.interface';
import { ExerciseEntity } from '../../domain/entities/exercise.entity';
import { MuscleGroupEntity } from '../../domain/entities/muscle-group.entity';
import { EquipmentCategory, ExerciseType } from '../../domain/enums/exercise.enums';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CreateExerciseUseCase', () => {
  let useCase: CreateExerciseUseCase;
  let mockRepo: jest.Mocked<IExerciseRepository>;

  const mockMuscleGroup = new MuscleGroupEntity({
    id: 'mg-chest',
    name: 'CHEST',
    displayName: 'Dada',
    orderIndex: 1,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockRepo = {
      findAllPaginated: jest.fn(),
      findById: jest.fn(),
      findByNameAndUser: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      getMuscleGroups: jest.fn(),
      findMuscleGroupById: jest.fn().mockResolvedValue(null),
      findMuscleGroupByName: jest.fn().mockResolvedValue(mockMuscleGroup),
    };

    useCase = new CreateExerciseUseCase(mockRepo);
  });

  it('should successfully create a custom exercise', async () => {
    const createdEntity = new ExerciseEntity({
      id: 'ex-custom-1',
      userId: 'user-1',
      name: 'Cable Fly High-Low',
      description: 'Custom fly',
      equipment: EquipmentCategory.CABLE,
      exerciseType: ExerciseType.STRENGTH,
      primaryMuscleGroupId: 'mg-chest',
      primaryMuscleGroup: mockMuscleGroup,
      isCustom: true,
      isActive: true,
      isDeleted: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    mockRepo.create.mockResolvedValue(createdEntity);

    const result = await useCase.execute(
      {
        name: 'Cable Fly High-Low',
        description: 'Custom fly',
        equipment: 'CABLE',
        exerciseType: 'STRENGTH',
        muscleGroup: 'CHEST',
      },
      'user-1',
    );

    expect(result.id).toBe('ex-custom-1');
    expect(result.name).toBe('Cable Fly High-Low');
    expect(result.isCustom).toBe(true);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Cable Fly High-Low',
        userId: 'user-1',
        primaryMuscleGroupId: 'mg-chest',
      }),
    );
  });

  it('should throw NotFoundException if muscle group does not exist', async () => {
    mockRepo.findMuscleGroupByName.mockResolvedValue(null);

    await expect(
      useCase.execute(
        {
          name: 'Some Move',
          equipment: 'DUMBBELL',
          exerciseType: 'STRENGTH',
          muscleGroup: 'UNKNOWN_GROUP',
        },
        'user-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException if exercise with same name already exists', async () => {
    mockRepo.findByNameAndUser.mockResolvedValue(
      new ExerciseEntity({
        id: 'ex-exist',
        name: 'Cable Fly High-Low',
        userId: 'user-1',
        equipment: EquipmentCategory.CABLE,
        exerciseType: ExerciseType.STRENGTH,
        primaryMuscleGroupId: 'mg-chest',
        isCustom: true,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(
      useCase.execute(
        {
          name: 'Cable Fly High-Low',
          equipment: 'CABLE',
          exerciseType: 'STRENGTH',
          muscleGroup: 'CHEST',
        },
        'user-1',
      ),
    ).rejects.toThrow(ConflictException);
  });
});
