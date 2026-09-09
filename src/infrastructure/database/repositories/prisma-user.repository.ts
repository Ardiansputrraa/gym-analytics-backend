import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateUserData,
  IUserRepository,
} from '../../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/enums/user-role.enum';
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
        role: data.role ?? UserRole.USER,
      },
    });
    return this.toEntity(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
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

  private toEntity(record: PrismaUser): UserEntity {
    return new UserEntity({
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      name: record.name,
      phone: record.phone,
      role: record.role as UserRole,
      isActive: record.isActive,
      emailVerifiedAt: record.emailVerifiedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    });
  }
}
