import { FinishWorkoutUseCase } from './finish-workout.use-case';
import { IWorkoutRepository } from '../../domain/repositories/workout.repository.interface';
import { WorkoutStatus, RecordType } from '../../domain/enums/workout.enums';

describe('FinishWorkoutUseCase', () => {
  let useCase: FinishWorkoutUseCase;
  let mockRepository: jest.Mocked<IWorkoutRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findUserPRs: jest.fn().mockResolvedValue([]),
      savePRs: jest.fn().mockImplementation((records: any[]) =>
        Promise.resolve(
          records.map((r: any, i: number) => ({
            ...r,
            id: `pr-${i}`,
            achievedAt: new Date(),
          })),
        ),
      ),
      updateStatus: jest.fn().mockImplementation((id: string, status: WorkoutStatus, completedAt?: Date) =>
        Promise.resolve({
          id,
          userId: 'user-1',
          name: 'Bench Workout',
          status,
          startedAt: new Date(Date.now() - 3600000),
          completedAt: completedAt || new Date(),
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          exercises: [
            {
              id: 'we-1',
              workoutId: id,
              exerciseId: 'ex-bench',
              orderIndex: 1,
              isDeleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              sets: [
                {
                  id: 'set-1',
                  workoutExerciseId: 'we-1',
                  orderIndex: 1,
                  weightKg: 100,
                  reps: 5,
                  durationSeconds: 45,
                  restSeconds: 90,
                  isCompleted: true,
                  isDeleted: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ],
            },
          ],
        }),
      ),
    } as any;

    const mockProfileRepository = {
      findByUserId: jest.fn().mockResolvedValue({ weightKg: 80 }),
    } as any;

    useCase = new FinishWorkoutUseCase(mockRepository, mockProfileRepository);
  });

  it('should complete workout, detect PRs, calculate summary metrics', async () => {
    mockRepository.findById.mockResolvedValue({
      id: 'w-1',
      userId: 'user-1',
      name: 'Bench Workout',
      status: WorkoutStatus.IN_PROGRESS,
      startedAt: new Date(Date.now() - 3600000),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: [
        {
          id: 'we-1',
          workoutId: 'w-1',
          exerciseId: 'ex-bench',
          orderIndex: 1,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          sets: [
            {
              id: 'set-1',
              workoutExerciseId: 'we-1',
              orderIndex: 1,
              weightKg: 100,
              reps: 5,
              durationSeconds: 45,
              restSeconds: 90,
              isCompleted: true,
              isDeleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ],
    });

    const result = await useCase.execute('user-1', 'w-1');

    expect(mockRepository.updateStatus).toHaveBeenCalledWith('w-1', WorkoutStatus.COMPLETED, expect.any(Date));
    expect(result.summary.totalVolumeKg).toBe(500);
    expect(result.summary.totalCompletedSets).toBe(1);
    expect(result.newPersonalRecords.length).toBeGreaterThan(0);
  });
});
