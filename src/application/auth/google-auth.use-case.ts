import {
  Injectable,
  Inject,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository.interface';
import { GoogleAuthDto, LoginResponseDto } from '../../modules/auth/schemas';

interface DecodedGooglePayload {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  email_verified?: boolean;
}

@Injectable()
export class GoogleAuthUseCase {
  private readonly logger = new Logger(GoogleAuthUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: GoogleAuthDto): Promise<LoginResponseDto> {
    let email = dto.email;
    let name = dto.name;

    // Decode Google JWT Token / Credential if provided
    const rawToken = dto.credential || dto.idToken;
    if (rawToken) {
      const decoded = this.decodeGoogleToken(rawToken);
      if (decoded) {
        if (decoded.email) email = decoded.email.toLowerCase();
        if (decoded.name && !name) name = decoded.name;
      }
    }

    if (!email) {
      throw new BadRequestException({
        message:
          'Email Google yang valid atau token ID diperlukan untuk Google SSO.',
        code: 'GOOGLE_AUTH_FAILED',
        errors: [],
      });
    }

    // Lookup existing user
    let user = await this.userRepository.findByEmail(email);

    if (user) {
      if (!user.isActive) {
        throw new ForbiddenException({
          message: 'Akun Anda telah dinonaktifkan atau disuspensi.',
          code: 'ACCOUNT_SUSPENDED',
          errors: [],
        });
      }

      // Auto-verify email for Google SSO if not yet verified
      if (!user.emailVerifiedAt) {
        user = await this.userRepository.markEmailVerified(
          user.id,
          new Date(),
        );
      }
    } else {
      // Auto-register new user via Google SSO
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await argon2.hash(randomPassword);

      const displayName =
        name?.trim() || email.split('@')[0] || 'Gym Athlete';

      user = await this.userRepository.create({
        email,
        name: displayName,
        phone: dto.phone ?? null,
        passwordHash,
        isAdmin: false,
        emailVerifiedAt: new Date(),
      });

      this.logger.log(
        `New user registered automatically via Google SSO: ${user.email} (${user.id})`,
      );
    }

    // Generate JWT access token
    const payload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
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
        isAdmin: user.isAdmin,
      },
      message: 'Login Google SSO berhasil! Selamat datang.',
    };
  }

  private decodeGoogleToken(token: string): DecodedGooglePayload | null {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        return JSON.parse(payloadJson) as DecodedGooglePayload;
      }
    } catch {
      this.logger.warn('Failed to parse Google JWT token payload format.');
    }
    return null;
  }

  private parseExpiresInToSeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes (900 seconds)

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
        return 900;
    }
  }
}
