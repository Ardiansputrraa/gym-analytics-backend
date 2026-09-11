import { Module } from '@nestjs/common';
import { WorkoutsController } from './workouts.controller';
import { WORKOUT_USE_CASES } from '../../application/workouts';
import { WORKOUT_REPOSITORY_TOKEN } from '../../domain/repositories/workout.repository.interface';
import { PrismaWorkoutRepository } from '../../infrastructure/database/repositories/prisma-workout.repository';
import { USER_PROFILE_REPOSITORY } from '../../domain/repositories/user-profile.repository.interface';
import { PrismaUserProfileRepository } from '../../infrastructure/database/repositories/prisma-user-profile.repository';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WorkoutsController],
  providers: [
    ...WORKOUT_USE_CASES,
    {
      provide: WORKOUT_REPOSITORY_TOKEN,
      useClass: PrismaWorkoutRepository,
    },
    {
      provide: USER_PROFILE_REPOSITORY,
      useClass: PrismaUserProfileRepository,
    },
  ],
  exports: [...WORKOUT_USE_CASES, WORKOUT_REPOSITORY_TOKEN],
})
export class WorkoutsModule {}
