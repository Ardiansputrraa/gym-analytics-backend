import {
  Injectable,
  Inject,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository.interface';
import {
  LoginDto,
  LoginResponseDto,
} from '../../modules/auth/schemas';

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponseDto> {
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
