import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AUTH_USE_CASES, OtpService } from '../../application/auth';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { OTP_TOKEN_REPOSITORY } from '../../domain/repositories/otp-token.repository.interface';
import { PrismaUserRepository } from '../../infrastructure/database/repositories/prisma-user.repository';
import { PrismaOtpTokenRepository } from '../../infrastructure/database/repositories/prisma-otp-token.repository';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'default-secret-key-change-in-prod',
        ),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN', '15m') ||
            '15m') as unknown as number,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    ...AUTH_USE_CASES,
    OtpService,
    JwtAuthGuard,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: OTP_TOKEN_REPOSITORY,
      useClass: PrismaOtpTokenRepository,
    },
  ],
  exports: [...AUTH_USE_CASES, OtpService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}


