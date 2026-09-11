import { Module } from '@nestjs/common';
import { BodyController } from './body.controller';
import {
  LogBodyMeasurementUseCase,
  GetBodyMeasurementsUseCase,
  GetBodyCompositionAnalyticsUseCase,
  DeleteBodyMeasurementUseCase,
} from '../../application/body';
import { BODY_MEASUREMENT_REPOSITORY_TOKEN } from '../../domain/repositories/body-measurement.repository.interface';
import { PrismaBodyMeasurementRepository } from '../../infrastructure/database/repositories/prisma-body-measurement.repository';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { CalorieModule } from '../calorie/calorie.module';

@Module({
  imports: [AuthModule, ProfileModule, CalorieModule],
  controllers: [BodyController],
  providers: [
    LogBodyMeasurementUseCase,
    GetBodyMeasurementsUseCase,
    GetBodyCompositionAnalyticsUseCase,
    DeleteBodyMeasurementUseCase,
    {
      provide: BODY_MEASUREMENT_REPOSITORY_TOKEN,
      useClass: PrismaBodyMeasurementRepository,
    },
  ],
  exports: [
    LogBodyMeasurementUseCase,
    GetBodyMeasurementsUseCase,
    GetBodyCompositionAnalyticsUseCase,
    DeleteBodyMeasurementUseCase,
    BODY_MEASUREMENT_REPOSITORY_TOKEN,
  ],
})
export class BodyModule {}
