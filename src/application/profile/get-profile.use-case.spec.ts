import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetProfileUseCase } from './get-profile.use-case';
import { USER_PROFILE_REPOSITORY } from '../../domain/repositories/user-profile.repository.interface';
import { UserProfileEntity } from '../../domain/entities/user-profile.entity';
import { Gender } from '../../domain/enums/gender.enum';
import { ActivityLevel } from '../../domain/enums/activity-level.enum';
import { FitnessGoal } from '../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../domain/enums/diet-pace.enum';

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase;
  let mockProfileRepository: { findByUserId: jest.Mock };

  beforeEach(async () => {
    mockProfileRepository = {
      findByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfileUseCase,
        { provide: USER_PROFILE_REPOSITORY, useValue: mockProfileRepository },
      ],
    }).compile();

    useCase = module.get<GetProfileUseCase>(GetProfileUseCase);
  });

  it('should return user profile with checkInStatus (up to date)', async () => {
    const profile = new UserProfileEntity({
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
    mockProfileRepository.findByUserId.mockResolvedValue(profile);

    const result = await useCase.execute('user-uuid-1');

    expect(mockProfileRepository.findByUserId).toHaveBeenCalledWith(
      'user-uuid-1',
    );
    expect(result.userId).toBe('user-uuid-1');
    expect(result.checkInStatus.needsUpdate).toBe(false);
  });

  it('should flag checkInStatus needsUpdate=true when >= 30 days old', async () => {
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    const staleProfile = new UserProfileEntity({
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
      createdAt: fortyDaysAgo,
      updatedAt: fortyDaysAgo,
    });
    mockProfileRepository.findByUserId.mockResolvedValue(staleProfile);

    const result = await useCase.execute('user-uuid-1');

    expect(result.checkInStatus.needsUpdate).toBe(true);
    expect(result.checkInStatus.daysSinceLastUpdate).toBeGreaterThanOrEqual(39);
    expect(result.checkInStatus.message).toContain('Timbang berat badan Anda');
  });

  it('should throw NotFoundException when profile does not exist', async () => {
    mockProfileRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-without-profile')).rejects.toThrow(
      NotFoundException,
    );
  });
});
