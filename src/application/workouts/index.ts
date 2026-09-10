import { StartWorkoutUseCase } from './start-workout.use-case';
import { GetActiveWorkoutUseCase } from './get-active-workout.use-case';
import { FinishWorkoutUseCase } from './finish-workout.use-case';
import { CancelWorkoutUseCase } from './cancel-workout.use-case';
import { WorkoutExercisesUseCase } from './workout-exercises.use-case';
import { WorkoutSetsUseCase } from './workout-sets.use-case';
import { GetWorkoutHistoryUseCase } from './get-workout-history.use-case';
import { GetWorkoutAnalyticsUseCase } from './get-workout-analytics.use-case';
import { GetRoutineTemplatesUseCase } from './get-routine-templates.use-case';

export * from './start-workout.use-case';
export * from './get-active-workout.use-case';
export * from './finish-workout.use-case';
export * from './cancel-workout.use-case';
export * from './workout-exercises.use-case';
export * from './workout-sets.use-case';
export * from './get-workout-history.use-case';
export * from './get-workout-analytics.use-case';
export * from './get-routine-templates.use-case';

export const WORKOUT_USE_CASES = [
  StartWorkoutUseCase,
  GetActiveWorkoutUseCase,
  FinishWorkoutUseCase,
  CancelWorkoutUseCase,
  WorkoutExercisesUseCase,
  WorkoutSetsUseCase,
  GetWorkoutHistoryUseCase,
  GetWorkoutAnalyticsUseCase,
  GetRoutineTemplatesUseCase,
];
