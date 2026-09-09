import { Injectable } from '@nestjs/common';
import { calculateBmr } from '../../domain/calculators/bmr.calculator';
import { calculateTdee } from '../../domain/calculators/tdee.calculator';
import { calculateCalorieTarget } from '../../domain/calculators/calorie-target.calculator';
import { DietPace } from '../../domain/enums/diet-pace.enum';
import type {
  CalculateCaloriePreviewDto,
  DailyCalorieTargetResponseDto,
} from '../../modules/calorie/schemas';

@Injectable()
export class CalculateCaloriePreviewUseCase {
  execute(
    dto: CalculateCaloriePreviewDto,
    userId = 'preview-user-id',
  ): DailyCalorieTargetResponseDto {
    const dietPace = dto.dietPace ?? DietPace.STANDARD;

    const bmr = calculateBmr({
      weightKg: dto.weightKg,
      heightCm: dto.heightCm,
      age: dto.age,
      gender: dto.gender,
    });

    const { tdee, activityFactor } = calculateTdee({
      bmr,
      activityLevel: dto.activityLevel,
    });

    const result = calculateCalorieTarget({
      tdee,
      weightKg: dto.weightKg,
      fitnessGoal: dto.fitnessGoal,
      dietPace,
    });

    return {
      userId,
      date: new Date().toISOString().split('T')[0],
      bmr,
      activityFactor,
      tdee,
      fitnessGoal: dto.fitnessGoal,
      dietPace,
      goalAdjustment: result.goalAdjustment,
      targetCalories: result.targetCalories,
      proteinGrams: result.proteinGrams,
      carbsGrams: result.carbsGrams,
      fatGrams: result.fatGrams,
    };
  }
}
