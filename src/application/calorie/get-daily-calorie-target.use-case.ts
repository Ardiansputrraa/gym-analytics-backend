import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  DAILY_CALORIE_TARGET_REPOSITORY,
  type IDailyCalorieTargetRepository,
} from '../../domain/repositories/daily-calorie-target.repository.interface';
import {
  USER_PROFILE_REPOSITORY,
  type IUserProfileRepository,
} from '../../domain/repositories/user-profile.repository.interface';
import { calculateBmr } from '../../domain/calculators/bmr.calculator';
import { calculateTdee } from '../../domain/calculators/tdee.calculator';
import { calculateCalorieTarget } from '../../domain/calculators/calorie-target.calculator';
import type { DailyCalorieTargetResponseDto } from '../../modules/calorie/schemas';

@Injectable()
export class GetDailyCalorieTargetUseCase {
  constructor(
    @Inject(DAILY_CALORIE_TARGET_REPOSITORY)
    private readonly calorieTargetRepository: IDailyCalorieTargetRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profileRepository: IUserProfileRepository,
  ) {}

  async execute(
    userId: string,
    targetDate = new Date(),
  ): Promise<DailyCalorieTargetResponseDto> {
    // 1. Look up existing target for the date
    const existing = await this.calorieTargetRepository.findByUserAndDate(
      userId,
      targetDate,
    );

    if (existing) {
      return {
        id: existing.id,
        userId: existing.userId,
        date: existing.date.toISOString().split('T')[0],
        bmr: existing.bmr,
        activityFactor: existing.activityFactor,
        tdee: existing.tdee,
        fitnessGoal: existing.fitnessGoal,
        dietPace: existing.dietPace,
        goalAdjustment: existing.goalAdjustment,
        targetCalories: existing.targetCalories,
        proteinGrams: existing.proteinGrams,
        carbsGrams: existing.carbsGrams,
        fatGrams: existing.fatGrams,
      };
    }

    // 2. If no target for this date, look up active profile
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({
        message:
          'Target kalori belum ditemukan. Silakan lengkapi profil pengguna Anda terlebih dahulu.',
        code: 'PROFILE_REQUIRED',
        errors: [],
      });
    }

    // 3. Auto-calculate and store snapshot for targetDate
    const bmr = calculateBmr({
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      age: profile.age,
      gender: profile.gender,
    });

    const { tdee, activityFactor } = calculateTdee({
      bmr,
      activityLevel: profile.activityLevel,
    });

    const result = calculateCalorieTarget({
      tdee,
      weightKg: profile.weightKg,
      fitnessGoal: profile.fitnessGoal,
      dietPace: profile.dietPace,
    });

    const saved = await this.calorieTargetRepository.upsert({
      userId,
      date: targetDate,
      bmr,
      activityFactor,
      tdee,
      fitnessGoal: profile.fitnessGoal,
      dietPace: profile.dietPace,
      goalAdjustment: result.goalAdjustment,
      targetCalories: result.targetCalories,
      proteinGrams: result.proteinGrams,
      carbsGrams: result.carbsGrams,
      fatGrams: result.fatGrams,
    });

    return {
      id: saved.id,
      userId: saved.userId,
      date: saved.date.toISOString().split('T')[0],
      bmr: saved.bmr,
      activityFactor: saved.activityFactor,
      tdee: saved.tdee,
      fitnessGoal: saved.fitnessGoal,
      dietPace: saved.dietPace,
      goalAdjustment: saved.goalAdjustment,
      targetCalories: saved.targetCalories,
      proteinGrams: saved.proteinGrams,
      carbsGrams: saved.carbsGrams,
      fatGrams: saved.fatGrams,
    };
  }
}
