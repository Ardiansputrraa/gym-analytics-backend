import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IBodyMeasurementRepository,
  BODY_MEASUREMENT_REPOSITORY_TOKEN,
} from '../../domain/repositories/body-measurement.repository.interface';
import {
  IUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from '../../domain/repositories/user-profile.repository.interface';
import {
  IDailyCalorieTargetRepository,
  DAILY_CALORIE_TARGET_REPOSITORY,
} from '../../domain/repositories/daily-calorie-target.repository.interface';
import { BodyCompositionCalculator } from '../../domain/calculators/body-composition.calculator';
import { calculateBmr } from '../../domain/calculators/bmr.calculator';
import { calculateTdee } from '../../domain/calculators/tdee.calculator';
import { calculateCalorieTarget } from '../../domain/calculators/calorie-target.calculator';
import { BodyMeasurementEntity } from '../../domain/entities/body-measurement.entity';

export interface LogBodyMeasurementInput {
  userId: string;
  measuredAt?: Date;
  receiptNumber?: string;
  weightKg: number;
  skeletalMuscleKg?: number | null;
  bodyFatKg?: number | null;
  bodyFatPct?: number | null;
  fatFreeMassKg?: number | null;
  waterContentKg?: number | null;
  proteinKg?: number | null;
  mineralKg?: number | null;
  notes?: string;
}

@Injectable()
export class LogBodyMeasurementUseCase {
  constructor(
    @Inject(BODY_MEASUREMENT_REPOSITORY_TOKEN)
    private readonly bodyMeasurementRepository: IBodyMeasurementRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profileRepository: IUserProfileRepository,
    @Inject(DAILY_CALORIE_TARGET_REPOSITORY)
    private readonly calorieTargetRepository: IDailyCalorieTargetRepository,
  ) {}

  async execute(input: LogBodyMeasurementInput): Promise<BodyMeasurementEntity> {
    const measuredDate = input.measuredAt ? new Date(input.measuredAt) : new Date();

    // 1. Fetch user profile for biometric baseline (height & gender)
    const profile = await this.profileRepository.findByUserId(input.userId);
    const heightCm = profile ? profile.heightCm : 170;

    // 2. Compute derivatives (Body Fat Kg, Fat Free Mass Kg, BMI)
    const derivatives = BodyCompositionCalculator.calculateDerivatives(
      input.weightKg,
      heightCm,
      input.bodyFatKg,
      input.bodyFatPct,
      input.fatFreeMassKg,
    );

    // 3. Find previous measurement to evaluate deltas and progress
    const previous = await this.bodyMeasurementRepository.findPrevious(
      input.userId,
      measuredDate,
    );

    const progress = BodyCompositionCalculator.evaluateProgress(
      {
        weightKg: input.weightKg,
        skeletalMuscleKg: input.skeletalMuscleKg,
        bodyFatKg: derivatives.bodyFatKg,
        bodyFatPct: derivatives.bodyFatPct,
        waterContentKg: input.waterContentKg,
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

    // 4. Save body measurement
    const measurement = await this.bodyMeasurementRepository.create({
      userId: input.userId,
      measuredAt: measuredDate,
      receiptNumber: input.receiptNumber,
      weightKg: input.weightKg,
      skeletalMuscleKg: input.skeletalMuscleKg,
      bodyFatKg: derivatives.bodyFatKg,
      bodyFatPct: derivatives.bodyFatPct,
      fatFreeMassKg: derivatives.fatFreeMassKg,
      waterContentKg: input.waterContentKg,
      proteinKg: input.proteinKg,
      mineralKg: input.mineralKg,
      bmi: derivatives.bmi,
      status: progress.status,
      evaluation: progress.evaluation,
      notes: input.notes,
    });

    // 5. Check if this is the newest measurement -> Auto-sync to UserProfile & Calorie Targets
    const latest = await this.bodyMeasurementRepository.findLatestByUserId(input.userId);
    if (latest && latest.id === measurement.id && profile) {
      const updatedProfile = await this.profileRepository.upsert({
        userId: input.userId,
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: measurement.weightKg,
        activityLevel: profile.activityLevel,
        fitnessGoal: profile.fitnessGoal,
        dietPace: profile.dietPace,
        checkInIntervalDays: profile.checkInIntervalDays,
        skeletalMuscleKg: measurement.skeletalMuscleKg ?? profile.skeletalMuscleKg,
        bodyFatKg: measurement.bodyFatKg ?? profile.bodyFatKg,
        bodyFatPct: measurement.bodyFatPct ?? profile.bodyFatPct,
        fatFreeMassKg: measurement.fatFreeMassKg ?? profile.fatFreeMassKg,
        waterContentKg: measurement.waterContentKg ?? profile.waterContentKg,
        proteinKg: measurement.proteinKg ?? profile.proteinKg,
        mineralKg: measurement.mineralKg ?? profile.mineralKg,
      });

      // Recalculate today's calorie targets with new weight
      const bmr = calculateBmr({
        weightKg: updatedProfile.weightKg,
        heightCm: updatedProfile.heightCm,
        age: updatedProfile.age,
        gender: updatedProfile.gender,
      });

      const { tdee, activityFactor } = calculateTdee({
        bmr,
        activityLevel: updatedProfile.activityLevel,
      });

      const calorieTarget = calculateCalorieTarget({
        tdee,
        fitnessGoal: updatedProfile.fitnessGoal,
        dietPace: updatedProfile.dietPace,
        weightKg: updatedProfile.weightKg,
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await this.calorieTargetRepository.upsert({
        userId: input.userId,
        date: today,
        bmr,
        activityFactor,
        tdee,
        fitnessGoal: updatedProfile.fitnessGoal,
        dietPace: updatedProfile.dietPace,
        goalAdjustment: calorieTarget.goalAdjustment,
        targetCalories: calorieTarget.targetCalories,
        proteinGrams: calorieTarget.proteinGrams,
        carbsGrams: calorieTarget.carbsGrams,
        fatGrams: calorieTarget.fatGrams,
      });
    }

    return measurement;
  }
}
