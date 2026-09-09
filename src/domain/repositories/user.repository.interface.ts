import { UserEntity } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string | null;
  role?: UserRole;
}

export const USER_REPOSITORY = Symbol('IUserRepository');

export interface IUserRepository {
  create(data: CreateUserData): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  markEmailVerified(id: string, verifiedAt: Date): Promise<UserEntity>;
  updatePassword(id: string, passwordHash: string): Promise<UserEntity>;
}
