import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VerifyEmailUseCase } from './verify-email.use-case';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { OtpService } from './otp.service';
import { UserRole } from '../../domain/enums/user-role.enum';
import { OtpType } from '../../domain/enums/otp-type.enum';
import { UserEntity } from '../../domain/entities/user.entity';

describe('VerifyEmailUseCase', () => {
  let verifyEmailUseCase: VerifyEmailUseCase;
  let mockUserRepository: {
    findByEmail: jest.Mock;
    markEmailVerified: jest.Mock;
  };
  let mockOtpService: {
    verifyOtp: jest.Mock;
  };

  beforeEach(async () => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      markEmailVerified: jest.fn(),
    };

    mockOtpService = {
      verifyOtp: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyEmailUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: OtpService, useValue: mockOtpService },
      ],
    }).compile();

    verifyEmailUseCase = module.get<VerifyEmailUseCase>(VerifyEmailUseCase);
  });

  it('should successfully verify email when valid OTP is provided', async () => {
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

    const result = await verifyEmailUseCase.execute({
      email: 'test@example.com',
      otp: '123456',
    });

    expect(mockOtpService.verifyOtp).toHaveBeenCalledWith(
      'user-uuid-1',
      OtpType.EMAIL_VERIFICATION,
      '123456',
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
      verifyEmailUseCase.execute({
        email: 'nonexistent@example.com',
        otp: '123456',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mockOtpService.verifyOtp).not.toHaveBeenCalled();
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
      verifyEmailUseCase.execute({
        email: 'test@example.com',
        otp: '123456',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockOtpService.verifyOtp).not.toHaveBeenCalled();
  });
});
