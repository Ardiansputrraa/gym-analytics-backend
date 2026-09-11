import { GetActiveWorkoutUseCase } from './get-active-workout.use-case';
import { IWorkoutRepository } from '../../domain/repositories/workout.repository.interface';
import { WorkoutStatus } from '../../domain/enums/workout.enums';

describe('GetActiveWorkoutUseCase', () => {
  let useCase: GetActiveWorkoutUseCase;
  let mockRepository: jest.Mocked<IWorkoutRepository>;

  beforeEach(() => {
    mockRepository = {
      cancelExpiredActiveSessions: jest.fn().mockResolvedValue(0),
      findActiveByUserId: jest.fn().mockResolvedValue(null),
    } as any;

    useCase = new GetActiveWorkoutUseCase(mockRepository);
  });

  it('should return active session if it started today', async () => {
    const active = {
      id: 'active-today',
      userId: 'user-1',
      name: 'Upper Body',
      status: WorkoutStatus.IN_PROGRESS,
      startedAt: new Date(),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: [],
    };
    mockRepository.findActiveByUserId.mockResolvedValue(active);

    const result = await useCase.execute('user-1');

    expect(mockRepository.cancelExpiredActiveSessions).toHaveBeenCalled();
    expect(result).toEqual(active);
  });

  it('should cancel and return null if session started yesterday', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const expiredActive = {
      id: 'active-yesterday',
      userId: 'user-1',
      name: 'Upper Body',
      status: WorkoutStatus.IN_PROGRESS,
      startedAt: yesterday,
      isDeleted: false,
      createdAt: yesterday,
      updatedAt: yesterday,
      exercises: [],
    };
    mockRepository.findActiveByUserId.mockResolvedValue(expiredActive);

    const result = await useCase.execute('user-1');

    expect(result).toBeNull();
  });
});
