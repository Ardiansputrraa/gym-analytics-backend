import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { CalorieModule } from './modules/calorie/calorie.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { BodyModule } from './modules/body/body.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MailModule,
    AuthModule,
    ProfileModule,
    CalorieModule,
    ExercisesModule,
    WorkoutsModule,
    BodyModule,
    NutritionModule,
  ],
})
export class AppModule {}
