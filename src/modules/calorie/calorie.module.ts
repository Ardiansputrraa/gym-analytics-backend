import { Module } from '@nestjs/common';
import { CalorieController } from './calorie.controller';
import { CALORIE_USE_CASES } from '../../application/calorie';
import { DAILY_CALORIE_TARGET_REPOSITORY } from '../../domain/repositories/daily-calorie-target.repository.interface';
import { USER_PROFILE_REPOSITORY } from '../../domain/repositories/user-profile.repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { PrismaDailyCalorieTargetRepository } from '../../infrastructure/database/repositories/prisma-daily-calorie-target.repository';
import { PrismaUserProfileRepository } from '../../infrastructure/database/repositories/prisma-user-profile.repository';
import { PrismaUserRepository } from '../../infrastructure/database/repositories/prisma-user.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CalorieController],
  providers: [
    ...CALORIE_USE_CASES,
    {
      provide: DAILY_CALORIE_TARGET_REPOSITORY,
      useClass: PrismaDailyCalorieTargetRepository,
    },
    {
      provide: USER_PROFILE_REPOSITORY,
      useClass: PrismaUserProfileRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [...CALORIE_USE_CASES, DAILY_CALORIE_TARGET_REPOSITORY],
})
export class CalorieModule {}
