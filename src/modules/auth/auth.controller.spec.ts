import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import {
  RegisterUseCase,
  LoginUseCase,
  VerifyEmailUseCase,
  ResendOtpUseCase,
  LogoutUseCase,
  GoogleAuthUseCase,
} from '../../application/auth';
import { OtpType } from '../../domain/enums/otp-type.enum';

describe('AuthController', () => {
  let authController: AuthController;
  let mockRegisterUseCase: { execute: jest.Mock };
  let mockLoginUseCase: { execute: jest.Mock };
  let mockVerifyEmailUseCase: { execute: jest.Mock };
  let mockResendOtpUseCase: { execute: jest.Mock };
  let mockLogoutUseCase: { execute: jest.Mock };
  let mockGoogleAuthUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    mockRegisterUseCase = { execute: jest.fn() };
    mockLoginUseCase = { execute: jest.fn() };
    mockVerifyEmailUseCase = { execute: jest.fn() };
    mockResendOtpUseCase = { execute: jest.fn() };
    mockLogoutUseCase = { execute: jest.fn() };
    mockGoogleAuthUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUseCase, useValue: mockRegisterUseCase },
        { provide: LoginUseCase, useValue: mockLoginUseCase },
        { provide: VerifyEmailUseCase, useValue: mockVerifyEmailUseCase },
        { provide: ResendOtpUseCase, useValue: mockResendOtpUseCase },
        { provide: LogoutUseCase, useValue: mockLogoutUseCase },
        { provide: GoogleAuthUseCase, useValue: mockGoogleAuthUseCase },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/register', () => {
    it('should call registerUseCase.execute and return response', async () => {
      const response = {
        userId: 'user-uuid',
        email: 'test@example.com',
        name: 'Test User',
        phone: '081234567890',
        isEmailVerified: false,
        message: 'Registration successful',
      };
      mockRegisterUseCase.execute.mockResolvedValue(response);

      const result = await authController.register({
        name: 'Test User',
        email: 'test@example.com',
        phone: '081234567890',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith({
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
    it('should call loginUseCase.execute and return access token with user profile', async () => {
      const response = {
        accessToken: 'jwt-access-token',
        expiresIn: 900,
        user: {
          id: 'user-uuid',
          email: 'test@example.com',
          name: 'Test User',
          phone: '081234567890',
          isAdmin: false,
        },
      };
      mockLoginUseCase.execute.mockResolvedValue(response);

      const result = await authController.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(mockLoginUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
      });
      expect(result).toEqual(response);
    });
  });

  describe('POST /auth/google', () => {
    it('should call googleAuthUseCase.execute and return access token with user profile', async () => {
      const response = {
        accessToken: 'google-jwt-access-token',
        expiresIn: 900,
        user: {
          id: 'google-user-uuid',
          email: 'athlete@gmail.com',
          name: 'Athlete Google',
          phone: null,
          isAdmin: false,
        },
      };
      mockGoogleAuthUseCase.execute.mockResolvedValue(response);

      const result = await authController.googleAuth({
        email: 'athlete@gmail.com',
        name: 'Athlete Google',
      });

      expect(mockGoogleAuthUseCase.execute).toHaveBeenCalledWith({
        email: 'athlete@gmail.com',
        name: 'Athlete Google',
      });
      expect(result).toEqual(response);
    });
  });

  describe('POST /auth/logout', () => {
    it('should call logoutUseCase.execute and return success response', async () => {
      const response = {
        success: true,
        message: 'Logged out successfully',
      };
      mockLogoutUseCase.execute.mockResolvedValue(response);

      const result = await authController.logout({});
      expect(mockLogoutUseCase.execute).toHaveBeenCalledWith({});
      expect(result).toEqual(response);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should call verifyEmailUseCase.execute and return response', async () => {
      const response = {
        userId: 'user-uuid',
        email: 'test@example.com',
        isEmailVerified: true,
        message: 'Email verified successfully',
      };
      mockVerifyEmailUseCase.execute.mockResolvedValue(response);

      const result = await authController.verifyEmail({
        email: 'test@example.com',
        otp: '123456',
      });

      expect(mockVerifyEmailUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '123456',
      });
      expect(result).toEqual(response);
    });
  });

  describe('POST /auth/resend-otp', () => {
    it('should call resendOtpUseCase.execute and return response', async () => {
      const response = {
        userId: 'user-uuid',
        email: 'test@example.com',
        message: 'A new verification code has been sent to your email.',
      };
      mockResendOtpUseCase.execute.mockResolvedValue(response);

      const result = await authController.resendOtp({
        email: 'test@example.com',
        type: OtpType.EMAIL_VERIFICATION,
      });

      expect(mockResendOtpUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        type: OtpType.EMAIL_VERIFICATION,
      });
      expect(result).toEqual(response);
    });
  });
});
