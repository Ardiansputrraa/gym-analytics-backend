import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetDailyCalorieTargetUseCase } from './get-daily-calorie-target.use-case';
import { DAILY_CALORIE_TARGET_REPOSITORY } from '../../domain/repositories/daily-calorie-target.repository.interface';
import { USER_PROFILE_REPOSITORY } from '../../domain/repositories/user-profile.repository.interface';
import { DailyCalorieTargetEntity } from '../../domain/entities/daily-calorie-target.entity';
import { UserProfileEntity } from '../../domain/entities/user-profile.entity';
import { FitnessGoal } from '../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../domain/enums/diet-pace.enum';
import { Gender } from '../../domain/enums/gender.enum';
import { ActivityLevel } from '../../domain/enums/activity-level.enum';

describe('GetDailyCalorieTargetUseCase', () => {
  let useCase: GetDailyCalorieTargetUseCase;
  let mockCalorieTargetRepository: {
    findByUserAndDate: jest.Mock;
    upsert: jest.Mock;
  };
  let mockProfileRepository: {
    findByUserId: jest.Mock;
  };

  const today = new Date();
  const mockTarget = new DailyCalorieTargetEntity({
    id: 'target-uuid-1',
    userId: 'user-uuid-1',
    date: today,
    bmr: 1673.75,
    activityFactor: 1.55,
    tdee: 2594.31,
    fitnessGoal: FitnessGoal.FAT_LOSS,
    dietPace: DietPace.STANDARD,
    goalAdjustment: -500,
    targetCalories: 2094,
    proteinGrams: 140,
    carbsGrams: 247,
    fatGrams: 58,
    createdAt: today,
    updatedAt: today,
  });

  beforeEach(async () => {
    mockCalorieTargetRepository = {
      findByUserAndDate: jest.fn(),
      upsert: jest.fn(),
    };
    mockProfileRepository = {
      findByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDailyCalorieTargetUseCase,
        {
          provide: DAILY_CALORIE_TARGET_REPOSITORY,
          useValue: mockCalorieTargetRepository,
        },
        {
          provide: USER_PROFILE_REPOSITORY,
          useValue: mockProfileRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetDailyCalorieTargetUseCase>(
      GetDailyCalorieTargetUseCase,
    );
  });

  it('should return existing target if already calculated for date', async () => {
    mockCalorieTargetRepository.findByUserAndDate.mockResolvedValue(mockTarget);

    const result = await useCase.execute('user-uuid-1', today);

    expect(mockCalorieTargetRepository.findByUserAndDate).toHaveBeenCalledWith(
      'user-uuid-1',
      today,
    );
    expect(result.targetCalories).toBe(2094);
    expect(result.proteinGrams).toBe(140);
  });

  it('should auto-calculate and save target from user profile if not yet created for date', async () => {
    mockCalorieTargetRepository.findByUserAndDate.mockResolvedValue(null);
    mockProfileRepository.findByUserId.mockResolvedValue(
      new UserProfileEntity({
        id: 'profile-uuid-1',
        userId: 'user-uuid-1',
        age: 25,
        gender: Gender.MALE,
        heightCm: 175,
        weightKg: 70,
        activityLevel: ActivityLevel.MODERATE,
        fitnessGoal: FitnessGoal.FAT_LOSS,
        dietPace: DietPace.STANDARD,
        checkInIntervalDays: 30,
        createdAt: today,
        updatedAt: today,
      }),
    );
    mockCalorieTargetRepository.upsert.mockResolvedValue(mockTarget);

    const result = await useCase.execute('user-uuid-1', today);

    expect(mockProfileRepository.findByUserId).toHaveBeenCalledWith(
      'user-uuid-1',
    );
    expect(mockCalorieTargetRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-uuid-1',
        targetCalories: 2094,
      }),
    );
    expect(result.targetCalories).toBe(2094);
  });

  it('should throw NotFoundException if no target and no profile exists', async () => {
    mockCalorieTargetRepository.findByUserAndDate.mockResolvedValue(null);
    mockProfileRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-uuid-1', today)).rejects.toThrow(
      NotFoundException,
    );
  });
});
