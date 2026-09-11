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
import {
  BODY_MEASUREMENT_REPOSITORY_TOKEN,
  type IBodyMeasurementRepository,
} from '../../domain/repositories/body-measurement.repository.interface';
import { calculateBmr } from '../../domain/calculators/bmr.calculator';
import { calculateTdee } from '../../domain/calculators/tdee.calculator';
import { calculateCalorieTarget } from '../../domain/calculators/calorie-target.calculator';
import { BodyCompositionCalculator } from '../../domain/calculators/body-composition.calculator';
import { ActivityLevel } from '../../domain/enums/activity-level.enum';
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
    @Inject(BODY_MEASUREMENT_REPOSITORY_TOKEN)
    private readonly bodyMeasurementRepository: IBodyMeasurementRepository,
  ) {}

  async execute(
    userId: string,
    dto: UpsertProfileDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        message: 'Akun pengguna tidak ditemukan.',
        code: 'USER_NOT_FOUND',
        errors: [],
      });
    }

    let currentUser = user;
    if (dto.name !== undefined || dto.phone !== undefined) {
      currentUser = await this.userRepository.update(userId, {
        name: dto.name,
        phone: dto.phone,
      });
    }

    const dietPace = dto.dietPace ?? DietPace.STANDARD;
    const activityLevel = dto.activityLevel ?? ActivityLevel.SEDENTARY;
    const checkInIntervalDays = dto.checkInIntervalDays ?? 30;

    const computedBodyFatKg =
      dto.bodyFatKg !== undefined
        ? dto.bodyFatKg
        : dto.bodyFatPct && dto.weightKg
          ? Number(((dto.bodyFatPct / 100) * dto.weightKg).toFixed(2))
          : null;

    const computedBodyFatPct =
      dto.bodyFatPct !== undefined
        ? dto.bodyFatPct
        : dto.bodyFatKg && dto.weightKg
          ? Number(((dto.bodyFatKg / dto.weightKg) * 100).toFixed(2))
          : null;

    // 1. Save / Update User Profile
    const profile = await this.profileRepository.upsert({
      userId,
      age: dto.age,
      gender: dto.gender,
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      activityLevel,
      fitnessGoal: dto.fitnessGoal,
      dietPace,
      checkInIntervalDays,
      skeletalMuscleKg: dto.skeletalMuscleKg,
      bodyFatPct: computedBodyFatPct,
      bodyFatKg: computedBodyFatKg,
      fatFreeMassKg: dto.fatFreeMassKg,
      waterContentKg: dto.waterContentKg,
      proteinKg: dto.proteinKg,
      mineralKg: dto.mineralKg,
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

    // 4. Auto-sync and record BodyMeasurement in body composition history
    const derivatives = BodyCompositionCalculator.calculateDerivatives(
      dto.weightKg,
      dto.heightCm,
      computedBodyFatKg,
      computedBodyFatPct,
      dto.fatFreeMassKg,
    );

    const previous = await this.bodyMeasurementRepository.findPrevious(
      userId,
      today,
    );

    const progress = BodyCompositionCalculator.evaluateProgress(
      {
        weightKg: dto.weightKg,
        skeletalMuscleKg: dto.skeletalMuscleKg,
        bodyFatKg: derivatives.bodyFatKg,
        bodyFatPct: derivatives.bodyFatPct,
        waterContentKg: dto.waterContentKg,
      },
      previous
        ? {
            weightKg: previous.weightKg,
            skeletalMuscleKg: previous.skeletalMuscleKg,
            bodyFatKg: previous.bodyFatKg,
            bodyFatPct: previous.bodyFatPct,
            waterContentKg: previous.waterContentKg,
          }
        : null,
    );

    await this.bodyMeasurementRepository.create({
      userId,
      measuredAt: today,
      receiptNumber: undefined,
      weightKg: dto.weightKg,
      skeletalMuscleKg: dto.skeletalMuscleKg,
      bodyFatKg: derivatives.bodyFatKg,
      bodyFatPct: derivatives.bodyFatPct,
      fatFreeMassKg: derivatives.fatFreeMassKg,
      waterContentKg: dto.waterContentKg,
      proteinKg: dto.proteinKg,
      mineralKg: dto.mineralKg,
      bmi: derivatives.bmi,
      status: progress.status,
      evaluation: progress.evaluation,
      notes: 'Disinkronkan otomatis dari pembaruan profil',
    });

    const needsUpdate = profile.isCheckInDue(today);
    const daysSinceLastUpdate = profile.daysSinceLastUpdate(today);

    return {
      id: profile.id,
      userId: profile.userId,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        phone: currentUser.phone ?? null,
        isAdmin: currentUser.isAdmin,
      },
      profile: {
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
        skeletalMuscleKg: profile.skeletalMuscleKg,
        bodyFatPct: profile.bodyFatPct,
        bodyFatKg: profile.bodyFatKg,
        fatFreeMassKg: profile.fatFreeMassKg,
        waterContentKg: profile.waterContentKg,
        proteinKg: profile.proteinKg,
        mineralKg: profile.mineralKg,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
      age: profile.age,
      gender: profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
      fitnessGoal: profile.fitnessGoal,
      dietPace: profile.dietPace,
      checkInIntervalDays: profile.checkInIntervalDays,
      skeletalMuscleKg: profile.skeletalMuscleKg,
      bodyFatPct: profile.bodyFatPct,
      bodyFatKg: profile.bodyFatKg,
      fatFreeMassKg: profile.fatFreeMassKg,
      waterContentKg: profile.waterContentKg,
      proteinKg: profile.proteinKg,
      mineralKg: profile.mineralKg,
      checkInStatus: {
        needsUpdate,
        daysSinceLastUpdate,
        checkInIntervalDays: profile.checkInIntervalDays,
        message: needsUpdate
          ? `Sudah ${daysSinceLastUpdate} hari sejak update profil terakhir. Timbang berat badan Anda untuk kalibrasi target kalori yang lebih akurat.`
          : `Profil aktif dan target kalori telah diperbarui. Update berikutnya dalam ${Math.max(0, profile.checkInIntervalDays - daysSinceLastUpdate)} hari.`,
      },
      message: 'Profil fisik dan target kalori harian berhasil disimpan.',
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
