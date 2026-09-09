import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  USER_PROFILE_REPOSITORY,
  type IUserProfileRepository,
} from '../../domain/repositories/user-profile.repository.interface';
import {
  DAILY_CALORIE_TARGET_REPOSITORY,
  type IDailyCalorieTargetRepository,
} from '../../domain/repositories/daily-calorie-target.repository.interface';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository.interface';
import { calculateBmr } from '../../domain/calculators/bmr.calculator';
import { calculateTdee } from '../../domain/calculators/tdee.calculator';
import { calculateCalorieTarget } from '../../domain/calculators/calorie-target.calculator';
import { DietPace } from '../../domain/enums/diet-pace.enum';
import type {
  UpsertProfileDto,
  ProfileResponseDto,
} from '../../modules/profile/schemas';

@Injectable()
export class UpsertProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profileRepository: IUserProfileRepository,
    @Inject(DAILY_CALORIE_TARGET_REPOSITORY)
    private readonly calorieTargetRepository: IDailyCalorieTargetRepository,
  ) {}

  async execute(
    userId: string,
    dto: UpsertProfileDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        message: 'User account not found',
        code: 'USER_NOT_FOUND',
        errors: [],
      });
    }

    const dietPace = dto.dietPace ?? DietPace.STANDARD;
    const checkInIntervalDays = dto.checkInIntervalDays ?? 30;

    // 1. Save / Update User Profile
    const profile = await this.profileRepository.upsert({
      userId,
      age: dto.age,
      gender: dto.gender,
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      activityLevel: dto.activityLevel,
      fitnessGoal: dto.fitnessGoal,
      dietPace,
      checkInIntervalDays,
    });

    // 2. Calculate BMR, TDEE, Calorie Target & Macros
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

    const targetResult = calculateCalorieTarget({
      tdee,
      weightKg: profile.weightKg,
      fitnessGoal: profile.fitnessGoal,
      dietPace: profile.dietPace,
    });

    // 3. Auto-sync today's DailyCalorieTarget
    const today = new Date();
    await this.calorieTargetRepository.upsert({
      userId,
      date: today,
      bmr,
      activityFactor,
      tdee,
      fitnessGoal: profile.fitnessGoal,
      dietPace: profile.dietPace,
      goalAdjustment: targetResult.goalAdjustment,
      targetCalories: targetResult.targetCalories,
      proteinGrams: targetResult.proteinGrams,
      carbsGrams: targetResult.carbsGrams,
      fatGrams: targetResult.fatGrams,
    });

    const needsUpdate = profile.isCheckInDue(today);
    const daysSinceLastUpdate = profile.daysSinceLastUpdate(today);

    return {
      id: profile.id,
      userId: profile.userId,
      age: profile.age,
      gender: profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
      fitnessGoal: profile.fitnessGoal,
      dietPace: profile.dietPace,
      checkInIntervalDays: profile.checkInIntervalDays,
      checkInStatus: {
        needsUpdate,
        daysSinceLastUpdate,
        checkInIntervalDays: profile.checkInIntervalDays,
        message: needsUpdate
          ? `Sudah ${daysSinceLastUpdate} hari sejak update profil terakhir. Timbang berat badan Anda untuk kalibrasi target kalori yang lebih akurat.`
          : `Profil aktif dan target kalori telah diperbarui. Update berikutnya dalam ${Math.max(0, profile.checkInIntervalDays - daysSinceLastUpdate)} hari.`,
      },
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
