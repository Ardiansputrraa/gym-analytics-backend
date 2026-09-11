import { Injectable, Inject } from '@nestjs/common';
import {
  INutritionRepository,
  NUTRITION_REPOSITORY_TOKEN,
} from '../../domain/repositories/nutrition.repository.interface';
import {
  IDailyCalorieTargetRepository,
  DAILY_CALORIE_TARGET_REPOSITORY,
} from '../../domain/repositories/daily-calorie-target.repository.interface';
import {
  IUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from '../../domain/repositories/user-profile.repository.interface';
import {
  IWorkoutRepository,
  WORKOUT_REPOSITORY_TOKEN,
} from '../../domain/repositories/workout.repository.interface';
import { calculateBmr } from '../../domain/calculators/bmr.calculator';
import { calculateTdee } from '../../domain/calculators/tdee.calculator';
import { calculateCalorieTarget } from '../../domain/calculators/calorie-target.calculator';
import { WorkoutTelemetryCalculator } from '../../domain/calculators/workout-telemetry.calculator';
import {
  NutritionHistoryResponseDto,
  NutritionChartPointDto,
} from './dtos/nutrition-response.dto';

@Injectable()
export class GetNutritionHistoryUseCase {
  constructor(
    @Inject(NUTRITION_REPOSITORY_TOKEN)
    private readonly nutritionRepository: INutritionRepository,
    @Inject(DAILY_CALORIE_TARGET_REPOSITORY)
    private readonly calorieTargetRepository: IDailyCalorieTargetRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profileRepository: IUserProfileRepository,
    @Inject(WORKOUT_REPOSITORY_TOKEN)
    private readonly workoutRepository: IWorkoutRepository,
  ) {}

  async execute(
    userId: string,
    timeframe: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' = 'WEEK',
    yearStr?: string,
    monthStr?: string,
  ): Promise<NutritionHistoryResponseDto> {
    const now = new Date();
    const currentYear = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const currentMonth = monthStr ? parseInt(monthStr, 10) - 1 : now.getMonth();

    let startDate: Date;
    let endDate: Date;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    // Determine Date Ranges
    if (timeframe === 'TODAY') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (timeframe === 'WEEK') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (timeframe === 'MONTH') {
      startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    } else {
      // YEAR
      startDate = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    }

    // Default target profile values
    let defaultTargetCalories = 2000;
    let defaultTargetWater = 2500;
    const profile = await this.profileRepository.findByUserId(userId);
    if (profile) {
      const weight = Number(profile.weightKg) || 70;
      defaultTargetWater = Math.round((weight * 35) / 50) * 50;
      const bmr = calculateBmr({
        weightKg: weight,
        heightCm: Number(profile.heightCm) || 170,
        age: profile.age,
        gender: profile.gender,
      });
      const { tdee } = calculateTdee({ bmr, activityLevel: profile.activityLevel });
      const calc = calculateCalorieTarget({
        tdee,
        weightKg: weight,
        fitnessGoal: profile.fitnessGoal,
        dietPace: profile.dietPace,
      });
      defaultTargetCalories = calc.targetCalories;
    }

    // Fetch all entries & workouts in range
    const entries = await this.nutritionRepository.findByUserAndDateRange(userId, startDate, endDate);
    const completedWorkouts = await this.workoutRepository.findCompletedByUserIdAndDateRange(
      userId,
      startDate,
      endDate,
    );

    // Build Chart Data Points
    const chartData: NutritionChartPointDto[] = [];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    if (timeframe === 'TODAY' || timeframe === 'WEEK' || timeframe === 'MONTH') {
      const cursor = new Date(startDate);
      while (cursor <= endDate) {
        const dStr = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`;
        const label =
          timeframe === 'TODAY'
            ? 'Hari Ini'
            : timeframe === 'WEEK'
            ? `${dayNames[cursor.getDay()]} (${cursor.getDate()})`
            : `${cursor.getDate()} ${monthNames[cursor.getMonth()]}`;

        const dayEntries = entries.filter((e) => {
          const eDate = new Date(e.consumedAt);
          return (
            eDate.getFullYear() === cursor.getFullYear() &&
            eDate.getMonth() === cursor.getMonth() &&
            eDate.getDate() === cursor.getDate()
          );
        });

        const dayWorkouts = completedWorkouts.filter((w) => {
          const wDate = new Date(w.completedAt || w.startedAt || '');
          return (
            wDate.getFullYear() === cursor.getFullYear() &&
            wDate.getMonth() === cursor.getMonth() &&
            wDate.getDate() === cursor.getDate()
          );
        });

        const consumedCal = dayEntries.reduce((s, e) => s + (e.calories || 0), 0);
        const waterMl = dayEntries.reduce((s, e) => s + (e.waterMl || 0), 0);
        const proteinG = Math.round(dayEntries.reduce((s, e) => s + (Number(e.proteinG) || 0), 0));
        const fatG = Math.round(dayEntries.reduce((s, e) => s + (Number(e.fatG) || 0), 0));
        const carbsG = Math.round(dayEntries.reduce((s, e) => s + (Number(e.carbsG) || 0), 0));
        const userWeight = profile ? Number(profile.weightKg) : 70;
        const burnedCal = dayWorkouts.reduce((sum, w) => {
          const telemetry = WorkoutTelemetryCalculator.calculateSessionTelemetry({
            startedAt: w.startedAt || w.createdAt,
            completedAt: w.completedAt,
            exercises: (w.exercises || []).map((e) => ({
              isCardio:
                e.primaryMuscle === 'CARDIO' ||
                e.equipment === 'TREADMILL' ||
                (e.exerciseName || '').toLowerCase().includes('treadmill'),
              sets: (e.sets || []).map((s) => ({
                durationSeconds: s.durationSeconds,
                restSeconds: s.restSeconds,
                weightKg: s.weightKg,
                reps: s.reps,
                isCompleted: s.isCompleted,
                isCardio:
                  e.primaryMuscle === 'CARDIO' ||
                  e.equipment === 'TREADMILL' ||
                  (e.exerciseName || '').toLowerCase().includes('treadmill'),
                speedKmh: Number(s.speedKmh) || 4.8,
                inclinePct: Number(s.inclinePct) || 0,
              })),
            })),
            userWeightKg: userWeight,
          });
          return sum + (telemetry.estimatedCaloriesBurned || 0);
        }, 0);

        chartData.push({
          date: dStr,
          label,
          consumedCalories: consumedCal,
          burnedCalories: burnedCal,
          netCalories: Math.max(0, consumedCal - burnedCal),
          targetCalories: defaultTargetCalories,
          waterMl,
          targetWaterMl: defaultTargetWater,
          proteinG,
          fatG,
          carbsG,
        });

        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      // YEAR (12 Monthly Aggregates)
      const userWeight = profile ? Number(profile.weightKg) : 70;
      for (let m = 0; m < 12; m++) {
        const label = monthNames[m];
        const monthEntries = entries.filter((e) => {
          const eDate = new Date(e.consumedAt);
          return eDate.getFullYear() === currentYear && eDate.getMonth() === m;
        });

        const monthWorkouts = completedWorkouts.filter((w) => {
          const wDate = new Date(w.completedAt || w.startedAt || '');
          return wDate.getFullYear() === currentYear && wDate.getMonth() === m;
        });

        const consumedCal = monthEntries.reduce((s, e) => s + (e.calories || 0), 0);
        const waterMl = monthEntries.reduce((s, e) => s + (e.waterMl || 0), 0);
        const proteinG = Math.round(monthEntries.reduce((s, e) => s + (Number(e.proteinG) || 0), 0));
        const fatG = Math.round(monthEntries.reduce((s, e) => s + (Number(e.fatG) || 0), 0));
        const carbsG = Math.round(monthEntries.reduce((s, e) => s + (Number(e.carbsG) || 0), 0));
        const burnedCal = monthWorkouts.reduce((sum, w) => {
          const telemetry = WorkoutTelemetryCalculator.calculateSessionTelemetry({
            startedAt: w.startedAt || w.createdAt,
            completedAt: w.completedAt,
            exercises: (w.exercises || []).map((e) => ({
              isCardio:
                e.primaryMuscle === 'CARDIO' ||
                e.equipment === 'TREADMILL' ||
                (e.exerciseName || '').toLowerCase().includes('treadmill'),
              sets: (e.sets || []).map((s) => ({
                durationSeconds: s.durationSeconds,
                restSeconds: s.restSeconds,
                weightKg: s.weightKg,
                reps: s.reps,
                isCompleted: s.isCompleted,
                isCardio:
                  e.primaryMuscle === 'CARDIO' ||
                  e.equipment === 'TREADMILL' ||
                  (e.exerciseName || '').toLowerCase().includes('treadmill'),
                speedKmh: Number(s.speedKmh) || 4.8,
                inclinePct: Number(s.inclinePct) || 0,
              })),
            })),
            userWeightKg: userWeight,
          });
          return sum + (telemetry.estimatedCaloriesBurned || 0);
        }, 0);

        const daysInThisMonth = new Date(currentYear, m + 1, 0).getDate();
        const avgConsumed = Math.round(consumedCal / daysInThisMonth);
        const avgBurned = Math.round(burnedCal / daysInThisMonth);

        chartData.push({
          date: `${currentYear}-${pad(m + 1)}`,
          label,
          consumedCalories: avgConsumed,
          burnedCalories: avgBurned,
          netCalories: Math.max(0, avgConsumed - avgBurned),
          targetCalories: defaultTargetCalories,
          waterMl: Math.round(waterMl / daysInThisMonth),
          targetWaterMl: defaultTargetWater,
          proteinG: Math.round(proteinG / daysInThisMonth),
          fatG: Math.round(fatG / daysInThisMonth),
          carbsG: Math.round(carbsG / daysInThisMonth),
        });
      }
    }

    const totalDays = chartData.length || 1;
    const totalConsumed = chartData.reduce((s, c) => s + c.consumedCalories, 0);
    const totalBurned = chartData.reduce((s, c) => s + c.burnedCalories, 0);
    const totalWater = chartData.reduce((s, c) => s + c.waterMl, 0);

    const sortedEntries = entries.sort(
      (a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime(),
    );

    return {
      timeframe,
      totalDays,
      avgDailyConsumedCalories: Math.round(totalConsumed / totalDays),
      avgDailyBurnedCalories: Math.round(totalBurned / totalDays),
      avgDailyWaterMl: Math.round(totalWater / totalDays),
      chartData,
      entries: sortedEntries,
      totalEntries: sortedEntries.length,
    };
  }
}
