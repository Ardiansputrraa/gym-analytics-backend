import { Gender } from '../enums/gender.enum';

export interface BmrCalculationParams {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
}

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation.
 *
 * Men:   BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 */
export function calculateBmr(params: BmrCalculationParams): number {
  const { weightKg, heightCm, age, gender } = params;

  if (weightKg <= 0 || heightCm <= 0 || age <= 0) {
    throw new Error('Weight, height, and age must be greater than zero');
  }

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  const bmr = gender === Gender.MALE ? base + 5 : base - 161;

  return Math.round(bmr * 100) / 100;
}
