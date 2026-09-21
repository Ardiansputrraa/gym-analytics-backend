import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  IAnalyticsRepository,
  AnalyticsTimeframe,
  DashboardSummaryData,
  DailyTimelineEvent,
  VolumeByMuscleGroupItem,
  StrengthProgressionItem,
  CalorieWeightCorrelationItem,
  WorkRestRatioItem,
  HeatmapDayItem,
  RecentPRItem,
  LastWorkoutSessionData,
} from '../../../domain/repositories/analytics.repository.interface';
import {
  MuscleRecoveryCalculator,
  MuscleLastTrainedInput,
} from '../../../domain/calculators/muscle-recovery.calculator';
import {
  DeterministicInsightsEngine,
  DeterministicInsight,
} from '../../../domain/calculators/deterministic-insights.engine';
import { WorkoutTelemetryCalculator } from '../../../domain/calculators/workout-telemetry.calculator';
import { EpleyOneRepMaxCalculator } from '../../../domain/calculators/personal-record.engine';

@Injectable()
export class PrismaAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(
    userId: string,
    timeframe: AnalyticsTimeframe = '7D',
    referenceDate: Date = new Date(),
  ): Promise<DashboardSummaryData> {
    const daysCount = timeframe === '90D' ? 90 : timeframe === '30D' ? 30 : 7;
    const now = new Date(referenceDate);

    // Date boundaries
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const currentPeriodStart = new Date(todayStart);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - (daysCount - 1));

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysCount);
    const previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodEnd.setMilliseconds(previousPeriodEnd.getMilliseconds() - 1);

    // 1. Fetch User Profile
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId, isDeleted: false },
    });
    const userWeightKg = profile ? Number(profile.weightKg) : 70;
    const checkInIntervalDays = profile?.checkInIntervalDays || 30;

    // 2. Check-in Banner calculation (Rule BR-004)
    const latestMeasurement = await this.prisma.bodyMeasurement.findFirst({
      where: { userId, isDeleted: false },
      orderBy: { measuredAt: 'desc' },
    });

    const previousMeasurement = latestMeasurement
      ? await this.prisma.bodyMeasurement.findFirst({
          where: {
            userId,
            isDeleted: false,
            measuredAt: { lt: latestMeasurement.measuredAt },
          },
          orderBy: { measuredAt: 'desc' },
        })
      : null;

    let daysRemaining = checkInIntervalDays;
    let isOverdue = false;
    let lastCheckInDate: string | null = null;

    if (latestMeasurement) {
      lastCheckInDate = latestMeasurement.measuredAt.toISOString();
      const elapsedDays = Math.floor(
        (now.getTime() - new Date(latestMeasurement.measuredAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      daysRemaining = checkInIntervalDays - elapsedDays;
      if (daysRemaining <= 0) {
        isOverdue = true;
      }
    } else if (profile) {
      const elapsedDays = Math.floor(
        (now.getTime() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      daysRemaining = checkInIntervalDays - elapsedDays;
      if (daysRemaining <= 0) {
        isOverdue = true;
      }
    }

    // 3. Active Workout Hero
    const activeWorkoutModel = await this.prisma.workout.findFirst({
      where: { userId, status: 'IN_PROGRESS', isDeleted: false },
      include: {
        exercises: {
          where: { isDeleted: false },
          include: { sets: { where: { isDeleted: false } } },
        },
      },
    });

    let activeWorkout = null;
    if (activeWorkoutModel) {
      const elapsedSeconds = activeWorkoutModel.startedAt
        ? Math.max(0, Math.floor((now.getTime() - new Date(activeWorkoutModel.startedAt).getTime()) / 1000))
        : 0;
      let totalSets = 0;
      for (const ex of activeWorkoutModel.exercises) {
        totalSets += ex.sets.length;
      }
      activeWorkout = {
        id: activeWorkoutModel.id,
        name: activeWorkoutModel.name,
        startedAt: activeWorkoutModel.startedAt?.toISOString() || now.toISOString(),
        elapsedSeconds,
        totalExercises: activeWorkoutModel.exercises.length,
        totalSets,
      };
    }

    // 4. Completed Workouts in current & previous periods
    const currentPeriodWorkouts = await this.prisma.workout.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        isDeleted: false,
        completedAt: {
          gte: currentPeriodStart,
          lte: todayEnd,
        },
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
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { completedAt: 'asc' },
    });

    const previousPeriodWorkouts = await this.prisma.workout.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        isDeleted: false,
        completedAt: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
      include: {
        exercises: {
          where: { isDeleted: false },
          include: {
            sets: { where: { isDeleted: false } },
          },
        },
      },
    });

    // Calculate Volume & Telemetry across current period
    let currentVolumeKg = 0;
    let totalActiveMinutes = 0;
    let totalRestMinutes = 0;
    const muscleVolumeMap = new Map<string, { name: string; volumeKg: number; sets: number }>();
    const workRestDailyMap = new Map<string, { activeMin: number; restMin: number }>();

    for (const w of currentPeriodWorkouts) {
      const telemetry = WorkoutTelemetryCalculator.calculateSessionTelemetry({
        startedAt: w.startedAt || w.createdAt,
        completedAt: w.completedAt,
        exercises: w.exercises.map((e) => ({
          startedAt: e.startedAt,
          completedAt: e.completedAt,
          sets: e.sets.map((s) => ({
            durationSeconds: s.durationSeconds,
            restSeconds: s.restSeconds,
            weightKg: Number(s.weightKg),
            reps: s.reps,
            isCompleted: s.isCompleted,
            caloriesBurned: s.caloriesBurned || undefined,
          })),
        })),
        userWeightKg,
      });

      currentVolumeKg += telemetry.totalVolumeKg;
      const activeMin = Math.round(telemetry.activeDurationSeconds / 60);
      const restMin = Math.round(telemetry.restDurationSeconds / 60);
      totalActiveMinutes += activeMin;
      totalRestMinutes += restMin;

      const dateKey = (w.completedAt || w.createdAt).toISOString().split('T')[0];
      const existingDaily = workRestDailyMap.get(dateKey) || { activeMin: 0, restMin: 0 };
      existingDaily.activeMin += activeMin;
      existingDaily.restMin += restMin;
      workRestDailyMap.set(dateKey, existingDaily);

      // Group volume by muscle
      for (const ex of w.exercises) {
        const mgName = ex.exercise?.primaryMuscleGroup?.displayName || 'Lainnya';
        const mgCode = ex.exercise?.primaryMuscleGroup?.name || 'OTHER';
        const existing = muscleVolumeMap.get(mgCode) || { name: mgName, volumeKg: 0, sets: 0 };
        for (const s of ex.sets) {
          if (s.isCompleted) {
            existing.volumeKg += Number(s.weightKg) * Number(s.reps);
            existing.sets += 1;
          }
        }
        muscleVolumeMap.set(mgCode, existing);
      }
    }

    let previousVolumeKg = 0;
    for (const w of previousPeriodWorkouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          if (s.isCompleted) {
            previousVolumeKg += Number(s.weightKg) * Number(s.reps);
          }
        }
      }
    }

    const volumeDeltaPct =
      previousVolumeKg > 0
        ? Math.round(((currentVolumeKg - previousVolumeKg) / previousVolumeKg) * 1000) / 10
        : currentVolumeKg > 0
        ? 100
        : 0;

    const totalSessionMin = totalActiveMinutes + totalRestMinutes;
    const activeRatioPct =
      totalSessionMin > 0 ? Math.round((totalActiveMinutes / totalSessionMin) * 100) : 50;
    const restRatioPct = 100 - activeRatioPct;

    // 5. Daily Nutrition for Today & Timeframe
    const todayNutrition = await this.prisma.nutritionEntry.findMany({
      where: {
        userId,
        isDeleted: false,
        consumedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    let consumedCaloriesToday = 0;
    let consumedProteinToday = 0;
    let consumedFatToday = 0;
    let consumedCarbsToday = 0;
    let consumedWaterToday = 0;

    for (const n of todayNutrition) {
      consumedCaloriesToday += n.calories || 0;
      consumedProteinToday += Number(n.proteinG) || 0;
      consumedFatToday += Number(n.fatG) || 0;
      consumedCarbsToday += Number(n.carbsG) || 0;
      consumedWaterToday += n.waterMl || 0;
    }

    const latestCalorieTarget = await this.prisma.dailyCalorieTarget.findFirst({
      where: { userId, isDeleted: false },
      orderBy: { date: 'desc' },
    });

    const targetCalories = latestCalorieTarget?.targetCalories || 2200;
    const targetProtein = latestCalorieTarget?.proteinGrams || Math.round((targetCalories * 0.3) / 4);
    const targetCarbs = latestCalorieTarget?.carbsGrams || Math.round((targetCalories * 0.45) / 4);
    const targetFat = latestCalorieTarget?.fatGrams || Math.round((targetCalories * 0.25) / 9);
    const targetWaterMl = Math.round(userWeightKg * 35); // Rule BR-010

    // Macro Split percentages
    const totalMacroGrams = consumedProteinToday + consumedFatToday + consumedCarbsToday;
    const macroSplit =
      totalMacroGrams > 0
        ? {
            proteinPct: Math.round((consumedProteinToday / totalMacroGrams) * 100),
            fatPct: Math.round((consumedFatToday / totalMacroGrams) * 100),
            carbsPct: Math.round((consumedCarbsToday / totalMacroGrams) * 100),
          }
        : { proteinPct: 30, fatPct: 25, carbsPct: 45 };

    // 6. Body Weight & Composition Trend
    const currentWeight = latestMeasurement ? Number(latestMeasurement.weightKg) : userWeightKg;
    const prevWeight = previousMeasurement ? Number(previousMeasurement.weightKg) : currentWeight;
    const weightTrendKg = Number((currentWeight - prevWeight).toFixed(1));
    const weightTrendPct =
      prevWeight > 0 ? Number(((weightTrendKg / prevWeight) * 100).toFixed(1)) : 0;
    const isWeightAlignedWithGoal =
      profile?.fitnessGoal === 'FAT_LOSS'
        ? weightTrendKg <= 0
        : profile?.fitnessGoal === 'MUSCLE_GAIN'
        ? weightTrendKg >= 0
        : Math.abs(weightTrendKg) <= 0.5;

    // 7. Volume by Muscle Group Chart Data
    const volumeByMuscleGroup: VolumeByMuscleGroupItem[] = [];
    let totalCategorizedVolume = 0;
    for (const [code, val] of muscleVolumeMap.entries()) {
      totalCategorizedVolume += val.volumeKg;
    }
    for (const [code, val] of muscleVolumeMap.entries()) {
      volumeByMuscleGroup.push({
        muscle: code,
        name: val.name,
        volumeKg: val.volumeKg,
        sets: val.sets,
        pct:
          totalCategorizedVolume > 0
            ? Math.round((val.volumeKg / totalCategorizedVolume) * 100)
            : 0,
      });
    }

    // Fallback if no workout volume logged yet
    if (volumeByMuscleGroup.length === 0) {
      volumeByMuscleGroup.push(
        { muscle: 'CHEST', name: 'Dada', volumeKg: 0, sets: 0, pct: 0 },
        { muscle: 'BACK', name: 'Punggung', volumeKg: 0, sets: 0, pct: 0 },
        { muscle: 'LEGS', name: 'Kaki', volumeKg: 0, sets: 0, pct: 0 },
        { muscle: 'SHOULDERS', name: 'Bahu', volumeKg: 0, sets: 0, pct: 0 },
        { muscle: 'ARMS', name: 'Lengan', volumeKg: 0, sets: 0, pct: 0 },
      );
    }

    // 8. 1RM Compound Strength Progression (Epley)
    const personalRecords = await this.prisma.personalRecord.findMany({
      where: { userId, isDeleted: false },
      include: { exercise: true },
      orderBy: { achievedAt: 'desc' },
      take: 20,
    });

    const recentPRs: RecentPRItem[] = personalRecords.slice(0, 5).map((pr) => {
      const val = Number(pr.value);
      return {
        exerciseId: pr.exerciseId,
        exercise: pr.exercise?.name || 'Latihan',
        date: pr.achievedAt.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        metric: `${val} kg (${pr.recordType})`,
        e1rm: `${val} kg`,
      };
    });

    // 9. Calorie vs Weight Daily Chart Data
    const nutritionEntriesPeriod = await this.prisma.nutritionEntry.findMany({
      where: {
        userId,
        isDeleted: false,
        consumedAt: { gte: currentPeriodStart, lte: todayEnd },
      },
    });

    const measurementsPeriod = await this.prisma.bodyMeasurement.findMany({
      where: {
        userId,
        isDeleted: false,
        measuredAt: { gte: currentPeriodStart, lte: todayEnd },
      },
    });

    const calorieVsWeight: CalorieWeightCorrelationItem[] = [];
    const workRestRatio: WorkRestRatioItem[] = [];

    for (let d = 0; d < daysCount; d++) {
      const iterDate = new Date(currentPeriodStart);
      iterDate.setDate(iterDate.getDate() + d);
      const dateKey = iterDate.toISOString().split('T')[0];

      // Sum calories for iterDate
      let dayCalories = 0;
      for (const n of nutritionEntriesPeriod) {
        if (n.consumedAt.toISOString().startsWith(dateKey)) {
          dayCalories += n.calories || 0;
        }
      }

      // Find weight for iterDate if measured
      const measurement = measurementsPeriod.find((m) =>
        m.measuredAt.toISOString().startsWith(dateKey),
      );
      const dayWeight = measurement ? Number(measurement.weightKg) : null;

      calorieVsWeight.push({
        date: iterDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        calories: dayCalories,
        targetCalories,
        weightKg: dayWeight,
      });

      const wr = workRestDailyMap.get(dateKey) || { activeMin: 0, restMin: 0 };
      workRestRatio.push({
        date: iterDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        activeMin: wr.activeMin,
        restMin: wr.restMin,
        totalMin: wr.activeMin + wr.restMin,
      });
    }

    // 10. Muscle Recovery Matrix (Rule BR-017)
    const masterMuscleGroups = await this.prisma.muscleGroup.findMany({
      where: { isDeleted: false },
      orderBy: { orderIndex: 'asc' },
    });

    const recoveryInputs: MuscleLastTrainedInput[] = [];
    for (const mg of masterMuscleGroups) {
      // Find latest completed workout exercise with this muscle group
      const latestSet = await this.prisma.workoutSet.findFirst({
        where: {
          isCompleted: true,
          isDeleted: false,
          workoutExercise: {
            isDeleted: false,
            workout: { userId, status: 'COMPLETED', isDeleted: false },
            exercise: { primaryMuscleGroupId: mg.id, isDeleted: false },
          },
        },
        orderBy: { completedAt: 'desc' },
        include: {
          workoutExercise: {
            include: { workout: true },
          },
        },
      });

      recoveryInputs.push({
        muscleGroupName: mg.name,
        muscleGroupDisplayName: mg.displayName,
        lastTrainedAt:
          latestSet?.completedAt ||
          latestSet?.workoutExercise?.workout?.completedAt ||
          null,
      });
    }
    const muscleRecovery = MuscleRecoveryCalculator.calculateAll(recoveryInputs, now);

    // 11. 28-Day Consistency Heatmap
    const heatmapStart = new Date(todayStart);
    heatmapStart.setDate(heatmapStart.getDate() - 27);

    const workouts28Days = await this.prisma.workout.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        isDeleted: false,
        completedAt: { gte: heatmapStart, lte: todayEnd },
      },
      include: {
        exercises: {
          where: { isDeleted: false },
          include: { sets: { where: { isDeleted: false } } },
        },
      },
    });

    const heatmapItems: HeatmapDayItem[] = [];
    let completedSessions28D = 0;

    for (let i = 0; i < 28; i++) {
      const d = new Date(heatmapStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const dayWorkouts = workouts28Days.filter(
        (w) => w.completedAt && w.completedAt.toISOString().startsWith(dateStr),
      );

      let dayVolume = 0;
      let dayDurationMinutes = 0;

      for (const dw of dayWorkouts) {
        completedSessions28D += 1;
        const sMs = dw.startedAt ? new Date(dw.startedAt).getTime() : new Date(dw.createdAt).getTime();
        const eMs = dw.completedAt ? new Date(dw.completedAt).getTime() : sMs;
        dayDurationMinutes += Math.max(0, Math.floor((eMs - sMs) / (1000 * 60)));

        for (const ex of dw.exercises) {
          for (const s of ex.sets) {
            if (s.isCompleted) {
              dayVolume += Number(s.weightKg) * Number(s.reps);
            }
          }
        }
      }

      heatmapItems.push({
        day: i + 1,
        date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        hasWorkout: dayWorkouts.length > 0,
        volume: dayVolume,
        durationMinutes: dayDurationMinutes,
      });
    }

    const targetSessions28D = 16; // 4 sessions per week * 4 weeks
    const adherencePct = Math.min(100, Math.round((completedSessions28D / targetSessions28D) * 100));

    // 12. Last Workout Session Breakdown
    const lastCompletedWorkout = await this.prisma.workout.findFirst({
      where: { userId, status: 'COMPLETED', isDeleted: false },
      orderBy: { completedAt: 'desc' },
      include: {
        exercises: {
          where: { isDeleted: false },
          include: {
            exercise: { include: { primaryMuscleGroup: true } },
            sets: { where: { isDeleted: false }, orderBy: { orderIndex: 'asc' } },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    let lastWorkoutSession: LastWorkoutSessionData | null = null;
    if (lastCompletedWorkout) {
      const telemetry = WorkoutTelemetryCalculator.calculateSessionTelemetry({
        startedAt: lastCompletedWorkout.startedAt || lastCompletedWorkout.createdAt,
        completedAt: lastCompletedWorkout.completedAt,
        exercises: lastCompletedWorkout.exercises.map((e) => ({
          startedAt: e.startedAt,
          completedAt: e.completedAt,
          sets: e.sets.map((s) => ({
            durationSeconds: s.durationSeconds,
            restSeconds: s.restSeconds,
            weightKg: Number(s.weightKg),
            reps: s.reps,
            isCompleted: s.isCompleted,
            caloriesBurned: s.caloriesBurned || undefined,
          })),
        })),
        userWeightKg,
      });

      let totalSetsCount = 0;
      const exerciseDetails = lastCompletedWorkout.exercises.map((ex) => {
        let maxWeight = 0;
        let bestReps = 0;
        let exVol = 0;
        let best1RM = 0;

        for (const s of ex.sets) {
          totalSetsCount++;
          const w = Number(s.weightKg);
          const r = Number(s.reps);
          exVol += w * r;
          const e1rm = EpleyOneRepMaxCalculator.calculate(w, r);
          if (e1rm > best1RM) {
            best1RM = e1rm;
            maxWeight = w;
            bestReps = r;
          }
        }

        return {
          exerciseName: ex.exercise?.name || 'Latihan',
          muscleGroupName: ex.exercise?.primaryMuscleGroup?.displayName || 'Otot',
          totalSets: ex.sets.length,
          topSet: `${maxWeight} kg × ${bestReps}`,
          oneRepMaxEst: best1RM,
          volumeKg: exVol,
          isPr: false,
        };
      });

      lastWorkoutSession = {
        id: lastCompletedWorkout.id,
        name: lastCompletedWorkout.name,
        completedAt:
          lastCompletedWorkout.completedAt?.toISOString() ||
          lastCompletedWorkout.createdAt.toISOString(),
        totalVolumeKg: telemetry.totalVolumeKg,
        durationMinutes: Math.round(telemetry.sessionDurationSeconds / 60),
        activeRatioPct: telemetry.activeRatioPct,
        totalExercises: lastCompletedWorkout.exercises.length,
        totalSets: totalSetsCount,
        newPrsCount: 0,
        exercises: exerciseDetails,
      };
    }

    // 13. Strength Progression Compound Lifts
    const strengthProgression: StrengthProgressionItem[] = [];
    const compoundExercises = await this.prisma.exercise.findMany({
      where: {
        isDeleted: false,
        name: {
          in: ['Barbell Bench Press', 'Barbell Squat', 'Barbell Deadlift', 'Overhead Press'],
        },
      },
    });

    for (const ce of compoundExercises) {
      const sets = await this.prisma.workoutSet.findMany({
        where: {
          isCompleted: true,
          isDeleted: false,
          workoutExercise: {
            exerciseId: ce.id,
            isDeleted: false,
            workout: { userId, status: 'COMPLETED', isDeleted: false },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
      });

      let current1RM = 0;
      let prev1RM = 0;
      const history = sets.map((s, idx) => {
        const w = Number(s.weightKg);
        const r = Number(s.reps);
        const e1rm = EpleyOneRepMaxCalculator.calculate(w, r);
        if (idx === 0) current1RM = e1rm;
        if (idx === 1) prev1RM = e1rm;
        return {
          date: (s.completedAt || new Date()).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
          }),
          oneRepMaxKg: e1rm,
          weightKg: w,
          reps: r,
        };
      });

      const deltaPct =
        prev1RM > 0 ? Number((((current1RM - prev1RM) / prev1RM) * 100).toFixed(1)) : 0;

      strengthProgression.push({
        exerciseId: ce.id,
        exerciseName: ce.name,
        category: 'Compound Lift',
        current1RM,
        previous1RM: prev1RM,
        deltaPct,
        history,
      });
    }

    // 14. Deterministic Insights Engine (PRD Section 17 & 26)
    const deterministicInsights = DeterministicInsightsEngine.generateInsights({
      latestBodyMeasurement: latestMeasurement
        ? {
            weightKg: Number(latestMeasurement.weightKg),
            bodyFatPct: latestMeasurement.bodyFatPct ? Number(latestMeasurement.bodyFatPct) : null,
            skeletalMuscleKg: latestMeasurement.skeletalMuscleKg
              ? Number(latestMeasurement.skeletalMuscleKg)
              : null,
            measuredAt: latestMeasurement.measuredAt,
          }
        : null,
      previousBodyMeasurement: previousMeasurement
        ? {
            weightKg: Number(previousMeasurement.weightKg),
            bodyFatPct: previousMeasurement.bodyFatPct ? Number(previousMeasurement.bodyFatPct) : null,
            skeletalMuscleKg: previousMeasurement.skeletalMuscleKg
              ? Number(previousMeasurement.skeletalMuscleKg)
              : null,
            measuredAt: previousMeasurement.measuredAt,
          }
        : null,
      recentPrs: personalRecords.slice(0, 3).map((pr) => ({
        exerciseName: pr.exercise?.name || 'Latihan',
        weightKg: Number(pr.value),
        reps: 6,
        estimated1RM: Number(pr.value),
        achievedAt: pr.achievedAt,
      })),
      nutritionSummary7Days: {
        averageCalories: Math.round(consumedCaloriesToday),
        targetCalories,
        averageWaterMl: Math.round(consumedWaterToday),
        targetWaterMl,
        daysLogged: 7,
      },
      muscleRecoveryList: muscleRecovery,
    });

    return {
      timeframe,
      checkInBanner: {
        daysRemaining: Math.max(0, daysRemaining),
        isOverdue,
        intervalDays: checkInIntervalDays,
        lastCheckInDate,
      },
      activeWorkout,
      heroMetrics: {
        volume: {
          totalKg: currentVolumeKg,
          trendPct: volumeDeltaPct,
          isPositive: volumeDeltaPct >= 0,
        },
        protein: {
          consumedG: Math.round(consumedProteinToday),
          targetG: targetProtein,
          remainingG: Math.max(0, targetProtein - Math.round(consumedProteinToday)),
          pct: targetProtein > 0 ? Math.round((consumedProteinToday / targetProtein) * 100) : 0,
        },
        fat: {
          consumedG: Math.round(consumedFatToday),
          targetG: targetFat,
          remainingG: Math.max(0, targetFat - Math.round(consumedFatToday)),
          pct: targetFat > 0 ? Math.round((consumedFatToday / targetFat) * 100) : 0,
        },
        carbs: {
          consumedG: Math.round(consumedCarbsToday),
          targetG: targetCarbs,
          remainingG: Math.max(0, targetCarbs - Math.round(consumedCarbsToday)),
          pct: targetCarbs > 0 ? Math.round((consumedCarbsToday / targetCarbs) * 100) : 0,
        },
        weight: {
          currentKg: currentWeight,
          trendKg: weightTrendKg,
          trendPct: weightTrendPct,
          isAlignedWithGoal: isWeightAlignedWithGoal,
        },
        activeRatio: {
          activePct: activeRatioPct,
          restPct: restRatioPct,
          totalActiveMinutes,
          totalRestMinutes,
        },
      },
      radialGauges: {
        calorieProgress: {
          consumedKcal: consumedCaloriesToday,
          targetKcal: targetCalories,
          deltaKcal: targetCalories - consumedCaloriesToday,
          deficitPct:
            targetCalories > 0
              ? Math.round(((targetCalories - consumedCaloriesToday) / targetCalories) * 100)
              : 0,
          macroSplit,
        },
        hydrationProgress: {
          consumedMl: consumedWaterToday,
          targetMl: targetWaterMl,
          remainingMl: Math.max(0, targetWaterMl - consumedWaterToday),
          pct: targetWaterMl > 0 ? Math.min(100, Math.round((consumedWaterToday / targetWaterMl) * 100)) : 0,
        },
      },
      charts: {
        volumeByMuscleGroup,
        strengthProgression,
        calorieVsWeight,
        workRestRatio,
      },
      muscleRecovery,
      consistencyHeatmap: {
        items: heatmapItems,
        completedSessions: completedSessions28D,
        targetSessions: targetSessions28D,
        adherencePct,
        activeStreakWeeks: Math.ceil(completedSessions28D / 4),
      },
      lastWorkoutSession,
      recentPRs,
      deterministicInsights,
    };
  }

  async getDailyTimeline(userId: string, targetDate: Date = new Date()): Promise<DailyTimelineEvent[]> {
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const workouts = await this.prisma.workout.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        isDeleted: false,
        completedAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        exercises: {
          where: { isDeleted: false },
          include: { sets: { where: { isDeleted: false } } },
        },
      },
    });

    const nutritionEntries = await this.prisma.nutritionEntry.findMany({
      where: {
        userId,
        isDeleted: false,
        consumedAt: { gte: dayStart, lte: dayEnd },
      },
    });

    const timeline: DailyTimelineEvent[] = [];

    for (const w of workouts) {
      let vol = 0;
      let totalSets = 0;
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          if (s.isCompleted) {
            vol += Number(s.weightKg) * Number(s.reps);
            totalSets++;
          }
        }
      }
      const timeStr = (w.completedAt || w.createdAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      timeline.push({
        id: `workout-${w.id}`,
        time: timeStr,
        type: 'WORKOUT',
        title: `Sesi Latihan: ${w.name}`,
        subtitle: `Volume: ${vol.toLocaleString('id-ID')} kg · ${w.exercises.length} Gerakan · ${totalSets} Set`,
        rawTimestamp: w.completedAt || w.createdAt,
      });
    }

    for (const n of nutritionEntries) {
      const timeStr = n.consumedAt.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      if (n.type === 'DRINK') {
        timeline.push({
          id: `nutrition-${n.id}`,
          time: timeStr,
          type: 'DRINK',
          title: `Konsumsi Hidrasi: ${n.name}`,
          subtitle: `${n.waterMl || 250} ml air hidrasi`,
          rawTimestamp: n.consumedAt,
        });
      } else {
        timeline.push({
          id: `nutrition-${n.id}`,
          time: timeStr,
          type: 'FOOD',
          title: `Makan: ${n.name}`,
          subtitle: `${n.calories} kkal · P: ${Number(n.proteinG) || 0}g · L: ${
            Number(n.fatG) || 0
          }g · K: ${Number(n.carbsG) || 0}g`,
          rawTimestamp: n.consumedAt,
        });
      }
    }

    // Sort descending by rawTimestamp
    timeline.sort((a, b) => b.rawTimestamp.getTime() - a.rawTimestamp.getTime());
    return timeline;
  }

  async getDeterministicInsights(userId: string, referenceDate: Date = new Date()): Promise<DeterministicInsight[]> {
    const summary = await this.getDashboardSummary(userId, '7D', referenceDate);
    return summary.deterministicInsights;
  }
}
