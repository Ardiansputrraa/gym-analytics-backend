import { UserEntity } from '../entities/user.entity';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string | null;
  isAdmin?: boolean;
  emailVerifiedAt?: Date | null;
}

export const USER_REPOSITORY = Symbol('IUserRepository');

export interface IUserRepository {
  create(data: CreateUserData): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  markEmailVerified(id: string, verifiedAt: Date): Promise<UserEntity>;
  updatePassword(id: string, passwordHash: string): Promise<UserEntity>;
}
