export class UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  isAdmin: boolean;
  isActive: boolean;
  isDeleted: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
