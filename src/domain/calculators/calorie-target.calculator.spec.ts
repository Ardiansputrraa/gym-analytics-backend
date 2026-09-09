import {
  calculateCalorieTarget,
  getGoalAdjustment,
} from './calorie-target.calculator';
import { FitnessGoal } from '../enums/fitness-goal.enum';
import { DietPace } from '../enums/diet-pace.enum';

describe('Calorie Target & Macro Calculator', () => {
  it('should calculate standard fat loss target with macro distribution', () => {
    // TDEE: 2500, Weight: 70kg, FAT_LOSS, STANDARD (-500)
    // Target: 2000 kcal
    // Protein: 70 * 2.0 = 140g (560 kcal)
    // Fat: (2000 * 0.25) / 9 = 500 / 9 = 56g (504 kcal)
    // Carbs: (2000 - 560 - 504) / 4 = 936 / 4 = 234g
    const result = calculateCalorieTarget({
      tdee: 2500,
      weightKg: 70,
      fitnessGoal: FitnessGoal.FAT_LOSS,
      dietPace: DietPace.STANDARD,
    });

    expect(result.goalAdjustment).toBe(-500);
    expect(result.targetCalories).toBe(2000);
    expect(result.proteinGrams).toBe(140);
    expect(result.fatGrams).toBe(56);
    expect(result.carbsGrams).toBe(234);
  });

  it('should calculate relaxed muscle gain target', () => {
    const result = calculateCalorieTarget({
      tdee: 2200,
      weightKg: 65,
      fitnessGoal: FitnessGoal.MUSCLE_GAIN,
      dietPace: DietPace.RELAXED,
    });

    expect(result.goalAdjustment).toBe(200);
    expect(result.targetCalories).toBe(2400);
    expect(result.proteinGrams).toBe(117); // 65 * 1.8
  });

  it('should respect minimum safety floor of 1200 kcal', () => {
    const result = calculateCalorieTarget({
      tdee: 1400,
      weightKg: 45,
      fitnessGoal: FitnessGoal.FAT_LOSS,
      dietPace: DietPace.EXTREME, // -750 -> 650 kcal, but floor is 1200
    });

    expect(result.targetCalories).toBe(1200);
  });

  it('should return correct goal adjustments for all paces', () => {
    expect(getGoalAdjustment(FitnessGoal.FAT_LOSS, DietPace.RELAXED)).toBe(
      -250,
    );
    expect(getGoalAdjustment(FitnessGoal.FAT_LOSS, DietPace.STANDARD)).toBe(
      -500,
    );
    expect(getGoalAdjustment(FitnessGoal.FAT_LOSS, DietPace.EXTREME)).toBe(
      -750,
    );
    expect(getGoalAdjustment(FitnessGoal.MUSCLE_GAIN, DietPace.RELAXED)).toBe(
      200,
    );
    expect(getGoalAdjustment(FitnessGoal.MUSCLE_GAIN, DietPace.STANDARD)).toBe(
      350,
    );
    expect(getGoalAdjustment(FitnessGoal.MUSCLE_GAIN, DietPace.EXTREME)).toBe(
      600,
    );
    expect(getGoalAdjustment(FitnessGoal.MAINTENANCE, DietPace.STANDARD)).toBe(
      0,
    );
  });
});
