import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateOtpTokenData,
  IOtpTokenRepository,
} from '../../../domain/repositories/otp-token.repository.interface';
import { OtpTokenEntity } from '../../../domain/entities/otp-token.entity';
import { OtpType } from '../../../domain/enums/otp-type.enum';
import { OtpToken as PrismaOtpToken } from '@prisma/client';

@Injectable()
export class PrismaOtpTokenRepository implements IOtpTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOtpTokenData): Promise<OtpTokenEntity> {
    const token = await this.prisma.otpToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        type: data.type,
        expiresAt: data.expiresAt,
      },
    });
    return this.toEntity(token);
  }

  async findLatestActive(
    userId: string,
    type: OtpType,
  ): Promise<OtpTokenEntity | null> {
    const token = await this.prisma.otpToken.findFirst({
      where: {
        userId,
        type,
        usedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return token ? this.toEntity(token) : null;
  }

  async incrementAttempts(id: string): Promise<OtpTokenEntity> {
    const token = await this.prisma.otpToken.update({
      where: { id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
    return this.toEntity(token);
  }

  async markAsUsed(id: string, usedAt: Date): Promise<OtpTokenEntity> {
    const token = await this.prisma.otpToken.update({
      where: { id },
      data: {
        usedAt,
      },
    });
    return this.toEntity(token);
  }

  async invalidateAllPending(userId: string, type: OtpType): Promise<void> {
    await this.prisma.otpToken.updateMany({
      where: {
        userId,
        type,
        usedAt: null,
      },
      data: {
        expiresAt: new Date(0),
      },
    });
  }

  private toEntity(record: PrismaOtpToken): OtpTokenEntity {
    return new OtpTokenEntity({
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      type: record.type as OtpType,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
      attempts: record.attempts,
      createdAt: record.createdAt,
    });
  }
}
