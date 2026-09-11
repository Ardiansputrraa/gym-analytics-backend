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
import { DailyNutritionSummaryResponseDto } from './dtos/nutrition-response.dto';

@Injectable()
export class GetDailyNutritionSummaryUseCase {
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

  async execute(userId: string, dateStr?: string): Promise<DailyNutritionSummaryResponseDto> {
    let targetDate: Date;
    if (dateStr && dateStr.trim() !== '') {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        targetDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
      } else {
        targetDate = new Date(dateStr);
      }
    } else {
      targetDate = new Date();
    }

    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const formattedDate = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;

    // 1. Get Target Calories & Macros (From CalorieTarget or Profile)
    let targetCalories = 2000;
    let targetWaterMl = 2500;
    let targetProteinG = 150;
    let targetFatG = 55;
    let targetCarbsG = 225;

    const existingTarget = await this.calorieTargetRepository.findByUserAndDate(userId, targetDate);
    if (existingTarget) {
      targetCalories = existingTarget.targetCalories;
      targetProteinG = existingTarget.proteinGrams || 150;
      targetFatG = existingTarget.fatGrams || 55;
      targetCarbsG = existingTarget.carbsGrams || 225;
    }

    const profile = await this.profileRepository.findByUserId(userId);
    if (profile) {
      const weight = Number(profile.weightKg) || 70;
      targetWaterMl = Math.round((weight * 35) / 50) * 50;

      if (!existingTarget) {
        const bmr = calculateBmr({
          weightKg: weight,
          heightCm: Number(profile.heightCm) || 170,
          age: profile.age,
          gender: profile.gender,
        });
        const { tdee } = calculateTdee({
          bmr,
          activityLevel: profile.activityLevel,
        });
        const calculated = calculateCalorieTarget({
          tdee,
          weightKg: weight,
          fitnessGoal: profile.fitnessGoal,
          dietPace: profile.dietPace,
        });
        targetCalories = calculated.targetCalories;
        targetProteinG = calculated.proteinGrams;
        targetFatG = calculated.fatGrams;
        targetCarbsG = calculated.carbsGrams;
        targetWaterMl = calculated.waterTargetMl;
      }
    }

    // 2. Fetch Nutrition Entries for this day
    const entries = await this.nutritionRepository.findByUserAndDateRange(userId, startDate, endDate);

    // 3. Fetch Completed Workouts for this day
    const completedWorkouts = await this.workoutRepository.findCompletedByUserIdAndDateRange(
      userId,
      startDate,
      endDate,
    );

    // 4. Calculate sums
    let consumedCalories = 0;
    let consumedWaterMl = 0;
    let consumedProteinG = 0;
    let consumedFatG = 0;
    let consumedCarbsG = 0;

    for (const entry of entries) {
      consumedCalories += entry.calories || 0;
      consumedWaterMl += entry.waterMl || 0;
      consumedProteinG += entry.proteinG ? Number(entry.proteinG) : 0;
      consumedFatG += entry.fatG ? Number(entry.fatG) : 0;
      consumedCarbsG += entry.carbsG ? Number(entry.carbsG) : 0;
    }

    const userWeight = profile ? Number(profile.weightKg) : 70;
    const workoutCaloriesBurned = completedWorkouts.reduce((sum, w) => {
      const telemetry = WorkoutTelemetryCalculator.calculateSessionTelemetry({
        startedAt: w.startedAt || w.createdAt,
        completedAt: w.completedAt,
        exercises: (w.exercises || []).map((e) => {
          const isCardio = Boolean(
            e.equipment === 'TREADMILL' ||
            e.equipment === 'STATIONARY_BIKE' ||
            e.equipment === 'STAIR_MASTER' ||
            e.equipment === 'ROWING_MACHINE' ||
            e.equipment === 'ELLIPTICAL' ||
            e.primaryMuscle === 'CARDIO' ||
            (e.exerciseName && (
              e.exerciseName.toLowerCase().includes('treadmill') ||
              e.exerciseName.toLowerCase().includes('cardio') ||
              e.exerciseName.toLowerCase().includes('sepeda') ||
              e.exerciseName.toLowerCase().includes('bike') ||
              e.exerciseName.toLowerCase().includes('lari') ||
              e.exerciseName.toLowerCase().includes('running')
            ))
          );

          return {
            startedAt: e.startedAt,
            completedAt: e.completedAt,
            isCardio,
            sets: (e.sets || []).map((s) => ({
              durationSeconds: s.durationSeconds,
              restSeconds: s.restSeconds,
              weightKg: s.weightKg,
              reps: s.reps,
              isCompleted: s.isCompleted,
              isCardio,
              speedKmh: Number(s.speedKmh) || 4.8,
              inclinePct: Number(s.inclinePct) || 0,
              caloriesBurned: s.caloriesBurned ? Number(s.caloriesBurned) : undefined,
            })),
          };
        }),
        userWeightKg: userWeight,
      });
      return sum + (telemetry.estimatedCaloriesBurned || 0);
    }, 0);

    const netCalories = Math.max(0, consumedCalories - workoutCaloriesBurned);
    const remainingCalories = targetCalories - consumedCalories + workoutCaloriesBurned;

    return {
      date: formattedDate,
      targetCalories,
      consumedCalories,
      workoutCaloriesBurned,
      netCalories,
      remainingCalories,

      targetWaterMl,
      consumedWaterMl,
      remainingWaterMl: targetWaterMl - consumedWaterMl,

      targetProteinG,
      consumedProteinG: Math.round(consumedProteinG),
      remainingProteinG: Math.max(0, targetProteinG - Math.round(consumedProteinG)),

      targetFatG,
      consumedFatG: Math.round(consumedFatG),
      remainingFatG: Math.max(0, targetFatG - Math.round(consumedFatG)),

      targetCarbsG,
      consumedCarbsG: Math.round(consumedCarbsG),
      remainingCarbsG: Math.max(0, targetCarbsG - Math.round(consumedCarbsG)),

      entries,
    };
  }
}
