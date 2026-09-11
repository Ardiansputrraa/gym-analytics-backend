import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  INutritionRepository,
  CreateNutritionEntryData,
  UpdateNutritionEntryData,
} from '../../../domain/repositories/nutrition.repository.interface';
import { NutritionEntryEntity } from '../../../domain/entities/nutrition-entry.entity';
import { NutritionType } from '../../../domain/enums/nutrition-type.enum';

@Injectable()
export class PrismaNutritionRepository implements INutritionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(raw: any): NutritionEntryEntity {
    return {
      id: raw.id,
      userId: raw.userId,
      consumedAt: raw.consumedAt,
      type: raw.type as NutritionType,
      name: raw.name,
      calories: raw.calories,
      quantity: Number(raw.quantity),
      unit: raw.unit,
      proteinG: raw.proteinG !== null ? Number(raw.proteinG) : null,
      carbsG: raw.carbsG !== null ? Number(raw.carbsG) : null,
      fatG: raw.fatG !== null ? Number(raw.fatG) : null,
      waterMl: raw.waterMl !== null ? Number(raw.waterMl) : null,
      notes: raw.notes,
      isDeleted: raw.isDeleted,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  async create(data: CreateNutritionEntryData): Promise<NutritionEntryEntity> {
    const created = await this.prisma.nutritionEntry.create({
      data: {
        userId: data.userId,
        consumedAt: data.consumedAt,
        type: data.type,
        name: data.name,
        calories: data.calories,
        quantity: data.quantity ?? 1,
        unit: data.unit ?? 'porsi',
        proteinG: data.proteinG ?? null,
        carbsG: data.carbsG ?? null,
        fatG: data.fatG ?? null,
        waterMl: data.waterMl ?? null,
        notes: data.notes ?? null,
      },
    });

    return this.toEntity(created);
  }

  async findById(id: string): Promise<NutritionEntryEntity | null> {
    const entry = await this.prisma.nutritionEntry.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!entry) return null;
    return this.toEntity(entry);
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<NutritionEntryEntity[]> {
    const entries = await this.prisma.nutritionEntry.findMany({
      where: {
        userId,
        consumedAt: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
      orderBy: {
        consumedAt: 'asc',
      },
    });

    return entries.map((e) => this.toEntity(e));
  }

  async update(id: string, data: UpdateNutritionEntryData): Promise<NutritionEntryEntity> {
    const updated = await this.prisma.nutritionEntry.update({
      where: { id },
      data: {
        ...(data.consumedAt ? { consumedAt: data.consumedAt } : {}),
        ...(data.type ? { type: data.type } : {}),
        ...(data.name ? { name: data.name } : {}),
        ...(data.calories !== undefined ? { calories: data.calories } : {}),
        ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
        ...(data.unit !== undefined ? { unit: data.unit } : {}),
        ...(data.proteinG !== undefined ? { proteinG: data.proteinG } : {}),
        ...(data.carbsG !== undefined ? { carbsG: data.carbsG } : {}),
        ...(data.fatG !== undefined ? { fatG: data.fatG } : {}),
        ...(data.waterMl !== undefined ? { waterMl: data.waterMl } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });

    return this.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.nutritionEntry.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
