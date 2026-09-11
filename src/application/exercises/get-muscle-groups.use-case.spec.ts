import { GetMuscleGroupsUseCase } from './get-muscle-groups.use-case';
import { IExerciseRepository } from '../../domain/repositories/exercise.repository.interface';
import { MuscleGroupEntity } from '../../domain/entities/muscle-group.entity';

describe('GetMuscleGroupsUseCase', () => {
  let useCase: GetMuscleGroupsUseCase;
  let mockRepo: jest.Mocked<IExerciseRepository>;

  beforeEach(() => {
    mockRepo = {
      findAllPaginated: jest.fn(),
      findById: jest.fn(),
      findByNameAndUser: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      getMuscleGroups: jest.fn().mockResolvedValue([
        new MuscleGroupEntity({
          id: 'mg-1',
          name: 'CHEST',
          displayName: 'Dada',
          orderIndex: 1,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]),
      findMuscleGroupById: jest.fn(),
      findMuscleGroupByName: jest.fn(),
    };

    useCase = new GetMuscleGroupsUseCase(mockRepo);
  });

  it('should return list of muscle groups', async () => {
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('CHEST');
    expect(result[0].displayName).toBe('Dada');
    expect(mockRepo.getMuscleGroups).toHaveBeenCalled();
  });
});
