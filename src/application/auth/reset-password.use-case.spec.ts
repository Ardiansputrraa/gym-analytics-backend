import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { OtpService } from './otp.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { OtpType } from '../../domain/enums/otp-type.enum';

jest.mock('argon2');

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let mockUserRepository: {
    findByEmail: jest.Mock;
    updatePassword: jest.Mock;
  };
  let mockOtpService: {
    verifyOtp: jest.Mock;
  };

  const mockUser = new UserEntity({
    id: 'user-uuid-1',
    email: 'user@example.com',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$oldhash',
    name: 'John Doe',
    isAdmin: false,
    isActive: true,
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      updatePassword: jest.fn(),
    };
    mockOtpService = {
      verifyOtp: jest.fn(),
    };

    (argon2.hash as jest.Mock).mockResolvedValue(
      '$argon2id$v=19$m=65536,t=3,p=4$newhash',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetPasswordUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: OtpService, useValue: mockOtpService },
      ],
    }).compile();

    useCase = module.get<ResetPasswordUseCase>(ResetPasswordUseCase);
  });

  it('should successfully reset password when valid OTP is provided', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    mockOtpService.verifyOtp.mockResolvedValue(true);
    mockUserRepository.updatePassword.mockResolvedValue({
      ...mockUser,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$newhash',
    });

    const result = await useCase.execute({
      email: 'user@example.com',
      otp: '123456',
      newPassword: 'NewPassword123!',
    });

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      'user@example.com',
    );
    expect(mockOtpService.verifyOtp).toHaveBeenCalledWith(
      'user-uuid-1',
      OtpType.PASSWORD_RESET,
      '123456',
    );
    expect(argon2.hash).toHaveBeenCalledWith('NewPassword123!');
    expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
      'user-uuid-1',
      '$argon2id$v=19$m=65536,t=3,p=4$newhash',
    );
    expect(result).toEqual({
      message:
        'Kata sandi berhasil diatur ulang. Anda sekarang dapat masuk dengan kata sandi baru.',
    });
  });

  it('should throw NotFoundException when user does not exist', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'unknown@example.com',
        otp: '123456',
        newPassword: 'NewPassword123!',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mockOtpService.verifyOtp).not.toHaveBeenCalled();
    expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
  });

  it('should propagate error if OTP verification fails', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    mockOtpService.verifyOtp.mockRejectedValue(
      new BadRequestException({
        message: 'Invalid verification code.',
        code: 'INVALID_OTP',
      }),
    );

    await expect(
      useCase.execute({
        email: 'user@example.com',
        otp: '999999',
        newPassword: 'NewPassword123!',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
  });
});
