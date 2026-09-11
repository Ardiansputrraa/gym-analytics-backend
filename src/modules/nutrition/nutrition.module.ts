import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NutritionController } from './nutrition.controller';
import { NUTRITION_REPOSITORY_TOKEN } from '../../domain/repositories/nutrition.repository.interface';
import { PrismaNutritionRepository } from '../../infrastructure/database/repositories/prisma-nutrition.repository';
import { DAILY_CALORIE_TARGET_REPOSITORY } from '../../domain/repositories/daily-calorie-target.repository.interface';
import { PrismaDailyCalorieTargetRepository } from '../../infrastructure/database/repositories/prisma-daily-calorie-target.repository';
import { USER_PROFILE_REPOSITORY } from '../../domain/repositories/user-profile.repository.interface';
import { PrismaUserProfileRepository } from '../../infrastructure/database/repositories/prisma-user-profile.repository';
import { WORKOUT_REPOSITORY_TOKEN } from '../../domain/repositories/workout.repository.interface';
import { PrismaWorkoutRepository } from '../../infrastructure/database/repositories/prisma-workout.repository';
import { LogNutritionEntryUseCase } from '../../application/nutrition/log-nutrition-entry.use-case';
import { GetDailyNutritionSummaryUseCase } from '../../application/nutrition/get-daily-nutrition-summary.use-case';
import { GetNutritionHistoryUseCase } from '../../application/nutrition/get-nutrition-history.use-case';
import { UpdateNutritionEntryUseCase } from '../../application/nutrition/update-nutrition-entry.use-case';
import { DeleteNutritionEntryUseCase } from '../../application/nutrition/delete-nutrition-entry.use-case';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NutritionController],
  providers: [
    {
      provide: NUTRITION_REPOSITORY_TOKEN,
      useClass: PrismaNutritionRepository,
    },
    {
      provide: DAILY_CALORIE_TARGET_REPOSITORY,
      useClass: PrismaDailyCalorieTargetRepository,
    },
    {
      provide: USER_PROFILE_REPOSITORY,
      useClass: PrismaUserProfileRepository,
    },
    {
      provide: WORKOUT_REPOSITORY_TOKEN,
      useClass: PrismaWorkoutRepository,
    },
    LogNutritionEntryUseCase,
    GetDailyNutritionSummaryUseCase,
    GetNutritionHistoryUseCase,
    UpdateNutritionEntryUseCase,
    DeleteNutritionEntryUseCase,
  ],
  exports: [
    NUTRITION_REPOSITORY_TOKEN,
    GetDailyNutritionSummaryUseCase,
  ],
})
export class NutritionModule {}
