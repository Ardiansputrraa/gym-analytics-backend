import { DailyCalorieTargetEntity } from '../entities/daily-calorie-target.entity';
import { FitnessGoal } from '../enums/fitness-goal.enum';
import { DietPace } from '../enums/diet-pace.enum';

export interface UpsertDailyCalorieTargetData {
  userId: string;
  date: Date;
  bmr: number;
  activityFactor: number;
  tdee: number;
  fitnessGoal: FitnessGoal;
  dietPace: DietPace;
  goalAdjustment: number;
  targetCalories: number;
  proteinGrams?: number | null;
  carbsGrams?: number | null;
  fatGrams?: number | null;
}

export const DAILY_CALORIE_TARGET_REPOSITORY = Symbol(
  'IDailyCalorieTargetRepository',
);

export interface IDailyCalorieTargetRepository {
  upsert(data: UpsertDailyCalorieTargetData): Promise<DailyCalorieTargetEntity>;
  findByUserAndDate(
    userId: string,
    date: Date,
  ): Promise<DailyCalorieTargetEntity | null>;
  findLatestByUserId(userId: string): Promise<DailyCalorieTargetEntity | null>;
}
