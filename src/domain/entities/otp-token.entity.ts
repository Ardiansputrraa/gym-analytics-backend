import { OtpType } from '../enums/otp-type.enum';

export class OtpTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  type: OtpType;
  expiresAt: Date;
  usedAt: Date | null;
  attempts: number;
  createdAt: Date;

  constructor(partial: Partial<OtpTokenEntity>) {
    Object.assign(this, partial);
  }
}
