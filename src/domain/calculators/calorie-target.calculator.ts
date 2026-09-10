import { FitnessGoal } from '../enums/fitness-goal.enum';
import { DietPace } from '../enums/diet-pace.enum';

export interface CalorieTargetCalculationParams {
  tdee: number;
  weightKg: number;
  fitnessGoal: FitnessGoal;
  dietPace?: DietPace;
}

export interface CalorieTargetResult {
  tdee: number;
  fitnessGoal: FitnessGoal;
  dietPace: DietPace;
  goalAdjustment: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterTargetMl: number;
}

export const GOAL_ADJUSTMENTS: Record<FitnessGoal, Record<DietPace, number>> = {
  [FitnessGoal.MAINTENANCE]: {
    [DietPace.RELAXED]: 0,
    [DietPace.STANDARD]: 0,
    [DietPace.EXTREME]: 0,
  },
  [FitnessGoal.FAT_LOSS]: {
    [DietPace.RELAXED]: -250,
    [DietPace.STANDARD]: -500,
    [DietPace.EXTREME]: -750,
  },
  [FitnessGoal.MUSCLE_GAIN]: {
    [DietPace.RELAXED]: 200,
    [DietPace.STANDARD]: 350,
    [DietPace.EXTREME]: 600,
  },
};

export const PROTEIN_PER_KG_FACTORS: Record<FitnessGoal, number> = {
  [FitnessGoal.FAT_LOSS]: 2.0, // High protein to preserve muscle during deficit
  [FitnessGoal.MUSCLE_GAIN]: 1.8, // Optimal protein for hypertrophy
  [FitnessGoal.MAINTENANCE]: 1.6, // Maintenance requirement
};

const MIN_CALORIE_SAFETY_FLOOR = 1200;

export function getGoalAdjustment(
  fitnessGoal: FitnessGoal,
  dietPace: DietPace = DietPace.STANDARD,
): number {
  return GOAL_ADJUSTMENTS[fitnessGoal]?.[dietPace] ?? 0;
}

/**
 * Calculates daily calorie target and macro breakdown (Protein, Carbs, Fats).
 */
export function calculateCalorieTarget(
  params: CalorieTargetCalculationParams,
): CalorieTargetResult {
  const { tdee, weightKg, fitnessGoal } = params;
  const dietPace = params.dietPace ?? DietPace.STANDARD;

  if (tdee <= 0 || weightKg <= 0) {
    throw new Error('TDEE and weight must be greater than zero');
  }

  const goalAdjustment = getGoalAdjustment(fitnessGoal, dietPace);
  const rawTarget = Math.round(tdee + goalAdjustment);
  const targetCalories = Math.max(MIN_CALORIE_SAFETY_FLOOR, rawTarget);

  // 1. Protein: Based on body weight
  const proteinFactor = PROTEIN_PER_KG_FACTORS[fitnessGoal] ?? 1.8;
  const proteinGrams = Math.round(weightKg * proteinFactor);
  const proteinCalories = proteinGrams * 4;

  // 2. Fat: 25% of total target calories (9 kcal/g)
  const fatCalories = targetCalories * 0.25;
  const fatGrams = Math.round(fatCalories / 9);

  // 3. Carbs: Remainder of total calories (4 kcal/g)
  const remainingCalories = targetCalories - (proteinCalories + fatGrams * 9);
  const carbsGrams = Math.max(0, Math.round(remainingCalories / 4));

  // 4. Hydration: 35 ml per kg body weight rounded to nearest 50ml step
  const waterTargetMl = Math.round((weightKg * 35) / 50) * 50;

  return {
    tdee,
    fitnessGoal,
    dietPace,
    goalAdjustment,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    waterTargetMl,
  };
}
