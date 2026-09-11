import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ResendOtpUseCase } from './resend-otp.use-case';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { OtpService } from './otp.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { OtpType } from '../../domain/enums/otp-type.enum';
import { UserEntity } from '../../domain/entities/user.entity';

describe('ResendOtpUseCase', () => {
  let resendOtpUseCase: ResendOtpUseCase;
  let mockUserRepository: {
    findByEmail: jest.Mock;
  };
  let mockOtpService: {
    resendOtp: jest.Mock;
  };
  let mockMailService: {
    sendOtpEmail: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
  };

  beforeEach(async () => {
    mockUserRepository = {
      findByEmail: jest.fn(),
    };

    mockOtpService = {
      resendOtp: jest.fn().mockResolvedValue({
        otp: '654321',
        expiresInMinutes: 5,
      }),
    };

    mockMailService = {
      sendOtpEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendOtpUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: OtpService, useValue: mockOtpService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    resendOtpUseCase = module.get<ResendOtpUseCase>(ResendOtpUseCase);
  });

  it('should successfully resend OTP for valid unverified user (EMAIL_VERIFICATION)', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      new UserEntity({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        phone: '081234567890',
        passwordHash: 'hashed_password',
        isAdmin: false,
        isActive: true,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    );

    const result = await resendOtpUseCase.execute({
      email: 'test@example.com',
      type: OtpType.EMAIL_VERIFICATION,
    });

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(mockOtpService.resendOtp).toHaveBeenCalledWith(
      'user-uuid-1',
      OtpType.EMAIL_VERIFICATION,
    );
    expect(mockMailService.sendOtpEmail).toHaveBeenCalledWith(
      'test@example.com',
      '654321',
      5,
    );
    expect(result.userId).toBe('user-uuid-1');
    expect(result.email).toBe('test@example.com');
  });

  it('should successfully resend OTP for PASSWORD_RESET even if email is verified', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      new UserEntity({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        phone: '081234567890',
        passwordHash: 'hashed_password',
        isAdmin: false,
        isActive: true,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    );

    const result = await resendOtpUseCase.execute({
      email: 'test@example.com',
      type: OtpType.PASSWORD_RESET,
    });

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(mockOtpService.resendOtp).toHaveBeenCalledWith(
      'user-uuid-1',
      OtpType.PASSWORD_RESET,
    );
    expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'test@example.com',
      '654321',
      5,
    );
    expect(result.userId).toBe('user-uuid-1');
    expect(result.email).toBe('test@example.com');
  });

  it('should throw NotFoundException when user does not exist', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      resendOtpUseCase.execute({
        email: 'nonexistent@example.com',
        type: OtpType.EMAIL_VERIFICATION,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mockOtpService.resendOtp).not.toHaveBeenCalled();
    expect(mockMailService.sendOtpEmail).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when email is already verified and type is EMAIL_VERIFICATION', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(
      new UserEntity({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
        passwordHash: 'hashed_password',
        isAdmin: false,
        isActive: true,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    );

    await expect(
      resendOtpUseCase.execute({
        email: 'test@example.com',
        type: OtpType.EMAIL_VERIFICATION,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockOtpService.resendOtp).not.toHaveBeenCalled();
    expect(mockMailService.sendOtpEmail).not.toHaveBeenCalled();
  });
});
