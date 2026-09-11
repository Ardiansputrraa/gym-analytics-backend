import { NutritionEntryEntity } from '../../../domain/entities/nutrition-entry.entity';

export interface DailyNutritionSummaryResponseDto {
  date: string; // YYYY-MM-DD
  targetCalories: number;
  consumedCalories: number;
  workoutCaloriesBurned: number;
  netCalories: number;
  remainingCalories: number;

  targetWaterMl: number;
  consumedWaterMl: number;
  remainingWaterMl: number;

  targetProteinG: number;
  consumedProteinG: number;
  remainingProteinG: number;

  targetFatG: number;
  consumedFatG: number;
  remainingFatG: number;

  targetCarbsG: number;
  consumedCarbsG: number;
  remainingCarbsG: number;

  entries: NutritionEntryEntity[];
}

export interface NutritionChartPointDto {
  date: string;
  label: string;
  consumedCalories: number;
  burnedCalories: number;
  netCalories: number;
  targetCalories: number;
  waterMl: number;
  targetWaterMl: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface NutritionHistoryResponseDto {
  timeframe: string;
  totalDays: number;
  avgDailyConsumedCalories: number;
  avgDailyBurnedCalories: number;
  avgDailyWaterMl: number;
  chartData: NutritionChartPointDto[];
  entries: NutritionEntryEntity[];
  totalEntries: number;
}
