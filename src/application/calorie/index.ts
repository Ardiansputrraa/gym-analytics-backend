import { GetDailyCalorieTargetUseCase } from './get-daily-calorie-target.use-case';
import { CalculateCaloriePreviewUseCase } from './calculate-calorie-preview.use-case';

export * from './get-daily-calorie-target.use-case';
export * from './calculate-calorie-preview.use-case';

export const CALORIE_USE_CASES = [
  GetDailyCalorieTargetUseCase,
  CalculateCaloriePreviewUseCase,
];
