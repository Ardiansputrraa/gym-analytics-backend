import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  UpsertDailyCalorieTargetData,
  IDailyCalorieTargetRepository,
} from '../../../domain/repositories/daily-calorie-target.repository.interface';
import { DailyCalorieTargetEntity } from '../../../domain/entities/daily-calorie-target.entity';
import { FitnessGoal } from '../../../domain/enums/fitness-goal.enum';
import { DietPace } from '../../../domain/enums/diet-pace.enum';
import { DailyCalorieTarget as PrismaDailyCalorieTarget } from '@prisma/client';

@Injectable()
export class PrismaDailyCalorieTargetRepository implements IDailyCalorieTargetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    data: UpsertDailyCalorieTargetData,
  ): Promise<DailyCalorieTargetEntity> {
    // Normalize date to calendar date (00:00:00 UTC)
    const normalizedDate = new Date(
      Date.UTC(
        data.date.getUTCFullYear(),
        data.date.getUTCMonth(),
        data.date.getUTCDate(),
      ),
    );

    const record = await this.prisma.dailyCalorieTarget.upsert({
      where: {
        uq_dct_user_date: {
          userId: data.userId,
          date: normalizedDate,
        },
      },
      create: {
        userId: data.userId,
        date: normalizedDate,
        bmr: data.bmr,
        activityFactor: data.activityFactor,
        tdee: data.tdee,
        fitnessGoal: data.fitnessGoal,
        dietPace: data.dietPace,
        goalAdjustment: data.goalAdjustment,
        targetCalories: data.targetCalories,
        proteinGrams: data.proteinGrams ?? null,
        carbsGrams: data.carbsGrams ?? null,
        fatGrams: data.fatGrams ?? null,
      },
      update: {
        bmr: data.bmr,
        activityFactor: data.activityFactor,
        tdee: data.tdee,
        fitnessGoal: data.fitnessGoal,
        dietPace: data.dietPace,
        goalAdjustment: data.goalAdjustment,
        targetCalories: data.targetCalories,
        proteinGrams: data.proteinGrams ?? null,
        carbsGrams: data.carbsGrams ?? null,
        fatGrams: data.fatGrams ?? null,
      },
    });

    return this.toEntity(record);
  }

  async findByUserAndDate(
    userId: string,
    date: Date,
  ): Promise<DailyCalorieTargetEntity | null> {
    const normalizedDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    const record = await this.prisma.dailyCalorieTarget.findUnique({
      where: {
        uq_dct_user_date: {
          userId,
          date: normalizedDate,
        },
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async findLatestByUserId(
    userId: string,
  ): Promise<DailyCalorieTargetEntity | null> {
    const record = await this.prisma.dailyCalorieTarget.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return record ? this.toEntity(record) : null;
  }

  private toEntity(record: PrismaDailyCalorieTarget): DailyCalorieTargetEntity {
    return new DailyCalorieTargetEntity({
      id: record.id,
      userId: record.userId,
      date: record.date,
      bmr: Number(record.bmr),
      activityFactor: Number(record.activityFactor),
      tdee: Number(record.tdee),
      fitnessGoal: record.fitnessGoal as FitnessGoal,
      dietPace: record.dietPace as DietPace,
      goalAdjustment: record.goalAdjustment,
      targetCalories: record.targetCalories,
      proteinGrams: record.proteinGrams,
      carbsGrams: record.carbsGrams,
      fatGrams: record.fatGrams,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
