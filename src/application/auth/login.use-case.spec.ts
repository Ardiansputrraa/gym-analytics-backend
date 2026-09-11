import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { LoginUseCase } from './login.use-case';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepository: {
    findByEmail: jest.Mock;
  };
  let mockJwtService: {
    signAsync: jest.Mock;
  };
  let mockConfigService: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    mockUserRepository = {
      findByEmail: jest.fn(),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mocked-jwt-token'),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultVal?: unknown) => {
        if (key === 'JWT_EXPIRES_IN') return '15m';
        return defaultVal;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    loginUseCase = module.get<LoginUseCase>(LoginUseCase);
  });

  it('should successfully log in verified user and return access token', async () => {
    const plainPassword = 'Password123!';
    const passwordHash = await argon2.hash(plainPassword);

    mockUserRepository.findByEmail.mockResolvedValue(
      new UserEntity({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        phone: '081234567890',
        passwordHash,
        isAdmin: false,
        isActive: true,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    );

    const result = await loginUseCase.execute({
      email: 'test@example.com',
      password: plainPassword,
    });

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-uuid-1',
      email: 'test@example.com',
      isAdmin: false,
    });
    expect(result.accessToken).toBe('mocked-jwt-token');
    expect(result.expiresIn).toBe(900);
    expect(result.user).toEqual({
      id: 'user-uuid-1',
      email: 'test@example.com',
      name: 'Test User',
      phone: '081234567890',
      isAdmin: false,
    });
  });

  it('should throw UnauthorizedException when user does not exist', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      loginUseCase.execute({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockJwtService.signAsync).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when password is incorrect', async () => {
    const passwordHash = await argon2.hash('CorrectPassword123!');

    mockUserRepository.findByEmail.mockResolvedValue(
      new UserEntity({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
        passwordHash,
        isAdmin: false,
        isActive: true,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    );

    await expect(
      loginUseCase.execute({
        email: 'test@example.com',
        password: 'WrongPassword123!',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockJwtService.signAsync).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when email is not verified', async () => {
    const plainPassword = 'Password123!';
    const passwordHash = await argon2.hash(plainPassword);

    mockUserRepository.findByEmail.mockResolvedValue(
      new UserEntity({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
        passwordHash,
        isAdmin: false,
        isActive: true,
        emailVerifiedAt: null, // Unverified
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    );

    await expect(
      loginUseCase.execute({
        email: 'test@example.com',
        password: plainPassword,
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(mockJwtService.signAsync).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when account is suspended / inactive', async () => {
    const plainPassword = 'Password123!';
    const passwordHash = await argon2.hash(plainPassword);

    mockUserRepository.findByEmail.mockResolvedValue(
      new UserEntity({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
        passwordHash,
        isAdmin: false,
        isActive: false, // Suspended
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    );

    await expect(
      loginUseCase.execute({
        email: 'test@example.com',
        password: plainPassword,
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(mockJwtService.signAsync).not.toHaveBeenCalled();
  });
});
