import { StartWorkoutUseCase } from './start-workout.use-case';
import { IWorkoutRepository } from '../../domain/repositories/workout.repository.interface';
import { WorkoutStatus } from '../../domain/enums/workout.enums';

describe('StartWorkoutUseCase', () => {
  let useCase: StartWorkoutUseCase;
  let mockRepository: jest.Mocked<IWorkoutRepository>;

  beforeEach(() => {
    mockRepository = {
      cancelExpiredActiveSessions: jest.fn().mockResolvedValue(0),
      findActiveByUserId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((params) =>
        Promise.resolve({
          id: 'w-123',
          userId: params.userId,
          name: params.name || 'Sesi Latihan Gym',
          routineTemplateId: params.routineTemplateId || null,
          status: WorkoutStatus.IN_PROGRESS,
          startedAt: new Date(),
          completedAt: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          exercises: [],
        }),
      ),
      findRoutineTemplateById: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
      addExercise: jest.fn(),
    } as any;

    useCase = new StartWorkoutUseCase(mockRepository);
  });

  it('should cancel expired sessions and start a new active workout session', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Push Day',
    });

    expect(mockRepository.cancelExpiredActiveSessions).toHaveBeenCalled();
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        name: 'Push Day',
      }),
    );
    expect(result.id).toBe('w-123');
    expect(result.status).toBe(WorkoutStatus.IN_PROGRESS);
  });

  it('should idempotently return existing active session if one is already running today', async () => {
    const existing = {
      id: 'existing-w',
      userId: 'user-1',
      name: 'Leg Day',
      status: WorkoutStatus.IN_PROGRESS,
      startedAt: new Date(),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: [],
    };
    mockRepository.findActiveByUserId.mockResolvedValue(existing);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(mockRepository.create).not.toHaveBeenCalled();
    expect(result.id).toBe('existing-w');
  });
});
