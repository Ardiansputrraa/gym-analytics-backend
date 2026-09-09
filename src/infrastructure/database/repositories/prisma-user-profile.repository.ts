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
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
