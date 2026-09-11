import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { PROFILE_USE_CASES } from '../../application/profile';
import { USER_PROFILE_REPOSITORY } from '../../domain/repositories/user-profile.repository.interface';
import { DAILY_CALORIE_TARGET_REPOSITORY } from '../../domain/repositories/daily-calorie-target.repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import {
  BODY_MEASUREMENT_REPOSITORY_TOKEN,
} from '../../domain/repositories/body-measurement.repository.interface';
import { PrismaUserProfileRepository } from '../../infrastructure/database/repositories/prisma-user-profile.repository';
import { PrismaDailyCalorieTargetRepository } from '../../infrastructure/database/repositories/prisma-daily-calorie-target.repository';
import { PrismaUserRepository } from '../../infrastructure/database/repositories/prisma-user.repository';
import { PrismaBodyMeasurementRepository } from '../../infrastructure/database/repositories/prisma-body-measurement.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProfileController],
  providers: [
    ...PROFILE_USE_CASES,
    {
      provide: USER_PROFILE_REPOSITORY,
      useClass: PrismaUserProfileRepository,
    },
    {
      provide: DAILY_CALORIE_TARGET_REPOSITORY,
      useClass: PrismaDailyCalorieTargetRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: BODY_MEASUREMENT_REPOSITORY_TOKEN,
      useClass: PrismaBodyMeasurementRepository,
    },
  ],
  exports: [...PROFILE_USE_CASES, USER_PROFILE_REPOSITORY],
})
export class ProfileModule {}
