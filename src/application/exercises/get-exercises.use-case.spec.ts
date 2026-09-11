import { GetExercisesUseCase } from './get-exercises.use-case';
import { IExerciseRepository } from '../../domain/repositories/exercise.repository.interface';
import { ExerciseEntity } from '../../domain/entities/exercise.entity';
import { MuscleGroupEntity } from '../../domain/entities/muscle-group.entity';
import { EquipmentCategory, ExerciseType } from '../../domain/enums/exercise.enums';

describe('GetExercisesUseCase', () => {
  let useCase: GetExercisesUseCase;
  let mockRepo: jest.Mocked<IExerciseRepository>;

  const mockMuscleGroup = new MuscleGroupEntity({
    id: 'mg-1',
    name: 'CHEST',
    displayName: 'Dada',
    orderIndex: 1,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockExercise = new ExerciseEntity({
    id: 'ex-1',
    userId: null,
    name: 'Barbell Bench Press',
    description: 'Flat bench',
    equipment: EquipmentCategory.BARBELL,
    exerciseType: ExerciseType.STRENGTH,
    primaryMuscleGroupId: 'mg-1',
    primaryMuscleGroup: mockMuscleGroup,
    isCustom: false,
    isActive: true,
    isDeleted: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  beforeEach(() => {
    mockRepo = {
      findAllPaginated: jest.fn().mockResolvedValue({
        items: [mockExercise],
        page: 1,
        limit: 8,
        totalItems: 1,
        totalPages: 1,
      }),
      findById: jest.fn(),
      findByNameAndUser: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      getMuscleGroups: jest.fn(),
      findMuscleGroupById: jest.fn(),
      findMuscleGroupByName: jest.fn(),
    };

    useCase = new GetExercisesUseCase(mockRepo);
  });

  it('should return paginated exercises with mapped DTO fields', async () => {
    const result = await useCase.execute({ page: 1, limit: 8, search: 'Bench' });

    expect(mockRepo.findAllPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 8,
        search: 'Bench',
      }),
    );

    expect(result.pagination.totalItems).toBe(1);
    expect(result.items[0].name).toBe('Barbell Bench Press');
    expect(result.items[0].primaryMuscle).toBe('CHEST');
    expect(result.items[0].primaryMuscleName).toBe('Dada');
    expect(result.items[0].equipmentName).toBe('Barbell');
  });
});
