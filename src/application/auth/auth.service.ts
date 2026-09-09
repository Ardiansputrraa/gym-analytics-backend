import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository.interface';
import {
  OTP_TOKEN_REPOSITORY,
  type IOtpTokenRepository,
} from '../../domain/repositories/otp-token.repository.interface';
import { OtpType } from '../../domain/enums/otp-type.enum';
import { MailService } from '../../infrastructure/mail/mail.service';
import {
  RegisterDto,
  VerifyEmailDto,
  ResendOtpDto,
  LoginDto,
  RegisterResponseDto,
  VerifyEmailResponseDto,
  ResendOtpResponseDto,
  LoginResponseDto,
} from '../../modules/auth/schemas';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(OTP_TOKEN_REPOSITORY)
    private readonly otpTokenRepository: IOtpTokenRepository,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser && existingUser.emailVerifiedAt) {
      throw new ConflictException({
        message: 'An account with this email already exists',
        code: 'EMAIL_ALREADY_EXISTS',
        errors: [],
      });
    }

    const passwordHash = await argon2.hash(dto.password);
    let userId: string;

    if (existingUser) {
      // Unverified user registering again - update password and generate new OTP
      userId = existingUser.id;
    } else {
      const newUser = await this.userRepository.create({
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone ?? null,
      });
      userId = newUser.id;
    }

    // Invalidate existing pending OTPs
    await this.otpTokenRepository.invalidateAllPending(
      userId,
      OtpType.EMAIL_VERIFICATION,
    );

    // Generate 6-digit numeric OTP (stored as plain text)
    const otp = crypto.randomInt(100000, 1000000).toString();

    const expiresInMinutes = Number(
      this.configService.get<number>('OTP_EXPIRES_MINUTES', 5),
    );
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.otpTokenRepository.create({
      userId,
      tokenHash: otp,
      type: OtpType.EMAIL_VERIFICATION,
      expiresAt,
    });

    // Send verification email via SMTP
    await this.mailService.sendOtpEmail(dto.email, otp, expiresInMinutes);

    return {
      userId,
      email: dto.email,
      name: dto.name,
      phone: dto.phone ?? null,
      isEmailVerified: false,
      message:
        'Registration successful. Please verify your email using the 6-digit code sent to your inbox.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new NotFoundException({
        message: 'Account not found',
        code: 'USER_NOT_FOUND',
        errors: [],
      });
    }

    if (user.emailVerifiedAt) {
      throw new BadRequestException({
        message: 'Email is already verified',
        code: 'EMAIL_ALREADY_VERIFIED',
        errors: [],
      });
    }

    const tokenRecord = await this.otpTokenRepository.findLatestActive(
      user.id,
      OtpType.EMAIL_VERIFICATION,
    );

    if (!tokenRecord) {
      throw new BadRequestException({
        message: 'No active OTP found. Please request a new verification code.',
        code: 'OTP_NOT_FOUND',
        errors: [],
      });
    }

    const maxAttempts = Number(
      this.configService.get<number>('OTP_MAX_ATTEMPTS', 5),
    );

    if (tokenRecord.attempts >= maxAttempts) {
      throw new BadRequestException({
        message:
          'Maximum verification attempts exceeded. Please request a new code.',
        code: 'OTP_MAX_ATTEMPTS_EXCEEDED',
        errors: [],
      });
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new BadRequestException({
        message: 'Verification code has expired. Please request a new one.',
        code: 'OTP_EXPIRED',
        errors: [],
      });
    }

    // Direct comparison with plain text OTP
    const isMatch = tokenRecord.tokenHash === dto.otp;

    if (!isMatch) {
      await this.otpTokenRepository.incrementAttempts(tokenRecord.id);
      const remainingAttempts = Math.max(
        0,
        maxAttempts - (tokenRecord.attempts + 1),
      );

      throw new BadRequestException({
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        code: 'OTP_INVALID',
        errors: [],
      });
    }

    const now = new Date();
    await this.otpTokenRepository.markAsUsed(tokenRecord.id, now);
    await this.userRepository.markEmailVerified(user.id, now);

    return {
      userId: user.id,
      email: user.email,
      isEmailVerified: true,
      message: 'Email verified successfully. You can now log in.',
    };
  }

  async resendOtp(dto: ResendOtpDto): Promise<ResendOtpResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new NotFoundException({
        message: 'Account not found',
        code: 'USER_NOT_FOUND',
        errors: [],
      });
    }

    const type = dto.type ?? OtpType.EMAIL_VERIFICATION;

    if (type === OtpType.EMAIL_VERIFICATION && user.emailVerifiedAt) {
      throw new BadRequestException({
        message: 'Email is already verified',
        code: 'EMAIL_ALREADY_VERIFIED',
        errors: [],
      });
    }

    // Invalidate existing pending OTPs for this user and type
    await this.otpTokenRepository.invalidateAllPending(user.id, type);

    // Generate new 6-digit numeric OTP (stored as plain text)
    const otp = crypto.randomInt(100000, 1000000).toString();

    const expiresInMinutes = Number(
      this.configService.get<number>('OTP_EXPIRES_MINUTES', 5),
    );
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.otpTokenRepository.create({
      userId: user.id,
      tokenHash: otp,
      type,
      expiresAt,
    });

    // Send verification email via SMTP
    await this.mailService.sendOtpEmail(user.email, otp, expiresInMinutes);

    return {
      userId: user.id,
      email: user.email,
      message: 'A new verification code has been sent to your email.',
    };
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        errors: [],
      });
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        errors: [],
      });
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({
        message:
          'Email address has not been verified yet. Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
        errors: [],
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        message: 'Your account has been deactivated or suspended.',
        code: 'ACCOUNT_SUSPENDED',
        errors: [],
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const expiresInConfig = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '15m',
    );
    const expiresIn = this.parseExpiresInToSeconds(expiresInConfig);

    return {
      accessToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? null,
        role: user.role,
      },
    };
  }

  private parseExpiresInToSeconds(expiresIn: string): number {
    if (!expiresIn) return 900;
    const match = expiresIn.match(/^(\d+)([smhd]?)$/);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return value;
    }
  }
}

