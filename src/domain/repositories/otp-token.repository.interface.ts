import { OtpTokenEntity } from '../entities/otp-token.entity';
import { OtpType } from '../enums/otp-type.enum';

export interface CreateOtpTokenData {
  userId: string;
  tokenHash: string;
  type: OtpType;
  expiresAt: Date;
}

export const OTP_TOKEN_REPOSITORY = Symbol('IOtpTokenRepository');

export interface IOtpTokenRepository {
  create(data: CreateOtpTokenData): Promise<OtpTokenEntity>;
  findLatestActive(userId: string, type: OtpType): Promise<OtpTokenEntity | null>;
  incrementAttempts(id: string): Promise<OtpTokenEntity>;
  markAsUsed(id: string, usedAt: Date): Promise<OtpTokenEntity>;
  invalidateAllPending(userId: string, type: OtpType): Promise<void>;
}
