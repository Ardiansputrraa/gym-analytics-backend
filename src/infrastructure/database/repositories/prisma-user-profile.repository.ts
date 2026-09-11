import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  UpsertUserProfileData,
  IUserProfileRepository,
} from '../../../domain/repositories/user-profile.repository.interface';
import { UserProfileEntity } from '../../../domain/entities/user-profile.entity';
import { Gender } from '../../../domain/enums/gender.enum';
import { ActivityLevel } from '../../../domain/enums/activity-level.enum';
import { FitnessGoal } from '../../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../../domain/enums/diet-pace.enum';
import { UserProfile as PrismaUserProfile } from '@prisma/client';

@Injectable()
export class PrismaUserProfileRepository implements IUserProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(data: UpsertUserProfileData): Promise<UserProfileEntity> {
    const record = await this.prisma.userProfile.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        age: data.age,
        gender: data.gender,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        activityLevel: data.activityLevel,
        fitnessGoal: data.fitnessGoal,
        dietPace: data.dietPace ?? DietPace.STANDARD,
        checkInIntervalDays: data.checkInIntervalDays ?? 30,
        skeletalMuscleKg: data.skeletalMuscleKg !== undefined ? data.skeletalMuscleKg : undefined,
        bodyFatPct: data.bodyFatPct !== undefined ? data.bodyFatPct : undefined,
        bodyFatKg: data.bodyFatKg !== undefined ? data.bodyFatKg : undefined,
        fatFreeMassKg: data.fatFreeMassKg !== undefined ? data.fatFreeMassKg : undefined,
        waterContentKg: data.waterContentKg !== undefined ? data.waterContentKg : undefined,
        proteinKg: data.proteinKg !== undefined ? data.proteinKg : undefined,
        mineralKg: data.mineralKg !== undefined ? data.mineralKg : undefined,
      },
      update: {
        age: data.age,
        gender: data.gender,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        activityLevel: data.activityLevel,
        fitnessGoal: data.fitnessGoal,
        dietPace: data.dietPace ?? DietPace.STANDARD,
        checkInIntervalDays: data.checkInIntervalDays ?? 30,
        skeletalMuscleKg: data.skeletalMuscleKg !== undefined ? data.skeletalMuscleKg : undefined,
        bodyFatPct: data.bodyFatPct !== undefined ? data.bodyFatPct : undefined,
        bodyFatKg: data.bodyFatKg !== undefined ? data.bodyFatKg : undefined,
        fatFreeMassKg: data.fatFreeMassKg !== undefined ? data.fatFreeMassKg : undefined,
        waterContentKg: data.waterContentKg !== undefined ? data.waterContentKg : undefined,
        proteinKg: data.proteinKg !== undefined ? data.proteinKg : undefined,
        mineralKg: data.mineralKg !== undefined ? data.mineralKg : undefined,
      },
    });

    return this.toEntity(record);
  }

  async findByUserId(userId: string): Promise<UserProfileEntity | null> {
    const record = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    return record ? this.toEntity(record) : null;
  }

  private toEntity(record: PrismaUserProfile): UserProfileEntity {
    return new UserProfileEntity({
      id: record.id,
      userId: record.userId,
      age: record.age,
      gender: record.gender as Gender,
      heightCm: Number(record.heightCm),
      weightKg: Number(record.weightKg),
      activityLevel: record.activityLevel as ActivityLevel,
      fitnessGoal: record.fitnessGoal as FitnessGoal,
      dietPace: record.dietPace as DietPace,
      checkInIntervalDays: record.checkInIntervalDays,
      skeletalMuscleKg: record.skeletalMuscleKg !== null && record.skeletalMuscleKg !== undefined ? Number(record.skeletalMuscleKg) : null,
      bodyFatPct: record.bodyFatPct !== null && record.bodyFatPct !== undefined ? Number(record.bodyFatPct) : null,
      bodyFatKg: record.bodyFatKg !== null && record.bodyFatKg !== undefined ? Number(record.bodyFatKg) : null,
      fatFreeMassKg: record.fatFreeMassKg !== null && record.fatFreeMassKg !== undefined ? Number(record.fatFreeMassKg) : null,
      waterContentKg: record.waterContentKg !== null && record.waterContentKg !== undefined ? Number(record.waterContentKg) : null,
      proteinKg: record.proteinKg !== null && record.proteinKg !== undefined ? Number(record.proteinKg) : null,
      mineralKg: record.mineralKg !== null && record.mineralKg !== undefined ? Number(record.mineralKg) : null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
