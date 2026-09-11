import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IWorkoutRepository,
  WORKOUT_REPOSITORY_TOKEN,
} from '../../domain/repositories/workout.repository.interface';
import {
  IUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from '../../domain/repositories/user-profile.repository.interface';
import { WorkoutEntity, PersonalRecordEntity } from '../../domain/entities/workout.entity';
import { WorkoutStatus } from '../../domain/enums/workout.enums';
import {
  PersonalRecordEngine,
  NewSetCandidate,
} from '../../domain/calculators/personal-record.engine';
import { WorkoutVolumeCalculator } from '../../domain/calculators/workout-volume.calculator';
import { WorkoutTelemetryCalculator } from '../../domain/calculators/workout-telemetry.calculator';

export interface FinishWorkoutResult {
  workout: WorkoutEntity;
  newPersonalRecords: PersonalRecordEntity[];
  summary: {
    totalVolumeKg: number;
    totalCompletedSets: number;
    sessionDurationMinutes: number;
    activeRatioPct: number;
    estimatedCaloriesBurned: number;
  };
}

@Injectable()
export class FinishWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY_TOKEN)
    private readonly workoutRepository: IWorkoutRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profileRepository: IUserProfileRepository,
  ) {}

  async execute(userId: string, workoutId: string): Promise<FinishWorkoutResult> {
    const workout = await this.workoutRepository.findById(workoutId);
    if (!workout || workout.userId !== userId) {
      throw new NotFoundException('Sesi latihan tidak ditemukan.');
    }

    if (workout.status === WorkoutStatus.COMPLETED) {
      throw new BadRequestException('Sesi latihan ini sudah diselesaikan sebelumnya.');
    }

    // 1. Gather all completed sets for PR checking
    const setCandidates: NewSetCandidate[] = [];
    const exerciseIds: string[] = [];

    for (const ex of workout.exercises) {
      exerciseIds.push(ex.exerciseId);
      for (const s of ex.sets) {
        if (s.isCompleted) {
          setCandidates.push({
            setId: s.id,
            exerciseId: ex.exerciseId,
            weightKg: s.weightKg,
            reps: s.reps,
            isCompleted: true,
          });
        }
      }
    }

    // 2. Fetch existing user PRs for these exercises
    const existingPRs = await this.workoutRepository.findUserPRs(userId, exerciseIds);

    // 3. Evaluate new PRs
    const detectedPRs = PersonalRecordEngine.evaluateNewRecords(setCandidates, existingPRs);

    // 4. Save newly detected PRs
    let newPRs: PersonalRecordEntity[] = [];
    if (detectedPRs.length > 0) {
      newPRs = await this.workoutRepository.savePRs(
        detectedPRs.map((d) => ({
          userId,
          exerciseId: d.exerciseId,
          workoutSetId: d.workoutSetId,
          recordType: d.recordType,
          value: d.value,
        })),
      );
    }

    // 5. Update workout status to COMPLETED with completedAt timestamp
    const completedWorkout = await this.workoutRepository.updateStatus(
      workoutId,
      WorkoutStatus.COMPLETED,
      new Date(),
    );

    // Fetch user profile weight for accurate calorie telemetry
    const profile = await this.profileRepository.findByUserId(userId);
    const userWeight = profile ? Number(profile.weightKg) : 70;

    // 6. Calculate summary metrics
    const telemetry = WorkoutTelemetryCalculator.calculateSessionTelemetry({
      startedAt: completedWorkout.startedAt || completedWorkout.createdAt,
      completedAt: completedWorkout.completedAt,
      exercises: completedWorkout.exercises.map((e) => {
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

    const allSets = completedWorkout.exercises.flatMap((e) => e.sets);
    const totalVolumeKg = WorkoutVolumeCalculator.calculateTotalVolume(allSets);
    const totalCompletedSets = allSets.filter((s) => s.isCompleted).length;

    return {
      workout: completedWorkout,
      newPersonalRecords: newPRs,
      summary: {
        totalVolumeKg,
        totalCompletedSets,
        sessionDurationMinutes: Math.round(telemetry.sessionDurationSeconds / 60),
        activeRatioPct: telemetry.activeRatioPct,
        estimatedCaloriesBurned: telemetry.estimatedCaloriesBurned,
      },
    };
  }
}
