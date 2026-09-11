import { Module } from '@nestjs/common';
import { WorkoutsController } from './workouts.controller';
import { WORKOUT_USE_CASES } from '../../application/workouts';
import { WORKOUT_REPOSITORY_TOKEN } from '../../domain/repositories/workout.repository.interface';
import { PrismaWorkoutRepository } from '../../infrastructure/database/repositories/prisma-workout.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WorkoutsController],
  providers: [
    ...WORKOUT_USE_CASES,
    {
      provide: WORKOUT_REPOSITORY_TOKEN,
      useClass: PrismaWorkoutRepository,
    },
  ],
  exports: [...WORKOUT_USE_CASES, WORKOUT_REPOSITORY_TOKEN],
})
export class WorkoutsModule {}
