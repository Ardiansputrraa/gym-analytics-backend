import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import {
  UpsertProfileUseCase,
  GetProfileUseCase,
} from '../../application/profile';
import {
  JwtAuthGuard,
  type JwtPayload,
} from '../../common/guards/jwt-auth.guard';
import { Gender } from '../../domain/enums/gender.enum';
import { ActivityLevel } from '../../domain/enums/activity-level.enum';
import { FitnessGoal } from '../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../domain/enums/diet-pace.enum';

describe('ProfileController', () => {
  let controller: ProfileController;
  let mockUpsertProfileUseCase: { execute: jest.Mock };
  let mockGetProfileUseCase: { execute: jest.Mock };

  const mockUser: JwtPayload = {
    sub: 'user-uuid-1',
    email: 'user@example.com',
    isAdmin: false,
  };

  const mockResponse = {
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
    checkInStatus: {
      needsUpdate: false,
      daysSinceLastUpdate: 0,
      checkInIntervalDays: 30,
      message: 'Profil aktif.',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    mockUpsertProfileUseCase = { execute: jest.fn() };
    mockGetProfileUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: UpsertProfileUseCase,
          useValue: mockUpsertProfileUseCase,
        },
        {
          provide: GetProfileUseCase,
          useValue: mockGetProfileUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  describe('GET /profile/me', () => {
    it('should return current user profile', async () => {
      mockGetProfileUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.getMyProfile(mockUser);

      expect(mockGetProfileUseCase.execute).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('PUT /profile/me', () => {
    it('should upsert profile and return updated profile', async () => {
      mockUpsertProfileUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.updateMyProfile(mockUser, {
        age: 25,
        gender: Gender.MALE,
        heightCm: 175,
        weightKg: 70,
        activityLevel: ActivityLevel.MODERATE,
        fitnessGoal: FitnessGoal.FAT_LOSS,
        dietPace: DietPace.STANDARD,
        checkInIntervalDays: 30,
      });

      expect(mockUpsertProfileUseCase.execute).toHaveBeenCalledWith(
        'user-uuid-1',
        {
          age: 25,
          gender: Gender.MALE,
          heightCm: 175,
          weightKg: 70,
          activityLevel: ActivityLevel.MODERATE,
          fitnessGoal: FitnessGoal.FAT_LOSS,
          dietPace: DietPace.STANDARD,
          checkInIntervalDays: 30,
        },
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
