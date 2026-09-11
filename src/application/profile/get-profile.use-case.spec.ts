import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetProfileUseCase } from './get-profile.use-case';
import { USER_PROFILE_REPOSITORY } from '../../domain/repositories/user-profile.repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { UserProfileEntity } from '../../domain/entities/user-profile.entity';
import { UserEntity } from '../../domain/entities/user.entity';
import { Gender } from '../../domain/enums/gender.enum';
import { ActivityLevel } from '../../domain/enums/activity-level.enum';
import { FitnessGoal } from '../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../domain/enums/diet-pace.enum';

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase;
  let mockProfileRepository: { findByUserId: jest.Mock };
  let mockUserRepository: { findById: jest.Mock };

  const mockUser = new UserEntity({
    id: 'user-uuid-1',
    email: 'user@example.com',
    passwordHash: 'hash',
    name: 'John Doe',
    isAdmin: false,
    isActive: true,
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockProfileRepository = {
      findByUserId: jest.fn(),
    };
    mockUserRepository = {
      findById: jest.fn().mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfileUseCase,
        { provide: USER_PROFILE_REPOSITORY, useValue: mockProfileRepository },
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
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
    expect(result.user?.name).toBe('John Doe');
    expect(result.checkInStatus?.needsUpdate).toBe(false);
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

    expect(result.checkInStatus?.needsUpdate).toBe(true);
    expect(result.checkInStatus?.daysSinceLastUpdate).toBeGreaterThanOrEqual(39);
    expect(result.checkInStatus?.message).toContain('Timbang berat badan Anda');
  });

  it('should return user info with null profile when profile is not yet created', async () => {
    mockProfileRepository.findByUserId.mockResolvedValue(null);

    const result = await useCase.execute('user-uuid-1');

    expect(result.userId).toBe('user-uuid-1');
    expect(result.user?.name).toBe('John Doe');
    expect(result.profile).toBeNull();
    expect(result.checkInStatus).toBeNull();
  });

  it('should throw NotFoundException when user does not exist', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('unknown-user')).rejects.toThrow(
      NotFoundException,
    );
  });
});
