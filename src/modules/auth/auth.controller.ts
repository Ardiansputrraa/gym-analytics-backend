import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  RegisterUseCase,
  LoginUseCase,
  VerifyEmailUseCase,
  ResendOtpUseCase,
  LogoutUseCase,
  GoogleAuthUseCase,
} from '../../application/auth';
import {
  RegisterDto,
  VerifyEmailDto,
  ResendOtpDto,
  LoginDto,
  LogoutDto,
  GoogleAuthDto,
  RegisterResponseDto,
  VerifyEmailResponseDto,
  ResendOtpResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
} from './schemas';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendOtpUseCase: ResendOtpUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly googleAuthUseCase: GoogleAuthUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user account',
    description:
      'Creates a new user account with hashed password and sends a 6-digit OTP verification code via email.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful, OTP code sent to user email.',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed (invalid email format, password too short/simple).',
  })
  @ApiResponse({
    status: 409,
    description: 'Email is already registered and verified.',
  })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.registerUseCase.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user and obtain JWT access token',
    description:
      'Authenticates user with email and password, verifies account status and email verification, and returns a signed JWT access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns access token and user profile.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password (INVALID_CREDENTIALS).',
  })
  @ApiResponse({
    status: 403,
    description:
      'Email address is not verified (EMAIL_NOT_VERIFIED) or account is suspended (ACCOUNT_SUSPENDED).',
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.loginUseCase.execute(dto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Google SSO login and registration',
    description:
      'Authenticates or automatically registers a user with Google OAuth credentials. Returns a signed JWT access token.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Google SSO authentication successful. Returns access token and user profile.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Google token or credentials.',
  })
  @ApiResponse({
    status: 403,
    description: 'User account is deactivated or suspended.',
  })
  async googleAuth(@Body() dto: GoogleAuthDto): Promise<LoginResponseDto> {
    return this.googleAuthUseCase.execute(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user session',
    description: 'Terminates user session and invalidates access credentials.',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out.',
    type: LogoutResponseDto,
  })
  async logout(@Body() dto?: LogoutDto): Promise<LogoutResponseDto> {
    return this.logoutUseCase.execute(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify user email with OTP',
    description:
      'Verifies user email using the 6-digit code received via email. Marks user as verified.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully.',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP code, OTP expired, or max attempts exceeded.',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found.',
  })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
  ): Promise<VerifyEmailResponseDto> {
    return this.verifyEmailUseCase.execute(dto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend / reset OTP verification code',
    description:
      'Invalidates any active OTP code and generates/sends a fresh 6-digit OTP code to the user email.',
  })
  @ApiResponse({
    status: 200,
    description: 'New OTP code sent to user email.',
    type: ResendOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or email is already verified.',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found.',
  })
  async resendOtp(@Body() dto: ResendOtpDto): Promise<ResendOtpResponseDto> {
    return this.resendOtpUseCase.execute(dto);
  }
}
