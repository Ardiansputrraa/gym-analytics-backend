import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  OTP_TOKEN_REPOSITORY,
  type IOtpTokenRepository,
} from '../../domain/repositories/otp-token.repository.interface';
import { OtpType } from '../../domain/enums/otp-type.enum';

export interface GeneratedOtp {
  otp: string;
  expiresInMinutes: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @Inject(OTP_TOKEN_REPOSITORY)
    private readonly otpTokenRepository: IOtpTokenRepository,
    private readonly configService: ConfigService,
  ) {}

  async createOtp(userId: string, type: OtpType): Promise<GeneratedOtp> {
    // Invalidate existing pending OTPs for this user and type
    await this.otpTokenRepository.invalidateAllPending(userId, type);

    // Generate 6-digit numeric OTP (stored as plain text per project configuration)
    const otp = crypto.randomInt(100000, 1000000).toString();

    const expiresInMinutes = Number(
      this.configService.get<number>('OTP_EXPIRES_MINUTES', 5),
    );
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.otpTokenRepository.create({
      userId,
      tokenHash: otp,
      type,
      expiresAt,
    });

    return {
      otp,
      expiresInMinutes,
    };
  }

  async verifyOtp(
    userId: string,
    type: OtpType,
    inputOtp: string,
  ): Promise<void> {
    const tokenRecord = await this.otpTokenRepository.findLatestActive(
      userId,
      type,
    );

    if (!tokenRecord) {
      throw new BadRequestException({
        message: 'No active OTP found. Please request a new verification code.',
        code: 'OTP_NOT_FOUND',
        errors: [],
      });
    }

    const maxAttempts = Number(
      this.configService.get<number>('OTP_MAX_ATTEMPTS', 5),
    );

    if (tokenRecord.attempts >= maxAttempts) {
      throw new BadRequestException({
        message:
          'Maximum verification attempts exceeded. Please request a new code.',
        code: 'OTP_MAX_ATTEMPTS_EXCEEDED',
        errors: [],
      });
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new BadRequestException({
        message: 'Verification code has expired. Please request a new one.',
        code: 'OTP_EXPIRED',
        errors: [],
      });
    }

    // Direct comparison with plain text OTP
    const isMatch = tokenRecord.tokenHash === inputOtp;

    if (!isMatch) {
      await this.otpTokenRepository.incrementAttempts(tokenRecord.id);
      const remainingAttempts = Math.max(
        0,
        maxAttempts - (tokenRecord.attempts + 1),
      );

      throw new BadRequestException({
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        code: 'OTP_INVALID',
        errors: [],
      });
    }

    const now = new Date();
    await this.otpTokenRepository.markAsUsed(tokenRecord.id, now);
  }

  async resendOtp(userId: string, type: OtpType): Promise<GeneratedOtp> {
    return this.createOtp(userId, type);
  }
}
