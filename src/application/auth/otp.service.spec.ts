import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OTP_TOKEN_REPOSITORY } from '../../domain/repositories/otp-token.repository.interface';
import { OtpType } from '../../domain/enums/otp-type.enum';
import { OtpTokenEntity } from '../../domain/entities/otp-token.entity';

describe('OtpService', () => {
  let otpService: OtpService;
  let mockOtpTokenRepository: {
    create: jest.Mock;
    findLatestActive: jest.Mock;
    incrementAttempts: jest.Mock;
    markAsUsed: jest.Mock;
    invalidateAllPending: jest.Mock;
  };
  let mockConfigService: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    mockOtpTokenRepository = {
      create: jest.fn(),
      findLatestActive: jest.fn(),
      incrementAttempts: jest.fn(),
      markAsUsed: jest.fn(),
      invalidateAllPending: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultVal?: unknown) => {
        if (key === 'OTP_EXPIRES_MINUTES') return 5;
        if (key === 'OTP_MAX_ATTEMPTS') return 5;
        return defaultVal;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: OTP_TOKEN_REPOSITORY, useValue: mockOtpTokenRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    otpService = module.get<OtpService>(OtpService);
  });

  describe('createOtp', () => {
    it('should invalidate existing pending tokens and create a new OTP', async () => {
      mockOtpTokenRepository.create.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-1',
          userId: 'user-uuid-1',
          tokenHash: '123456',
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: null,
          attempts: 0,
          createdAt: new Date(),
        }),
      );

      const result = await otpService.createOtp(
        'user-uuid-1',
        OtpType.EMAIL_VERIFICATION,
      );

      expect(mockOtpTokenRepository.invalidateAllPending).toHaveBeenCalledWith(
        'user-uuid-1',
        OtpType.EMAIL_VERIFICATION,
      );
      expect(mockOtpTokenRepository.create).toHaveBeenCalledWith({
        userId: 'user-uuid-1',
        tokenHash: expect.any(String) as string,
        type: OtpType.EMAIL_VERIFICATION,
        expiresAt: expect.any(Date) as Date,
      });
      expect(result.otp).toHaveLength(6);
      expect(result.expiresInMinutes).toBe(5);
    });
  });

  describe('verifyOtp', () => {
    it('should successfully verify when valid OTP is provided', async () => {
      mockOtpTokenRepository.findLatestActive.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-1',
          userId: 'user-uuid-1',
          tokenHash: '123456',
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: null,
          attempts: 0,
          createdAt: new Date(),
        }),
      );

      await expect(
        otpService.verifyOtp(
          'user-uuid-1',
          OtpType.EMAIL_VERIFICATION,
          '123456',
        ),
      ).resolves.toBeUndefined();

      expect(mockOtpTokenRepository.markAsUsed).toHaveBeenCalledWith(
        'otp-uuid-1',
        expect.any(Date),
      );
    });

    it('should throw BadRequestException when no active token found', async () => {
      mockOtpTokenRepository.findLatestActive.mockResolvedValue(null);

      await expect(
        otpService.verifyOtp(
          'user-uuid-1',
          OtpType.EMAIL_VERIFICATION,
          '123456',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when max attempts exceeded', async () => {
      mockOtpTokenRepository.findLatestActive.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-1',
          userId: 'user-uuid-1',
          tokenHash: '123456',
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: null,
          attempts: 5,
          createdAt: new Date(),
        }),
      );

      await expect(
        otpService.verifyOtp(
          'user-uuid-1',
          OtpType.EMAIL_VERIFICATION,
          '123456',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when OTP is expired', async () => {
      mockOtpTokenRepository.findLatestActive.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-1',
          userId: 'user-uuid-1',
          tokenHash: '123456',
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() - 1000), // Expired
          usedAt: null,
          attempts: 0,
          createdAt: new Date(),
        }),
      );

      await expect(
        otpService.verifyOtp(
          'user-uuid-1',
          OtpType.EMAIL_VERIFICATION,
          '123456',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should increment attempts and throw BadRequestException when OTP is invalid', async () => {
      mockOtpTokenRepository.findLatestActive.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-1',
          userId: 'user-uuid-1',
          tokenHash: '654321',
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: null,
          attempts: 1,
          createdAt: new Date(),
        }),
      );

      await expect(
        otpService.verifyOtp(
          'user-uuid-1',
          OtpType.EMAIL_VERIFICATION,
          '111111',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockOtpTokenRepository.incrementAttempts).toHaveBeenCalledWith(
        'otp-uuid-1',
      );
      expect(mockOtpTokenRepository.markAsUsed).not.toHaveBeenCalled();
    });
  });

  describe('resendOtp', () => {
    it('should call createOtp and return generated OTP', async () => {
      mockOtpTokenRepository.create.mockResolvedValue(
        new OtpTokenEntity({
          id: 'otp-uuid-2',
          userId: 'user-uuid-1',
          tokenHash: '654321',
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          usedAt: null,
          attempts: 0,
          createdAt: new Date(),
        }),
      );

      const result = await otpService.resendOtp(
        'user-uuid-1',
        OtpType.EMAIL_VERIFICATION,
      );

      expect(result.otp).toBeDefined();
      expect(result.expiresInMinutes).toBe(5);
    });
  });
});
