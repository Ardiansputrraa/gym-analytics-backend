import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { ANALYTICS_USE_CASES } from '../../application/analytics';
import { ANALYTICS_REPOSITORY_TOKEN } from '../../domain/repositories/analytics.repository.interface';
import { PrismaAnalyticsRepository } from '../../infrastructure/database/repositories/prisma-analytics.repository';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AnalyticsController],
  providers: [
    ...ANALYTICS_USE_CASES,
    {
      provide: ANALYTICS_REPOSITORY_TOKEN,
      useClass: PrismaAnalyticsRepository,
    },
  ],
  exports: [...ANALYTICS_USE_CASES, ANALYTICS_REPOSITORY_TOKEN],
})
export class AnalyticsModule {}
