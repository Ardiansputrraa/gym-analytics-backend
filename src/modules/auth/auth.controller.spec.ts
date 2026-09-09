import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/auth/auth.service';
import { OtpType } from '../../domain/enums/otp-type.enum';

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: {
    register: jest.Mock;
    login: jest.Mock;
    verifyEmail: jest.Mock;
    resendOtp: jest.Mock;
  };

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      verifyEmail: jest.fn(),
      resendOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/register', () => {
    it('should call authService.register and return response', async () => {
      const response = {
        userId: 'user-uuid',
        email: 'test@example.com',
        name: 'Test User',
        phone: '081234567890',
        isEmailVerified: false,
        message: 'Registration successful',
      };
      mockAuthService.register.mockResolvedValue(response);

      const result = await authController.register({
        name: 'Test User',
        email: 'test@example.com',
        phone: '081234567890',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(mockAuthService.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        phone: '081234567890',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      expect(result).toEqual(response);
    });
  });

  describe('POST /auth/login', () => {
    it('should call authService.login and return access token with user profile', async () => {
      const response = {
        accessToken: 'jwt-access-token',
        expiresIn: 900,
        user: {
          id: 'user-uuid',
          email: 'test@example.com',
          name: 'Test User',
          phone: '081234567890',
          role: 'USER' as const,
        },
      };
      mockAuthService.login.mockResolvedValue(response);

      const result = await authController.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
      });
      expect(result).toEqual(response);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should call authService.verifyEmail and return response', async () => {
      const response = {
        userId: 'user-uuid',
        email: 'test@example.com',
        isEmailVerified: true,
        message: 'Email verified successfully',
      };
      mockAuthService.verifyEmail.mockResolvedValue(response);

      const result = await authController.verifyEmail({
        email: 'test@example.com',
        otp: '123456',
      });

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '123456',
      });
      expect(result).toEqual(response);
    });
  });

  describe('POST /auth/resend-otp', () => {
    it('should call authService.resendOtp and return response', async () => {
      const response = {
        userId: 'user-uuid',
        email: 'test@example.com',
        message: 'A new verification code has been sent to your email.',
      };
      mockAuthService.resendOtp.mockResolvedValue(response);

      const result = await authController.resendOtp({
        email: 'test@example.com',
        type: OtpType.EMAIL_VERIFICATION,
      });

      expect(mockAuthService.resendOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        type: OtpType.EMAIL_VERIFICATION,
      });
      expect(result).toEqual(response);
    });
  });
});

