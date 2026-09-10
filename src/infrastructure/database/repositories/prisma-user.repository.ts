import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateUserData,
  IUserRepository,
} from '../../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../../domain/entities/user.entity';
import { User as PrismaUser } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        phone: data.phone ?? null,
        isAdmin: data.isAdmin ?? false,
        emailVerifiedAt: data.emailVerifiedAt ?? null,
      },
    });
    return this.toEntity(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, isDeleted: false, deletedAt: null },
    });
    return user ? this.toEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        isDeleted: false,
        deletedAt: null,
      },
    });
    return user ? this.toEntity(user) : null;
  }

  async markEmailVerified(id: string, verifiedAt: Date): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        emailVerifiedAt: verifiedAt,
      },
    });
    return this.toEntity(user);
  }

  async updatePassword(id: string, passwordHash: string): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
      },
    });
    return this.toEntity(user);
  }

  private toEntity(record: PrismaUser): UserEntity {
    return new UserEntity({
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      name: record.name,
      phone: record.phone,
      isAdmin: record.isAdmin,
      isActive: record.isActive,
      isDeleted: record.isDeleted,
      emailVerifiedAt: record.emailVerifiedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    });
  }
}
