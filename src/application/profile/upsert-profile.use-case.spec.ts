import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpsertProfileUseCase } from './upsert-profile.use-case';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { USER_PROFILE_REPOSITORY } from '../../domain/repositories/user-profile.repository.interface';
import { DAILY_CALORIE_TARGET_REPOSITORY } from '../../domain/repositories/daily-calorie-target.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserProfileEntity } from '../../domain/entities/user-profile.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { Gender } from '../../domain/enums/gender.enum';
import { ActivityLevel } from '../../domain/enums/activity-level.enum';
import { FitnessGoal } from '../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../domain/enums/diet-pace.enum';

describe('UpsertProfileUseCase', () => {
  let useCase: UpsertProfileUseCase;
  let mockUserRepository: { findById: jest.Mock };
  let mockProfileRepository: { upsert: jest.Mock };
  let mockCalorieTargetRepository: { upsert: jest.Mock };

  const mockUser = new UserEntity({
    id: 'user-uuid-1',
    email: 'user@example.com',
    passwordHash: 'hash',
    name: 'John Doe',
    role: UserRole.USER,
    isActive: true,
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockProfile = new UserProfileEntity({
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockUserRepository = {
      findById: jest.fn(),
    };
    mockProfileRepository = {
      upsert: jest.fn(),
    };
    mockCalorieTargetRepository = {
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpsertProfileUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: USER_PROFILE_REPOSITORY, useValue: mockProfileRepository },
        {
          provide: DAILY_CALORIE_TARGET_REPOSITORY,
          useValue: mockCalorieTargetRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpsertProfileUseCase>(UpsertProfileUseCase);
  });

  it('should successfully save profile and auto-calculate daily calorie target', async () => {
    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockProfileRepository.upsert.mockResolvedValue(mockProfile);
    mockCalorieTargetRepository.upsert.mockResolvedValue({});

    const result = await useCase.execute('user-uuid-1', {
      age: 25,
      gender: Gender.MALE,
      heightCm: 175,
      weightKg: 70,
      activityLevel: ActivityLevel.MODERATE,
      fitnessGoal: FitnessGoal.FAT_LOSS,
      dietPace: DietPace.STANDARD,
      checkInIntervalDays: 30,
    });

    expect(mockUserRepository.findById).toHaveBeenCalledWith('user-uuid-1');
    expect(mockProfileRepository.upsert).toHaveBeenCalledWith({
      userId: 'user-uuid-1',
      age: 25,
      gender: Gender.MALE,
      heightCm: 175,
      weightKg: 70,
      activityLevel: ActivityLevel.MODERATE,
      fitnessGoal: FitnessGoal.FAT_LOSS,
      dietPace: DietPace.STANDARD,
      checkInIntervalDays: 30,
    });
    expect(mockCalorieTargetRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-uuid-1',
        bmr: 1673.75,
        tdee: 2594.31,
        fitnessGoal: FitnessGoal.FAT_LOSS,
        dietPace: DietPace.STANDARD,
        goalAdjustment: -500,
        targetCalories: 2094,
        proteinGrams: 140,
      }),
    );
    expect(result.userId).toBe('user-uuid-1');
    expect(result.checkInStatus.needsUpdate).toBe(false);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('unknown-user', {
        age: 25,
        gender: Gender.MALE,
        heightCm: 175,
        weightKg: 70,
        activityLevel: ActivityLevel.MODERATE,
        fitnessGoal: FitnessGoal.FAT_LOSS,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mockProfileRepository.upsert).not.toHaveBeenCalled();
    expect(mockCalorieTargetRepository.upsert).not.toHaveBeenCalled();
  });
});
