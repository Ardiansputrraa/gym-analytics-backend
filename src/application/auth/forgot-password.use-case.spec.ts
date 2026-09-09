import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ForgotPasswordUseCase } from './forgot-password.use-case';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { OtpService } from './otp.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { OtpType } from '../../domain/enums/otp-type.enum';

describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase;
  let mockUserRepository: {
    findByEmail: jest.Mock;
  };
  let mockOtpService: {
    createOtp: jest.Mock;
  };
  let mockMailService: {
    sendPasswordResetEmail: jest.Mock;
  };

  const mockUser = new UserEntity({
    id: 'user-uuid-1',
    email: 'user@example.com',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$somehash',
    name: 'John Doe',
    role: UserRole.USER,
    isActive: true,
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockUserRepository = {
      findByEmail: jest.fn(),
    };
    mockOtpService = {
      createOtp: jest.fn(),
    };
    mockMailService = {
      sendPasswordResetEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForgotPasswordUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: OtpService, useValue: mockOtpService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    useCase = module.get<ForgotPasswordUseCase>(ForgotPasswordUseCase);
  });

  it('should successfully send password reset OTP when email exists', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    mockOtpService.createOtp.mockResolvedValue({
      otp: '654321',
      expiresInMinutes: 5,
    });
    mockMailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    const result = await useCase.execute({ email: 'user@example.com' });

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      'user@example.com',
    );
    expect(mockOtpService.createOtp).toHaveBeenCalledWith(
      'user-uuid-1',
      OtpType.PASSWORD_RESET,
    );
    expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'user@example.com',
      '654321',
      5,
    );
    expect(result).toEqual({
      message: 'Password reset code has been sent to your email.',
    });
  });

  it('should throw NotFoundException when user does not exist', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'unknown@example.com' }),
    ).rejects.toThrow(NotFoundException);

    expect(mockOtpService.createOtp).not.toHaveBeenCalled();
    expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
