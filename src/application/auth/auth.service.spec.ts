import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { OTP_TOKEN_REPOSITORY } from '../../domain/repositories/otp-token.repository.interface';
import { MailService } from '../../infrastructure/mail/mail.service';
import { UserRole } from '../../domain/enums/user-role.enum';
import { OtpType } from '../../domain/enums/otp-type.enum';
import { UserEntity } from '../../domain/entities/user.entity';
import { OtpTokenEntity } from '../../domain/entities/otp-token.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByEmail: jest.Mock;
    markEmailVerified: jest.Mock;
  };
  let mockOtpTokenRepository: {
    create: jest.Mock;
    findLatestActive: jest.Mock;
    incrementAttempts: jest.Mock;
    markAsUsed: jest.Mock;
    invalidateAllPending: jest.Mock;
  };
  let mockMailService: {
    sendOtpEmail: jest.Mock;
  };
  let mockJwtService: {
    signAsync: jest.Mock;
  };
  let mockConfigService: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      markEmailVerified: jest.fn(),
    };

    mockOtpTokenRepository = {
      create: jest.fn(),
      findLatestActive: jest.fn(),
      incrementAttempts: jest.fn(),
      markAsUsed: jest.fn(),
      invalidateAllPending: jest.fn(),
    };

    mockMailService = {
      sendOtpEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mocked-jwt-token'),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultVal?: unknown) => {
        if (key === 'OTP_EXPIRES_MINUTES') return 5;
        if (key === 'OTP_MAX_ATTEMPTS') return 5;
        if (key === 'JWT_EXPIRES_IN') return '15m';
        return defaultVal;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: OTP_TOKEN_REPOSITORY, useValue: mockOtpTokenRepository },
        { provide: MailService, useValue: mockMailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should successfully register a new user and send an OTP email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(
        new UserEntity({
          id: 'user-uuid-1',
          email: 'test@example.com',
          name: 'Test User',
          phone: '081234567890',
          passwordHash: 'hashed_password',
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );
      mockOtpTokenRepository.create.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-1',
          userId: 'user-uuid-1',
          tokenHash: 'hashed_otp',
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: null,
          attempts: 0,
          createdAt: new Date(),
        }),
      );

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        phone: '081234567890',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        passwordHash: expect.any(String),
        name: 'Test User',
        phone: '081234567890',
      });
      expect(mockOtpTokenRepository.invalidateAllPending).toHaveBeenCalledWith(
        'user-uuid-1',
        OtpType.EMAIL_VERIFICATION,
      );
      expect(mockOtpTokenRepository.create).toHaveBeenCalled();
      expect(mockMailService.sendOtpEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringMatching(/^\d{6}$/),
        5,
      );
      expect(result.userId).toBe('user-uuid-1');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
      expect(result.phone).toBe('081234567890');
      expect(result.isEmailVerified).toBe(false);
    });

    it('should throw ConflictException when email is already registered and verified', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        new UserEntity({
          id: 'user-uuid-1',
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
          passwordHash: 'hashed_password',
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );

      await expect(
        authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockMailService.sendOtpEmail).not.toHaveBeenCalled();
    });

    it('should reuse existing unverified user and send new OTP', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        new UserEntity({
          id: 'existing-unverified-id',
          email: 'unverified@example.com',
          name: 'Unverified User',
          phone: null,
          passwordHash: 'hashed_old_password',
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );
      mockOtpTokenRepository.create.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-2',
          userId: 'existing-unverified-id',
          tokenHash: 'hashed_otp',
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: null,
          attempts: 0,
          createdAt: new Date(),
        }),
      );

      const result = await authService.register({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockOtpTokenRepository.invalidateAllPending).toHaveBeenCalledWith(
        'existing-unverified-id',
        OtpType.EMAIL_VERIFICATION,
      );
      expect(mockMailService.sendOtpEmail).toHaveBeenCalled();
      expect(result.userId).toBe('existing-unverified-id');
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email when valid OTP is provided', async () => {
      const plainOtp = '123456';
      const tokenHash = '123456';

      mockUserRepository.findByEmail.mockResolvedValue(
        new UserEntity({
          id: 'user-uuid-1',
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
          passwordHash: 'hashed_password',
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );

      mockOtpTokenRepository.findLatestActive.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-1',
          userId: 'user-uuid-1',
          tokenHash,
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: null,
          attempts: 0,
          createdAt: new Date(),
        }),
      );

      mockOtpTokenRepository.markAsUsed.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-1',
          userId: 'user-uuid-1',
          tokenHash,
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: new Date(),
          attempts: 0,
          createdAt: new Date(),
        }),
      );

      mockUserRepository.markEmailVerified.mockResolvedValue(
        new UserEntity({
          id: 'user-uuid-1',
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
          passwordHash: 'hashed_password',
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );

      const result = await authService.verifyEmail({
        email: 'test@example.com',
        otp: plainOtp,
      });

      expect(mockOtpTokenRepository.markAsUsed).toHaveBeenCalledWith(
        'otp-uuid-1',
        expect.any(Date),
      );
      expect(mockUserRepository.markEmailVerified).toHaveBeenCalledWith(
        'user-uuid-1',
        expect.any(Date),
      );
      expect(result.userId).toBe('user-uuid-1');
      expect(result.isEmailVerified).toBe(true);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.verifyEmail({
          email: 'nonexistent@example.com',
          otp: '123456',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when email is already verified', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        new UserEntity({
          id: 'user-uuid-1',
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
          passwordHash: 'hashed_password',
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );

      await expect(
        authService.verifyEmail({
          email: 'test@example.com',
          otp: '123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no active OTP token is found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        new UserEntity({
          id: 'user-uuid-1',
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
          passwordHash: 'hashed_password',
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );
      mockOtpTokenRepository.findLatestActive.mockResolvedValue(null);

      await expect(
        authService.verifyEmail({
          email: 'test@example.com',
          otp: '123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when max attempts exceeded', async () => {
      const tokenHash = '123456';

      mockUserRepository.findByEmail.mockResolvedValue(
        new UserEntity({
          id: 'user-uuid-1',
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
          passwordHash: 'hashed_password',
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );

      mockOtpTokenRepository.findLatestActive.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-1',
          userId: 'user-uuid-1',
          tokenHash,
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: null,
          attempts: 5,
          createdAt: new Date(),
        }),
      );

      await expect(
        authService.verifyEmail({
          email: 'test@example.com',
          otp: '123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when OTP is expired', async () => {
      const tokenHash = '123456';

      mockUserRepository.findByEmail.mockResolvedValue(
        new UserEntity({
          id: 'user-uuid-1',
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
          passwordHash: 'hashed_password',
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );

      mockOtpTokenRepository.findLatestActive.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-1',
          userId: 'user-uuid-1',
          tokenHash,
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() - 1000), // Expired
          usedAt: null,
          attempts: 0,
          createdAt: new Date(),
        }),
      );

      await expect(
        authService.verifyEmail({
          email: 'test@example.com',
          otp: '123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should increment attempts and throw BadRequestException when OTP is invalid', async () => {
      const tokenHash = '654321';

      mockUserRepository.findByEmail.mockResolvedValue(
        new UserEntity({
          id: 'user-uuid-1',
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
          passwordHash: 'hashed_password',
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );

      mockOtpTokenRepository.findLatestActive.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-1',
          userId: 'user-uuid-1',
          tokenHash,
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: null,
          attempts: 1,
          createdAt: new Date(),
        }),
      );

      mockOtpTokenRepository.incrementAttempts.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-1',
          userId: 'user-uuid-1',
          tokenHash,
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: null,
          attempts: 2,
          createdAt: new Date(),
        }),
      );

      await expect(
        authService.verifyEmail({
          email: 'test@example.com',
          otp: '111111', // Wrong OTP
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockOtpTokenRepository.incrementAttempts).toHaveBeenCalledWith(
        'otp-uuid-1',
      );
      expect(mockUserRepository.markEmailVerified).not.toHaveBeenCalled();
    });
  });

  describe('resendOtp', () => {
    it('should successfully resend OTP for valid unverified user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        new UserEntity({
          id: 'user-uuid-1',
          email: 'test@example.com',
          name: 'Test User',
          phone: '081234567890',
          passwordHash: 'hashed_password',
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );
      mockOtpTokenRepository.create.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-new',
          userId: 'user-uuid-1',
          tokenHash: 'new_token_hash',
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: null,
          attempts: 0,
          createdAt: new Date(),
        }),
      );

      const result = await authService.resendOtp({
        email: 'test@example.com',
        type: OtpType.EMAIL_VERIFICATION,
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockOtpTokenRepository.invalidateAllPending).toHaveBeenCalledWith(
        'user-uuid-1',
        OtpType.EMAIL_VERIFICATION,
      );
      expect(mockOtpTokenRepository.create).toHaveBeenCalledWith({
        userId: 'user-uuid-1',
        tokenHash: expect.any(String),
        type: OtpType.EMAIL_VERIFICATION,
        expiresAt: expect.any(Date),
      });
      expect(mockMailService.sendOtpEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringMatching(/^\d{6}$/),
        5,
      );
      expect(result.userId).toBe('user-uuid-1');
      expect(result.email).toBe('test@example.com');
      expect(result.message).toBe('A new verification code has been sent to your email.');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.resendOtp({
          email: 'nonexistent@example.com',
          type: OtpType.EMAIL_VERIFICATION,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockOtpTokenRepository.create).not.toHaveBeenCalled();
      expect(mockMailService.sendOtpEmail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when email is already verified', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        new UserEntity({
          id: 'user-uuid-1',
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
          passwordHash: 'hashed_password',
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );

      await expect(
        authService.resendOtp({
          email: 'test@example.com',
          type: OtpType.EMAIL_VERIFICATION,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockOtpTokenRepository.invalidateAllPending).not.toHaveBeenCalled();
      expect(mockOtpTokenRepository.create).not.toHaveBeenCalled();
      expect(mockMailService.sendOtpEmail).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
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
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );

      const result = await authService.login({
        email: 'test@example.com',
        password: plainPassword,
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-uuid-1',
        email: 'test@example.com',
        role: UserRole.USER,
      });
      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.expiresIn).toBe(900);
      expect(result.user).toEqual({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        phone: '081234567890',
        role: UserRole.USER,
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
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
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );

      await expect(
        authService.login({
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
          role: UserRole.USER,
          isActive: true,
          emailVerifiedAt: null, // Unverified
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );

      await expect(
        authService.login({
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
          role: UserRole.USER,
          isActive: false, // Suspended
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      );

      await expect(
        authService.login({
          email: 'test@example.com',
          password: plainPassword,
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});

