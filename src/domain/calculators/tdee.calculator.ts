import { ActivityLevel } from '../enums/activity-level.enum';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHT]: 1.375,
  [ActivityLevel.MODERATE]: 1.55,
  [ActivityLevel.ACTIVE]: 1.725,
  [ActivityLevel.VERY_ACTIVE]: 1.9,
};

export interface TdeeCalculationParams {
  bmr: number;
  activityLevel: ActivityLevel;
}

export function getActivityFactor(activityLevel: ActivityLevel): number {
  return ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2;
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * Formula: TDEE = BMR × Activity Multiplier
 */
export function calculateTdee(params: TdeeCalculationParams): {
  tdee: number;
  activityFactor: number;
} {
  const { bmr, activityLevel } = params;

  if (bmr <= 0) {
    throw new Error('BMR must be greater than zero');
  }

  const activityFactor = getActivityFactor(activityLevel);
  const tdee = Math.round(bmr * activityFactor * 100) / 100;

  return {
    tdee,
    activityFactor,
  };
}
