import { Test, TestingModule } from '@nestjs/testing';
import { CalculateCaloriePreviewUseCase } from './calculate-calorie-preview.use-case';
import { Gender } from '../../domain/enums/gender.enum';
import { ActivityLevel } from '../../domain/enums/activity-level.enum';
import { FitnessGoal } from '../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../domain/enums/diet-pace.enum';

describe('CalculateCaloriePreviewUseCase', () => {
  let useCase: CalculateCaloriePreviewUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculateCaloriePreviewUseCase],
    }).compile();

    useCase = module.get<CalculateCaloriePreviewUseCase>(
      CalculateCaloriePreviewUseCase,
    );
  });

  it('should calculate calorie preview correctly without database persistence', () => {
    const result = useCase.execute(
      {
        age: 25,
        gender: Gender.MALE,
        heightCm: 175,
        weightKg: 70,
        activityLevel: ActivityLevel.MODERATE,
        fitnessGoal: FitnessGoal.FAT_LOSS,
        dietPace: DietPace.STANDARD,
      },
      'test-user',
    );

    expect(result.bmr).toBe(1673.75);
    expect(result.activityFactor).toBe(1.55);
    expect(result.tdee).toBe(2594.31);
    expect(result.goalAdjustment).toBe(-500);
    expect(result.targetCalories).toBe(2094);
    expect(result.proteinGrams).toBe(140);
  });
});
