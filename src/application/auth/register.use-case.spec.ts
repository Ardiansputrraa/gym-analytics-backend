import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { RegisterUseCase } from './register.use-case';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { OtpService } from './otp.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { UserRole } from '../../domain/enums/user-role.enum';
import { OtpType } from '../../domain/enums/otp-type.enum';
import { UserEntity } from '../../domain/entities/user.entity';

describe('RegisterUseCase', () => {
  let registerUseCase: RegisterUseCase;
  let mockUserRepository: {
    create: jest.Mock;
    findByEmail: jest.Mock;
  };
  let mockOtpService: {
    createOtp: jest.Mock;
  };
  let mockMailService: {
    sendOtpEmail: jest.Mock;
  };

  beforeEach(async () => {
    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };

    mockOtpService = {
      createOtp: jest.fn().mockResolvedValue({
        otp: '123456',
        expiresInMinutes: 5,
      }),
    };

    mockMailService = {
      sendOtpEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: OtpService, useValue: mockOtpService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    registerUseCase = module.get<RegisterUseCase>(RegisterUseCase);
  });

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

    const result = await registerUseCase.execute({
      name: 'Test User',
      email: 'test@example.com',
      phone: '081234567890',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(mockUserRepository.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      passwordHash: expect.any(String) as string,
      name: 'Test User',
      phone: '081234567890',
    });
    expect(mockOtpService.createOtp).toHaveBeenCalledWith(
      'user-uuid-1',
      OtpType.EMAIL_VERIFICATION,
    );
    expect(mockMailService.sendOtpEmail).toHaveBeenCalledWith(
      'test@example.com',
      '123456',
      5,
    );
    expect(result.userId).toBe('user-uuid-1');
    expect(result.isEmailVerified).toBe(false);
  });

  it('should throw ConflictException when email is already registered and verified', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      new UserEntity({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Existing User',
        phone: null,
        passwordHash: 'hashed_password',
        role: UserRole.USER,
        isActive: true,
        emailVerifiedAt: new Date(), // Already verified
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    );

    await expect(
      registerUseCase.execute({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    ).rejects.toThrow(ConflictException);

    expect(mockUserRepository.create).not.toHaveBeenCalled();
    expect(mockOtpService.createOtp).not.toHaveBeenCalled();
    expect(mockMailService.sendOtpEmail).not.toHaveBeenCalled();
  });

  it('should reuse unverified existing user and send a new OTP', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      new UserEntity({
        id: 'existing-unverified-id',
        email: 'test@example.com',
        name: 'Old Name',
        phone: null,
        passwordHash: 'old_hashed_password',
        role: UserRole.USER,
        isActive: true,
        emailVerifiedAt: null, // Not verified
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    );

    const result = await registerUseCase.execute({
      name: 'New Name',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(mockUserRepository.create).not.toHaveBeenCalled();
    expect(mockOtpService.createOtp).toHaveBeenCalledWith(
      'existing-unverified-id',
      OtpType.EMAIL_VERIFICATION,
    );
    expect(mockMailService.sendOtpEmail).toHaveBeenCalled();
    expect(result.userId).toBe('existing-unverified-id');
  });
});
