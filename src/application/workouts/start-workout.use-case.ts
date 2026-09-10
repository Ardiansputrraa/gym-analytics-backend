import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import {
  IWorkoutRepository,
  WORKOUT_REPOSITORY_TOKEN,
} from '../../domain/repositories/workout.repository.interface';
import { WorkoutEntity } from '../../domain/entities/workout.entity';

export interface StartWorkoutInput {
  userId: string;
  name?: string;
  routineTemplateId?: string | null;
}

@Injectable()
export class StartWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY_TOKEN)
    private readonly workoutRepository: IWorkoutRepository,
  ) {}

  async execute(input: StartWorkoutInput): Promise<WorkoutEntity> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Cancel expired active sessions from yesterday or previous days
    await this.workoutRepository.cancelExpiredActiveSessions(input.userId, todayStart);

    // 2. Check if user already has an active session today
    const existingActive = await this.workoutRepository.findActiveByUserId(input.userId);
    if (existingActive) {
      return existingActive; // Return existing active session idempotently
    }

    let sessionName = input.name || 'Sesi Latihan Gym';
    let templateExercises: any[] = [];

    // 3. If routine template selected, get details
    if (input.routineTemplateId) {
      const template = await this.workoutRepository.findRoutineTemplateById(input.routineTemplateId);
      if (template) {
        sessionName = template.name;
        templateExercises = template.exercises;
      }
    }

    // 4. Create new workout session
    const workout = await this.workoutRepository.create({
      userId: input.userId,
      name: sessionName,
      routineTemplateId: input.routineTemplateId,
      startedAt: new Date(),
    });

    // 5. If routine template had exercises, populate them
    if (templateExercises.length > 0) {
      for (const tEx of templateExercises) {
        await this.workoutRepository.addExercise({
          workoutId: workout.id,
          exerciseId: tEx.exerciseId,
          orderIndex: tEx.orderIndex,
        });
      }

      // Re-fetch populated workout
      const populated = await this.workoutRepository.findById(workout.id);
      if (populated) return populated;
    }

    return workout;
  }
}
