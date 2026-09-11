import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  IWorkoutRepository,
  CreateWorkoutParams,
  AddExerciseParams,
  AddSetParams,
  UpdateSetParams,
  WorkoutHistoryFilter,
  PaginatedWorkouts,
  WorkoutTelemetryAggregates,
} from '../../../domain/repositories/workout.repository.interface';
import {
  WorkoutEntity,
  WorkoutExerciseEntity,
  WorkoutSetEntity,
  RoutineTemplateEntity,
  PersonalRecordEntity,
} from '../../../domain/entities/workout.entity';
import { WorkoutStatus, WorkoutTimeframe, RecordType } from '../../../domain/enums/workout.enums';
import { WorkoutVolumeCalculator } from '../../../domain/calculators/workout-volume.calculator';
import { WorkoutTelemetryCalculator } from '../../../domain/calculators/workout-telemetry.calculator';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaWorkoutRepository implements IWorkoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapSetToEntity(raw: any): WorkoutSetEntity {
    return {
      id: raw.id,
      workoutExerciseId: raw.workoutExerciseId,
      orderIndex: raw.orderIndex,
      weightKg: raw.weightKg ? Number(raw.weightKg) : 0,
      reps: raw.reps || 0,
      durationSeconds: raw.durationSeconds || 0,
      restSeconds: raw.restSeconds || 0,
      inclinePct: raw.inclinePct !== null && raw.inclinePct !== undefined ? Number(raw.inclinePct) : null,
      speedKmh: raw.speedKmh !== null && raw.speedKmh !== undefined ? Number(raw.speedKmh) : null,
      distanceKm: raw.distanceKm !== null && raw.distanceKm !== undefined ? Number(raw.distanceKm) : null,
      caloriesBurned: raw.caloriesBurned || null,
      paceMinPerKm: raw.paceMinPerKm || null,
      isCompleted: Boolean(raw.isCompleted),
      completedAt: raw.completedAt || null,
      rpe: raw.rpe !== null && raw.rpe !== undefined ? Number(raw.rpe) : null,
      isDeleted: raw.isDeleted,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private mapExerciseToEntity(raw: any): WorkoutExerciseEntity {
    return {
      id: raw.id,
      workoutId: raw.workoutId,
      exerciseId: raw.exerciseId,
      exerciseName: raw.exercise?.name || 'Gerakan',
      equipment: raw.exercise?.equipment || 'DUMBBELL',
      equipmentName: raw.exercise?.equipment || 'Dumbbell',
      primaryMuscle: raw.exercise?.primaryMuscleGroup?.name || 'CHEST',
      primaryMuscleName: raw.exercise?.primaryMuscleGroup?.displayName || 'Dada',
      orderIndex: raw.orderIndex,
      startedAt: raw.startedAt || null,
      completedAt: raw.completedAt || null,
      notes: raw.notes || null,
      isDeleted: raw.isDeleted,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      sets: Array.isArray(raw.sets) ? raw.sets.map((s: any) => this.mapSetToEntity(s)) : [],
    };
  }

  private mapWorkoutToEntity(raw: any): WorkoutEntity {
    return {
      id: raw.id,
      userId: raw.userId,
      routineTemplateId: raw.routineTemplateId || null,
      routineTemplateName: raw.routineTemplate?.name || null,
      name: raw.name,
      status: raw.status as WorkoutStatus,
      startedAt: raw.startedAt || null,
      completedAt: raw.completedAt || null,
      notes: raw.notes || null,
      isDeleted: raw.isDeleted,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      exercises: Array.isArray(raw.exercises)
        ? raw.exercises.map((e: any) => this.mapExerciseToEntity(e))
        : [],
    };
  }

  async create(params: CreateWorkoutParams): Promise<WorkoutEntity> {
    const created = await this.prisma.workout.create({
      data: {
        userId: params.userId,
        name: params.name || 'Sesi Latihan Gym',
        routineTemplateId: params.routineTemplateId || null,
        status: WorkoutStatus.IN_PROGRESS,
        startedAt: params.startedAt || new Date(),
      },
      include: {
        routineTemplate: true,
        exercises: {
          include: {
            exercise: {
              include: { primaryMuscleGroup: true },
            },
            sets: {
              where: { isDeleted: false },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return this.mapWorkoutToEntity(created);
  }

  async findActiveByUserId(userId: string): Promise<WorkoutEntity | null> {
    const raw = await this.prisma.workout.findFirst({
      where: {
        userId,
        status: WorkoutStatus.IN_PROGRESS,
        isDeleted: false,
      },
      include: {
        routineTemplate: true,
        exercises: {
          where: { isDeleted: false },
          include: {
            exercise: {
              include: { primaryMuscleGroup: true },
            },
            sets: {
              where: { isDeleted: false },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!raw) return null;
    return this.mapWorkoutToEntity(raw);
  }

  async findById(id: string): Promise<WorkoutEntity | null> {
    const raw = await this.prisma.workout.findUnique({
      where: { id },
      include: {
        routineTemplate: true,
        exercises: {
          where: { isDeleted: false },
          include: {
            exercise: {
              include: { primaryMuscleGroup: true },
            },
            sets: {
              where: { isDeleted: false },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!raw) return null;
    return this.mapWorkoutToEntity(raw);
  }

  async updateStatus(
    id: string,
    status: WorkoutStatus,
    completedAt?: Date,
  ): Promise<WorkoutEntity> {
    const updated = await this.prisma.workout.update({
      where: { id },
      data: {
        status,
        completedAt: completedAt || (status === WorkoutStatus.COMPLETED ? new Date() : undefined),
      },
      include: {
        routineTemplate: true,
        exercises: {
          where: { isDeleted: false },
          include: {
            exercise: {
              include: { primaryMuscleGroup: true },
            },
            sets: {
              where: { isDeleted: false },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return this.mapWorkoutToEntity(updated);
  }

  async updateName(id: string, name: string): Promise<WorkoutEntity> {
    const updated = await this.prisma.workout.update({
      where: { id },
      data: { name },
      include: {
        routineTemplate: true,
        exercises: {
          where: { isDeleted: false },
          include: {
            exercise: {
              include: { primaryMuscleGroup: true },
            },
            sets: {
              where: { isDeleted: false },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return this.mapWorkoutToEntity(updated);
  }

  async cancelExpiredActiveSessions(userId: string, todayStart: Date): Promise<number> {
    const res = await this.prisma.workout.updateMany({
      where: {
        userId,
        status: WorkoutStatus.IN_PROGRESS,
        startedAt: {
          lt: todayStart,
        },
        isDeleted: false,
      },
      data: {
        status: WorkoutStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    return res.count;
  }

  async addExercise(params: AddExerciseParams): Promise<WorkoutExerciseEntity> {
    const created = await this.prisma.workoutExercise.create({
      data: {
        workoutId: params.workoutId,
        exerciseId: params.exerciseId,
        orderIndex: params.orderIndex,
        startedAt: new Date(),
      },
      include: {
        exercise: {
          include: { primaryMuscleGroup: true },
        },
        sets: {
          where: { isDeleted: false },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    // Auto-create initial set (Set 1)
    const initialSet = await this.prisma.workoutSet.create({
      data: {
        workoutExerciseId: created.id,
        orderIndex: 1,
        weightKg: new Prisma.Decimal(0),
        reps: 0,
        durationSeconds: 0,
        restSeconds: 45,
        isCompleted: false,
      },
    });

    return {
      ...this.mapExerciseToEntity(created),
      sets: [this.mapSetToEntity(initialSet)],
    };
  }

  async removeExercise(workoutId: string, exerciseId: string): Promise<boolean> {
    const res = await this.prisma.workoutExercise.updateMany({
      where: {
        workoutId,
        exerciseId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return res.count > 0;
  }

  async addSet(params: AddSetParams): Promise<WorkoutSetEntity> {
    const created = await this.prisma.workoutSet.create({
      data: {
        workoutExerciseId: params.workoutExerciseId,
        orderIndex: params.orderIndex,
        weightKg: new Prisma.Decimal(params.weightKg || 0),
        reps: params.reps || 0,
        durationSeconds: params.durationSeconds || 0,
        restSeconds: params.restSeconds || 90,
        inclinePct: params.inclinePct !== undefined && params.inclinePct !== null ? new Prisma.Decimal(params.inclinePct) : null,
        speedKmh: params.speedKmh !== undefined && params.speedKmh !== null ? new Prisma.Decimal(params.speedKmh) : null,
        distanceKm: params.distanceKm !== undefined && params.distanceKm !== null ? new Prisma.Decimal(params.distanceKm) : null,
        caloriesBurned: params.caloriesBurned || null,
        isCompleted: Boolean(params.isCompleted),
        completedAt: params.isCompleted ? new Date() : null,
      },
    });

    return this.mapSetToEntity(created);
  }

  async updateSet(setId: string, params: UpdateSetParams): Promise<WorkoutSetEntity> {
    const dataToUpdate: Prisma.WorkoutSetUpdateInput = {};

    if (params.weightKg !== undefined) dataToUpdate.weightKg = new Prisma.Decimal(params.weightKg);
    if (params.reps !== undefined) dataToUpdate.reps = params.reps;
    if (params.durationSeconds !== undefined) dataToUpdate.durationSeconds = params.durationSeconds;
    if (params.restSeconds !== undefined) dataToUpdate.restSeconds = params.restSeconds;
    if (params.inclinePct !== undefined) {
      dataToUpdate.inclinePct = params.inclinePct !== null ? new Prisma.Decimal(params.inclinePct) : null;
    }
    if (params.speedKmh !== undefined) {
      dataToUpdate.speedKmh = params.speedKmh !== null ? new Prisma.Decimal(params.speedKmh) : null;
    }
    if (params.distanceKm !== undefined) {
      dataToUpdate.distanceKm = params.distanceKm !== null ? new Prisma.Decimal(params.distanceKm) : null;
    }
    if (params.caloriesBurned !== undefined) dataToUpdate.caloriesBurned = params.caloriesBurned;
    if (params.rpe !== undefined) {
      dataToUpdate.rpe = params.rpe !== null ? new Prisma.Decimal(params.rpe) : null;
    }
    if (params.isCompleted !== undefined) {
      dataToUpdate.isCompleted = params.isCompleted;
      dataToUpdate.completedAt = params.isCompleted ? new Date() : null;
    }

    const updated = await this.prisma.workoutSet.update({
      where: { id: setId },
      data: dataToUpdate,
    });

    return this.mapSetToEntity(updated);
  }

  async removeSet(setId: string): Promise<boolean> {
    const res = await this.prisma.workoutSet.update({
      where: { id: setId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return Boolean(res);
  }

  async findHistory(filter: WorkoutHistoryFilter): Promise<PaginatedWorkouts> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.WorkoutWhereInput = {
      userId: filter.userId,
      isDeleted: false,
    };

    if (filter.status) {
      where.status = filter.status;
    } else {
      where.status = WorkoutStatus.COMPLETED;
    }

    if (filter.startDate || filter.endDate) {
      where.startedAt = {};
      if (filter.startDate) where.startedAt.gte = filter.startDate;
      if (filter.endDate) where.startedAt.lte = filter.endDate;
    }

    const [totalItems, items] = await Promise.all([
      this.prisma.workout.count({ where }),
      this.prisma.workout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          routineTemplate: true,
          exercises: {
            where: { isDeleted: false },
            include: {
              exercise: {
                include: { primaryMuscleGroup: true },
              },
              sets: {
                where: { isDeleted: false },
                orderBy: { orderIndex: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
      }),
    ]);

    return {
      items: items.map((w) => this.mapWorkoutToEntity(w)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  async getAnalytics(
    userId: string,
    timeframe: WorkoutTimeframe,
    year?: number,
    month?: number,
  ): Promise<WorkoutTelemetryAggregates> {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (timeframe === WorkoutTimeframe.TODAY) {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (timeframe === WorkoutTimeframe.WEEK) {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (timeframe === WorkoutTimeframe.MONTH) {
      const targetYear = year || now.getFullYear();
      const targetMonth = month !== undefined ? month : now.getMonth() + 1;
      startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
      endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    } else if (timeframe === WorkoutTimeframe.YEAR) {
      const targetYear = year || now.getFullYear();
      startDate = new Date(targetYear, 0, 1, 0, 0, 0, 0);
      endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    }

    const workouts = await this.prisma.workout.findMany({
      where: {
        userId,
        status: WorkoutStatus.COMPLETED,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
      include: {
        exercises: {
          where: { isDeleted: false },
          include: {
            exercise: {
              include: { primaryMuscleGroup: true },
            },
            sets: {
              where: { isDeleted: false },
            },
          },
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    let totalVolumeKg = 0;
    let totalSets = 0;
    let totalDurationSeconds = 0;
    let totalActiveSeconds = 0;
    let totalRestSeconds = 0;
    let totalCardioMinutes = 0;
    let totalDistanceKm = 0;
    let totalCaloriesBurned = 0;

    for (const w of workouts) {
      const telemetry = WorkoutTelemetryCalculator.calculateSessionTelemetry({
        startedAt: w.startedAt || w.createdAt,
        completedAt: w.completedAt,
        exercises: w.exercises.map((e) => {
          const isCardio = Boolean(
            e.exercise?.equipment === 'TREADMILL' ||
            e.exercise?.equipment === 'STATIONARY_BIKE' ||
            e.exercise?.equipment === 'STAIR_MASTER' ||
            e.exercise?.equipment === 'ROWING_MACHINE' ||
            e.exercise?.equipment === 'ELLIPTICAL' ||
            e.exercise?.primaryMuscleGroup?.name === 'CARDIO' ||
            (e.exercise?.name && e.exercise.name.toLowerCase().includes('treadmill')),
          );

          return {
            startedAt: e.startedAt,
            completedAt: e.completedAt,
            isCardio,
            sets: e.sets.map((s) => ({
              durationSeconds: s.durationSeconds,
              restSeconds: s.restSeconds,
              weightKg: Number(s.weightKg),
              reps: s.reps,
              isCompleted: s.isCompleted,
              isCardio,
              inclinePct: s.inclinePct ? Number(s.inclinePct) : undefined,
              speedKmh: s.speedKmh ? Number(s.speedKmh) : undefined,
            })),
          };
        }),
      });

      totalDurationSeconds += telemetry.sessionDurationSeconds;
      totalActiveSeconds += telemetry.activeDurationSeconds;
      totalRestSeconds += telemetry.restDurationSeconds;
      totalCaloriesBurned += telemetry.estimatedCaloriesBurned;

      for (const e of w.exercises) {
        for (const s of e.sets) {
          if (s.isCompleted) {
            totalSets += 1;
            totalVolumeKg += WorkoutVolumeCalculator.calculateSetVolume(
              Number(s.weightKg),
              s.reps,
            );
            if (s.distanceKm) totalDistanceKm += Number(s.distanceKm);
            if (s.inclinePct || s.speedKmh) {
              totalCardioMinutes += Math.round(s.durationSeconds / 60);
            }
          }
        }
      }
    }

    // PRs count achieved in period
    const newPrCount = await this.prisma.personalRecord.count({
      where: {
        userId,
        achievedAt: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
    });

    // Build chart data
    const chartData: WorkoutTelemetryAggregates['chartData'] = [];

    if (timeframe === WorkoutTimeframe.YEAR) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthMap = new Map<string, { volume: number; active: number; rest: number; total: number }>();

      for (let m = 0; m < 12; m++) {
        monthMap.set(monthNames[m], { volume: 0, active: 0, rest: 0, total: 0 });
      }

      for (const w of workouts) {
        const mIdx = new Date(w.startedAt || w.createdAt).getMonth();
        const mKey = monthNames[mIdx];
        const entry = monthMap.get(mKey);
        if (entry) {
          for (const e of w.exercises) {
            for (const s of e.sets) {
              if (s.isCompleted) {
                const sDur = s.durationSeconds || Math.max(15, Math.round((s.reps || 10) * 3.5));
                entry.volume += WorkoutVolumeCalculator.calculateSetVolume(Number(s.weightKg), s.reps);
                entry.active += Math.round(sDur / 60) || 1;
                entry.rest += Math.round(s.restSeconds / 60);
              }
            }
          }
          entry.total += Math.round(
            (new Date(w.completedAt || w.createdAt).getTime() - new Date(w.startedAt || w.createdAt).getTime()) /
              60000,
          );
        }
      }

      for (const [label, data] of monthMap.entries()) {
        chartData.push({
          date: label,
          label,
          volumeKg: Math.round(data.volume),
          activeMinutes: data.active,
          restMinutes: data.rest,
          totalMinutes: data.total,
        });
      }
    } else if (timeframe === WorkoutTimeframe.MONTH) {
      const totalDaysInMonth = endDate.getDate();
      const weekSlots = [
        { label: 'Mgg 1 (1-7)', maxDay: 7, volume: 0, active: 0, rest: 0, total: 0 },
        { label: 'Mgg 2 (8-14)', maxDay: 14, volume: 0, active: 0, rest: 0, total: 0 },
        { label: 'Mgg 3 (15-21)', maxDay: 21, volume: 0, active: 0, rest: 0, total: 0 },
        { label: `Mgg 4 (22-${totalDaysInMonth})`, maxDay: 31, volume: 0, active: 0, rest: 0, total: 0 },
      ];

      for (const w of workouts) {
        const dayOfMonth = new Date(w.startedAt || w.createdAt).getDate();
        const slot =
          weekSlots.find((s) => dayOfMonth <= s.maxDay) || weekSlots[weekSlots.length - 1];

        for (const e of w.exercises) {
          for (const s of e.sets) {
            if (s.isCompleted) {
              const sDur = s.durationSeconds || Math.max(15, Math.round((s.reps || 10) * 3.5));
              slot.volume += WorkoutVolumeCalculator.calculateSetVolume(Number(s.weightKg), s.reps);
              slot.active += Math.round(sDur / 60) || 1;
              slot.rest += Math.round(s.restSeconds / 60);
            }
          }
        }
        if (w.completedAt && w.startedAt) {
          slot.total += Math.round(
            (new Date(w.completedAt).getTime() - new Date(w.startedAt).getTime()) / 60000,
          );
        }
      }

      for (const slot of weekSlots) {
        chartData.push({
          date: slot.label,
          label: slot.label,
          volumeKg: Math.round(slot.volume),
          activeMinutes: slot.active,
          restMinutes: slot.rest,
          totalMinutes: slot.total,
        });
      }
    } else {
      // TODAY (1 day) or WEEK (7 days)
      const daysCount = timeframe === WorkoutTimeframe.TODAY ? 1 : 7;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const label = `${dayNames[d.getDay()]} (${d.getDate().toString().padStart(2, '0')})`;
        chartData.push({
          date: iso,
          label,
          volumeKg: 0,
          activeMinutes: 0,
          restMinutes: 0,
          totalMinutes: 0,
        });
      }

      for (const w of workouts) {
        const wIso = new Date(w.startedAt || w.createdAt).toISOString().split('T')[0];
        const targetPoint = chartData.find((cd) => cd.date === wIso);
        if (targetPoint) {
          for (const e of w.exercises) {
            for (const s of e.sets) {
              if (s.isCompleted) {
                const sDur = s.durationSeconds || Math.max(15, Math.round((s.reps || 10) * 3.5));
                targetPoint.volumeKg += WorkoutVolumeCalculator.calculateSetVolume(Number(s.weightKg), s.reps);
                targetPoint.activeMinutes += Math.round(sDur / 60) || 1;
                targetPoint.restMinutes += Math.round(s.restSeconds / 60);
              }
            }
          }
          if (w.completedAt && w.startedAt) {
            targetPoint.totalMinutes += Math.round(
              (new Date(w.completedAt).getTime() - new Date(w.startedAt).getTime()) / 60000,
            );
          }
        }
      }
    }

    const activeRatioPct =
      totalDurationSeconds > 0
        ? Math.round((totalActiveSeconds / totalDurationSeconds) * 1000) / 10
        : 0;

    return {
      totalVolumeKg: Math.round(totalVolumeKg),
      volumeDeltaPct: workouts.length > 0 ? 0 : 0,
      totalSessions: workouts.length,
      totalSets,
      totalDurationMinutes: Math.round(totalDurationSeconds / 60),
      activeRatioPct,
      totalCardioMinutes,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalCaloriesBurned,
      newPrCount,
      chartData,
    };
  }

  async findRoutineTemplates(): Promise<RoutineTemplateEntity[]> {
    const templates = await this.prisma.routineTemplate.findMany({
      where: { isDeleted: false, isActive: true },
      include: {
        exercises: {
          where: { isDeleted: false },
          include: {
            exercise: {
              include: { primaryMuscleGroup: true },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      isActive: t.isActive,
      exercises: t.exercises.map((e) => ({
        id: e.id,
        routineTemplateId: e.routineTemplateId,
        exerciseId: e.exerciseId,
        exerciseName: e.exercise.name,
        equipment: e.exercise.equipment,
        primaryMuscle: e.exercise.primaryMuscleGroup?.name || 'CHEST',
        orderIndex: e.orderIndex,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        targetRestSeconds: e.targetRestSeconds,
      })),
    }));
  }

  async findRoutineTemplateById(id: string): Promise<RoutineTemplateEntity | null> {
    const t = await this.prisma.routineTemplate.findUnique({
      where: { id },
      include: {
        exercises: {
          where: { isDeleted: false },
          include: {
            exercise: {
              include: { primaryMuscleGroup: true },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!t) return null;

    return {
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      isActive: t.isActive,
      exercises: t.exercises.map((e) => ({
        id: e.id,
        routineTemplateId: e.routineTemplateId,
        exerciseId: e.exerciseId,
        exerciseName: e.exercise.name,
        equipment: e.exercise.equipment,
        primaryMuscle: e.exercise.primaryMuscleGroup?.name || 'CHEST',
        orderIndex: e.orderIndex,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        targetRestSeconds: e.targetRestSeconds,
      })),
    };
  }

  async findUserPRs(userId: string, exerciseIds?: string[]): Promise<PersonalRecordEntity[]> {
    const where: Prisma.PersonalRecordWhereInput = {
      userId,
      isDeleted: false,
    };

    if (exerciseIds && exerciseIds.length > 0) {
      where.exerciseId = { in: exerciseIds };
    }

    const records = await this.prisma.personalRecord.findMany({
      where,
      include: { exercise: true },
    });

    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      exerciseId: r.exerciseId,
      exerciseName: r.exercise.name,
      workoutSetId: r.workoutSetId,
      recordType: r.recordType as RecordType,
      value: Number(r.value),
      achievedAt: r.achievedAt,
    }));
  }

  async savePRs(
    records: Omit<PersonalRecordEntity, 'id' | 'achievedAt'>[],
  ): Promise<PersonalRecordEntity[]> {
    if (!Array.isArray(records) || records.length === 0) return [];

    const results: PersonalRecordEntity[] = [];

    for (const r of records) {
      const created = await this.prisma.personalRecord.create({
        data: {
          userId: r.userId,
          exerciseId: r.exerciseId,
          workoutSetId: r.workoutSetId || null,
          recordType: r.recordType,
          value: new Prisma.Decimal(r.value),
        },
        include: { exercise: true },
      });

      results.push({
        id: created.id,
        userId: created.userId,
        exerciseId: created.exerciseId,
        exerciseName: created.exercise.name,
        workoutSetId: created.workoutSetId,
        recordType: created.recordType as RecordType,
        value: Number(created.value),
        achievedAt: created.achievedAt,
      });
    }

    return results;
  }
}
