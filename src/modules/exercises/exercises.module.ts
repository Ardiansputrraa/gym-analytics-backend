import { Module } from '@nestjs/common';
import { ExercisesController } from './exercises.controller';
import {
  GetExercisesUseCase,
  GetExerciseByIdUseCase,
  CreateExerciseUseCase,
  UpdateExerciseUseCase,
  DeleteExerciseUseCase,
  GetMuscleGroupsUseCase,
  GetEquipmentsUseCase,
} from '../../application/exercises';
import { EXERCISE_REPOSITORY } from '../../domain/repositories/exercise.repository.interface';
import { PrismaExerciseRepository } from '../../infrastructure/database/repositories/prisma-exercise.repository';
import { AuthModule } from '../auth/auth.module';

const EXERCISE_USE_CASES = [
  GetExercisesUseCase,
  GetExerciseByIdUseCase,
  CreateExerciseUseCase,
  UpdateExerciseUseCase,
  DeleteExerciseUseCase,
  GetMuscleGroupsUseCase,
  GetEquipmentsUseCase,
];

@Module({
  imports: [AuthModule],
  controllers: [ExercisesController],
  providers: [
    ...EXERCISE_USE_CASES,
    {
      provide: EXERCISE_REPOSITORY,
      useClass: PrismaExerciseRepository,
    },
  ],
  exports: [...EXERCISE_USE_CASES, EXERCISE_REPOSITORY],
})
export class ExercisesModule {}
