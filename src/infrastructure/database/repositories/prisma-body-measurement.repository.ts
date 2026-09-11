import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  IBodyMeasurementRepository,
  CreateBodyMeasurementParams,
  UpdateBodyMeasurementParams,
  GetBodyMeasurementsParams,
  PaginatedBodyMeasurements,
} from '../../../domain/repositories/body-measurement.repository.interface';
import {
  BodyMeasurementEntity,
  BodyCompositionStatus,
} from '../../../domain/entities/body-measurement.entity';

@Injectable()
export class PrismaBodyMeasurementRepository implements IBodyMeasurementRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(raw: any): BodyMeasurementEntity {
    return {
      id: raw.id,
      userId: raw.userId,
      measuredAt: raw.measuredAt,
      receiptNumber: raw.receiptNumber || null,
      weightKg: Number(raw.weightKg),
      skeletalMuscleKg: raw.skeletalMuscleKg !== null ? Number(raw.skeletalMuscleKg) : null,
      bodyFatKg: raw.bodyFatKg !== null ? Number(raw.bodyFatKg) : null,
      bodyFatPct: raw.bodyFatPct !== null ? Number(raw.bodyFatPct) : null,
      fatFreeMassKg: raw.fatFreeMassKg !== null ? Number(raw.fatFreeMassKg) : null,
      waterContentKg: raw.waterContentKg !== null ? Number(raw.waterContentKg) : null,
      proteinKg: raw.proteinKg !== null ? Number(raw.proteinKg) : null,
      mineralKg: raw.mineralKg !== null ? Number(raw.mineralKg) : null,
      bmi: raw.bmi !== null ? Number(raw.bmi) : null,
      status: raw.status as BodyCompositionStatus | null,
      evaluation: raw.evaluation || null,
      notes: raw.notes || null,
      isDeleted: raw.isDeleted,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  async create(params: CreateBodyMeasurementParams): Promise<BodyMeasurementEntity> {
    const created = await this.prisma.bodyMeasurement.create({
      data: {
        userId: params.userId,
        measuredAt: params.measuredAt,
        receiptNumber: params.receiptNumber || null,
        weightKg: new Prisma.Decimal(params.weightKg),
        skeletalMuscleKg: params.skeletalMuscleKg !== undefined && params.skeletalMuscleKg !== null
          ? new Prisma.Decimal(params.skeletalMuscleKg)
          : null,
        bodyFatKg: params.bodyFatKg !== undefined && params.bodyFatKg !== null
          ? new Prisma.Decimal(params.bodyFatKg)
          : null,
        bodyFatPct: params.bodyFatPct !== undefined && params.bodyFatPct !== null
          ? new Prisma.Decimal(params.bodyFatPct)
          : null,
        fatFreeMassKg: params.fatFreeMassKg !== undefined && params.fatFreeMassKg !== null
          ? new Prisma.Decimal(params.fatFreeMassKg)
          : null,
        waterContentKg: params.waterContentKg !== undefined && params.waterContentKg !== null
          ? new Prisma.Decimal(params.waterContentKg)
          : null,
        proteinKg: params.proteinKg !== undefined && params.proteinKg !== null
          ? new Prisma.Decimal(params.proteinKg)
          : null,
        mineralKg: params.mineralKg !== undefined && params.mineralKg !== null
          ? new Prisma.Decimal(params.mineralKg)
          : null,
        bmi: params.bmi !== undefined && params.bmi !== null
          ? new Prisma.Decimal(params.bmi)
          : null,
        status: params.status || 'MAINTENANCE',
        evaluation: params.evaluation || null,
        notes: params.notes || null,
      },
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<BodyMeasurementEntity | null> {
    const raw = await this.prisma.bodyMeasurement.findUnique({
      where: { id },
    });

    if (!raw || raw.isDeleted) return null;
    return this.mapToEntity(raw);
  }

  async findLatestByUserId(userId: string): Promise<BodyMeasurementEntity | null> {
    const raw = await this.prisma.bodyMeasurement.findFirst({
      where: {
        userId,
        isDeleted: false,
      },
      orderBy: [
        { measuredAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    if (!raw) return null;
    return this.mapToEntity(raw);
  }

  async findPrevious(
    userId: string,
    beforeDate: Date,
    excludeId?: string,
  ): Promise<BodyMeasurementEntity | null> {
    const where: Prisma.BodyMeasurementWhereInput = {
      userId,
      isDeleted: false,
      measuredAt: {
        lt: beforeDate,
      },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const raw = await this.prisma.bodyMeasurement.findFirst({
      where,
      orderBy: [
        { measuredAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    if (!raw) return null;
    return this.mapToEntity(raw);
  }

  async findHistoryByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BodyMeasurementEntity[]> {
    const records = await this.prisma.bodyMeasurement.findMany({
      where: {
        userId,
        measuredAt: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
      orderBy: [
        { measuredAt: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return records.map((r) => this.mapToEntity(r));
  }

  async findAllByUserId(params: GetBodyMeasurementsParams): Promise<PaginatedBodyMeasurements> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.BodyMeasurementWhereInput = {
      userId: params.userId,
      isDeleted: false,
    };

    if (params.startDate || params.endDate) {
      where.measuredAt = {};
      if (params.startDate) where.measuredAt.gte = params.startDate;
      if (params.endDate) where.measuredAt.lte = params.endDate;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { receiptNumber: { contains: q, mode: 'insensitive' } },
        { evaluation: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [totalItems, items] = await Promise.all([
      this.prisma.bodyMeasurement.count({ where }),
      this.prisma.bodyMeasurement.findMany({
        where,
        orderBy: [
          { measuredAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
    ]);

    return {
      items: items.map((i) => this.mapToEntity(i)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  async update(id: string, params: UpdateBodyMeasurementParams): Promise<BodyMeasurementEntity> {
    const data: Prisma.BodyMeasurementUpdateInput = {};

    if (params.measuredAt !== undefined) data.measuredAt = params.measuredAt;
    if (params.receiptNumber !== undefined) data.receiptNumber = params.receiptNumber;
    if (params.weightKg !== undefined) data.weightKg = new Prisma.Decimal(params.weightKg);
    if (params.skeletalMuscleKg !== undefined) {
      data.skeletalMuscleKg = params.skeletalMuscleKg !== null ? new Prisma.Decimal(params.skeletalMuscleKg) : null;
    }
    if (params.bodyFatKg !== undefined) {
      data.bodyFatKg = params.bodyFatKg !== null ? new Prisma.Decimal(params.bodyFatKg) : null;
    }
    if (params.bodyFatPct !== undefined) {
      data.bodyFatPct = params.bodyFatPct !== null ? new Prisma.Decimal(params.bodyFatPct) : null;
    }
    if (params.fatFreeMassKg !== undefined) {
      data.fatFreeMassKg = params.fatFreeMassKg !== null ? new Prisma.Decimal(params.fatFreeMassKg) : null;
    }
    if (params.waterContentKg !== undefined) {
      data.waterContentKg = params.waterContentKg !== null ? new Prisma.Decimal(params.waterContentKg) : null;
    }
    if (params.proteinKg !== undefined) {
      data.proteinKg = params.proteinKg !== null ? new Prisma.Decimal(params.proteinKg) : null;
    }
    if (params.mineralKg !== undefined) {
      data.mineralKg = params.mineralKg !== null ? new Prisma.Decimal(params.mineralKg) : null;
    }
    if (params.bmi !== undefined) {
      data.bmi = params.bmi !== null ? new Prisma.Decimal(params.bmi) : null;
    }
    if (params.status !== undefined) data.status = params.status;
    if (params.evaluation !== undefined) data.evaluation = params.evaluation;
    if (params.notes !== undefined) data.notes = params.notes;

    const updated = await this.prisma.bodyMeasurement.update({
      where: { id },
      data,
    });

    return this.mapToEntity(updated);
  }

  async softDelete(id: string): Promise<boolean> {
    await this.prisma.bodyMeasurement.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    return true;
  }
}
