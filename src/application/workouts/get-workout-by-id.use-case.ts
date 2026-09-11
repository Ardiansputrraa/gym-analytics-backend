import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  IWorkoutRepository,
  WORKOUT_REPOSITORY_TOKEN,
} from '../../domain/repositories/workout.repository.interface';
import {
  IUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from '../../domain/repositories/user-profile.repository.interface';
import { WorkoutEntity, PersonalRecordEntity } from '../../domain/entities/workout.entity';
import { WorkoutVolumeCalculator } from '../../domain/calculators/workout-volume.calculator';
import { WorkoutTelemetryCalculator } from '../../domain/calculators/workout-telemetry.calculator';

export interface WorkoutDetailResult {
  workout: WorkoutEntity;
  personalRecords: PersonalRecordEntity[];
  summary: {
    totalVolumeKg: number;
    totalCompletedSets: number;
    sessionDurationMinutes: number;
    activeDurationMinutes: number;
    restDurationMinutes: number;
    activeRatioPct: number;
    densityPct: number;
    estimatedCaloriesBurned: number;
    resistanceCalories: number;
    cardioCalories: number;
    cardioMinutes: number;
    cardioDistanceKm: number;
  };
}

@Injectable()
export class GetWorkoutByIdUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY_TOKEN)
    private readonly workoutRepository: IWorkoutRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profileRepository: IUserProfileRepository,
  ) {}

  async execute(userId: string, workoutId: string): Promise<WorkoutDetailResult> {
    const workout = await this.workoutRepository.findById(workoutId);
    if (!workout) {
      throw new NotFoundException('Sesi latihan tidak ditemukan.');
    }

    if (workout.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke sesi latihan ini.');
    }

    // Fetch user profile weight for accurate calorie telemetry
    const profile = await this.profileRepository.findByUserId(userId);
    const userWeight = profile ? Number(profile.weightKg) : 70;

    // 1. Calculate telemetry
    const telemetry = WorkoutTelemetryCalculator.calculateSessionTelemetry({
      startedAt: workout.startedAt || workout.createdAt,
      completedAt: workout.completedAt,
      exercises: workout.exercises.map((e) => {
        const isCardio = Boolean(
          e.equipment === 'TREADMILL' ||
          e.equipment === 'STATIONARY_BIKE' ||
          e.equipment === 'STAIR_MASTER' ||
          e.equipment === 'ROWING_MACHINE' ||
          e.equipment === 'ELLIPTICAL' ||
          e.primaryMuscle === 'CARDIO' ||
          (e.exerciseName && (
            e.exerciseName.toLowerCase().includes('treadmill') ||
            e.exerciseName.toLowerCase().includes('cardio') ||
            e.exerciseName.toLowerCase().includes('sepeda') ||
            e.exerciseName.toLowerCase().includes('bike') ||
            e.exerciseName.toLowerCase().includes('lari') ||
            e.exerciseName.toLowerCase().includes('running')
          )),
        );

        return {
          startedAt: e.startedAt,
          completedAt: e.completedAt,
          isCardio,
          sets: e.sets.map((s) => ({
            durationSeconds: s.durationSeconds,
            restSeconds: s.restSeconds,
            weightKg: s.weightKg,
            reps: s.reps,
            isCompleted: s.isCompleted,
            isCardio,
            inclinePct: s.inclinePct ?? undefined,
            speedKmh: s.speedKmh ?? undefined,
            caloriesBurned: s.caloriesBurned ? Number(s.caloriesBurned) : undefined,
          })),
        };
      }),
      userWeightKg: userWeight,
    });

    // 2. Aggregate sets, volume, cardio
    const allSets = workout.exercises.flatMap((e) => e.sets);
    const totalVolumeKg = WorkoutVolumeCalculator.calculateTotalVolume(allSets);
    const totalCompletedSets = allSets.filter((s) => s.isCompleted).length;

    let cardioMinutes = 0;
    let cardioDistanceKm = 0;
    for (const e of workout.exercises) {
      for (const s of e.sets) {
        if (s.isCompleted) {
          if (s.distanceKm) cardioDistanceKm += Number(s.distanceKm);
          if (s.inclinePct !== null || s.speedKmh !== null || s.caloriesBurned) {
            cardioMinutes += Math.round(s.durationSeconds / 60);
          }
        }
      }
    }

    // 3. Fetch PRs achieved in this workout
    const exerciseIds = workout.exercises.map((e) => e.exerciseId);
    let sessionPRs: PersonalRecordEntity[] = [];
    if (exerciseIds.length > 0) {
      const prs = await this.workoutRepository.findUserPRs(userId, exerciseIds);
      const setIds = new Set(allSets.map((s) => s.id));
      sessionPRs = prs.filter((pr) => pr.workoutSetId && setIds.has(pr.workoutSetId));
    }

    return {
      workout,
      personalRecords: sessionPRs,
      summary: {
        totalVolumeKg,
        totalCompletedSets,
        sessionDurationMinutes: Math.round(telemetry.sessionDurationSeconds / 60),
        activeDurationMinutes: Math.round(telemetry.activeDurationSeconds / 60),
        restDurationMinutes: Math.round(telemetry.restDurationSeconds / 60),
        activeRatioPct: telemetry.activeRatioPct,
        densityPct: telemetry.densityPct,
        estimatedCaloriesBurned: telemetry.estimatedCaloriesBurned,
        resistanceCalories: telemetry.resistanceCalories,
        cardioCalories: telemetry.cardioCalories,
        cardioMinutes,
        cardioDistanceKm: Math.round(cardioDistanceKm * 100) / 100,
      },
    };
  }
}
