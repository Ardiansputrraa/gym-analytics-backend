import { Test, TestingModule } from '@nestjs/testing';
import { CalorieController } from './calorie.controller';
import {
  GetDailyCalorieTargetUseCase,
  CalculateCaloriePreviewUseCase,
} from '../../application/calorie';
import {
  JwtAuthGuard,
  type JwtPayload,
} from '../../common/guards/jwt-auth.guard';
import { FitnessGoal } from '../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../domain/enums/diet-pace.enum';
import { Gender } from '../../domain/enums/gender.enum';
import { ActivityLevel } from '../../domain/enums/activity-level.enum';

describe('CalorieController', () => {
  let controller: CalorieController;
  let mockGetDailyCalorieTargetUseCase: { execute: jest.Mock };
  let mockCalculateCaloriePreviewUseCase: { execute: jest.Mock };

  const mockUser: JwtPayload = {
    sub: 'user-uuid-1',
    email: 'user@example.com',
    isAdmin: false,
  };

  const mockResponse = {
    id: 'target-uuid-1',
    userId: 'user-uuid-1',
    date: '2026-09-09',
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
  };

  beforeEach(async () => {
    mockGetDailyCalorieTargetUseCase = { execute: jest.fn() };
    mockCalculateCaloriePreviewUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalorieController],
      providers: [
        {
          provide: GetDailyCalorieTargetUseCase,
          useValue: mockGetDailyCalorieTargetUseCase,
        },
        {
          provide: CalculateCaloriePreviewUseCase,
          useValue: mockCalculateCaloriePreviewUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CalorieController>(CalorieController);
  });

  describe('GET /calorie/target/today', () => {
    it('should return today daily calorie target', async () => {
      mockGetDailyCalorieTargetUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.getTodayTarget(mockUser);

      expect(mockGetDailyCalorieTargetUseCase.execute).toHaveBeenCalledWith(
        'user-uuid-1',
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('POST /calorie/preview', () => {
    it('should calculate on-the-fly calorie preview', () => {
      mockCalculateCaloriePreviewUseCase.execute.mockReturnValue(mockResponse);

      const result = controller.calculatePreview(mockUser, {
        age: 25,
        gender: Gender.MALE,
        heightCm: 175,
        weightKg: 70,
        activityLevel: ActivityLevel.MODERATE,
        fitnessGoal: FitnessGoal.FAT_LOSS,
        dietPace: DietPace.STANDARD,
      });

      expect(mockCalculateCaloriePreviewUseCase.execute).toHaveBeenCalledWith(
        {
          age: 25,
          gender: Gender.MALE,
          heightCm: 175,
          weightKg: 70,
          activityLevel: ActivityLevel.MODERATE,
          fitnessGoal: FitnessGoal.FAT_LOSS,
          dietPace: DietPace.STANDARD,
        },
        'user-uuid-1',
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
