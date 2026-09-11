import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExerciseData,
  FindExercisesFilter,
  IExerciseRepository,
  PaginatedResult,
  UpdateExerciseData,
} from '../../../domain/repositories/exercise.repository.interface';
import { ExerciseEntity } from '../../../domain/entities/exercise.entity';
import { MuscleGroupEntity } from '../../../domain/entities/muscle-group.entity';
import { EquipmentCategory, ExerciseType } from '../../../domain/enums/exercise.enums';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaExerciseRepository implements IExerciseRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapMuscleGroupToEntity(raw: {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    orderIndex: number;
    isDeleted: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): MuscleGroupEntity {
    return new MuscleGroupEntity({
      id: raw.id,
      name: raw.name,
      displayName: raw.displayName,
      description: raw.description,
      orderIndex: raw.orderIndex,
      isDeleted: raw.isDeleted,
      deletedAt: raw.deletedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  private mapExerciseToEntity(raw: {
    id: string;
    userId: string | null;
    name: string;
    description: string | null;
    equipment: string;
    exerciseType: string;
    primaryMuscleGroupId: string;
    isCustom: boolean;
    isActive: boolean;
    isDeleted: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    primaryMuscleGroup?: {
      id: string;
      name: string;
      displayName: string;
      description: string | null;
      orderIndex: number;
      isDeleted: boolean;
      deletedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }): ExerciseEntity {
    return new ExerciseEntity({
      id: raw.id,
      userId: raw.userId,
      name: raw.name,
      description: raw.description,
      equipment: raw.equipment as EquipmentCategory,
      exerciseType: raw.exerciseType as ExerciseType,
      primaryMuscleGroupId: raw.primaryMuscleGroupId,
      isCustom: raw.isCustom,
      isActive: raw.isActive,
      isDeleted: raw.isDeleted,
      deletedAt: raw.deletedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      primaryMuscleGroup: raw.primaryMuscleGroup
        ? this.mapMuscleGroupToEntity(raw.primaryMuscleGroup)
        : undefined,
    });
  }

  async findAllPaginated(filter: FindExercisesFilter): Promise<PaginatedResult<ExerciseEntity>> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, filter.limit || 8);
    const skip = (page - 1) * limit;

    const where: Prisma.ExerciseWhereInput = {
      isDeleted: false,
    };

    // Access control: shared system movements (userId: null) OR user's custom exercises
    if (filter.userId) {
      where.OR = [{ userId: null }, { userId: filter.userId }];
    } else {
      where.userId = null;
    }

    if (filter.isCustom !== undefined) {
      where.isCustom = filter.isCustom;
    }

    if (filter.equipment && (filter.equipment as string) !== 'ALL') {
      where.equipment = filter.equipment as Prisma.EnumEquipmentCategoryFilter['equals'];
    }

    if (filter.muscleGroupId) {
      where.primaryMuscleGroupId = filter.muscleGroupId;
    } else if (filter.muscleGroupName && filter.muscleGroupName !== 'ALL') {
      where.primaryMuscleGroup = {
        name: filter.muscleGroupName,
      };
    }

    if (filter.search && filter.search.trim() !== '') {
      const searchTrimmed = filter.search.trim();
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { name: { contains: searchTrimmed, mode: 'insensitive' } },
            { description: { contains: searchTrimmed, mode: 'insensitive' } },
            { primaryMuscleGroup: { displayName: { contains: searchTrimmed, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const [totalItems, rawItems] = await Promise.all([
      this.prisma.exercise.count({ where }),
      this.prisma.exercise.findMany({
        where,
        include: {
          primaryMuscleGroup: true,
        },
        orderBy: [
          { isCustom: 'desc' },
          { name: 'asc' },
        ],
        skip,
        take: limit,
      }),
    ]);

    const items = rawItems.map((item) => this.mapExerciseToEntity(item));
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      items,
      page,
      limit,
      totalItems,
      totalPages,
    };
  }

  async findById(id: string): Promise<ExerciseEntity | null> {
    const raw = await this.prisma.exercise.findFirst({
      where: { id, isDeleted: false },
      include: { primaryMuscleGroup: true },
    });

    return raw ? this.mapExerciseToEntity(raw) : null;
  }

  async findByNameAndUser(name: string, userId?: string | null): Promise<ExerciseEntity | null> {
    const raw = await this.prisma.exercise.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        userId: userId ?? null,
        isDeleted: false,
      },
      include: { primaryMuscleGroup: true },
    });

    return raw ? this.mapExerciseToEntity(raw) : null;
  }

  async create(data: CreateExerciseData): Promise<ExerciseEntity> {
    const raw = await this.prisma.exercise.create({
      data: {
        userId: data.userId ?? null,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        equipment: data.equipment,
        exerciseType: data.exerciseType ?? 'STRENGTH',
        primaryMuscleGroupId: data.primaryMuscleGroupId,
        isCustom: data.isCustom ?? Boolean(data.userId),
        isActive: true,
      },
      include: { primaryMuscleGroup: true },
    });

    return this.mapExerciseToEntity(raw);
  }

  async update(id: string, data: UpdateExerciseData): Promise<ExerciseEntity> {
    const raw = await this.prisma.exercise.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.equipment && { equipment: data.equipment }),
        ...(data.exerciseType && { exerciseType: data.exerciseType }),
        ...(data.primaryMuscleGroupId && { primaryMuscleGroupId: data.primaryMuscleGroupId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { primaryMuscleGroup: true },
    });

    return this.mapExerciseToEntity(raw);
  }

  async softDelete(id: string): Promise<ExerciseEntity> {
    const raw = await this.prisma.exercise.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
      include: { primaryMuscleGroup: true },
    });

    return this.mapExerciseToEntity(raw);
  }

  async getMuscleGroups(): Promise<MuscleGroupEntity[]> {
    const raw = await this.prisma.muscleGroup.findMany({
      where: { isDeleted: false },
      orderBy: { orderIndex: 'asc' },
    });

    return raw.map((item) => this.mapMuscleGroupToEntity(item));
  }

  async findMuscleGroupById(id: string): Promise<MuscleGroupEntity | null> {
    const raw = await this.prisma.muscleGroup.findFirst({
      where: { id, isDeleted: false },
    });

    return raw ? this.mapMuscleGroupToEntity(raw) : null;
  }

  async findMuscleGroupByName(name: string): Promise<MuscleGroupEntity | null> {
    const raw = await this.prisma.muscleGroup.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        isDeleted: false,
      },
    });

    return raw ? this.mapMuscleGroupToEntity(raw) : null;
  }
}
