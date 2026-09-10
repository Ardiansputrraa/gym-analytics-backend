import { Injectable, Inject, ConflictException, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository.interface';
import { OtpType } from '../../domain/enums/otp-type.enum';
import { OtpService } from './otp.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { RegisterDto, RegisterResponseDto } from '../../modules/auth/schemas';

@Injectable()
export class RegisterUseCase {
  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
  ) {}

  async execute(dto: RegisterDto): Promise<RegisterResponseDto> {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser && existingUser.emailVerifiedAt) {
      throw new ConflictException({
        message: 'Akun dengan email ini sudah terdaftar.',
        code: 'EMAIL_ALREADY_EXISTS',
        errors: [],
      });
    }

    const passwordHash = await argon2.hash(dto.password);
    let userId: string;

    if (existingUser) {
      // Unverified user registering again - reuse user id
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

    // Generate and store OTP token
    const { otp, expiresInMinutes } = await this.otpService.createOtp(
      userId,
      OtpType.EMAIL_VERIFICATION,
    );

    // Dispatch verification email via SMTP
    await this.mailService.sendOtpEmail(dto.email, otp, expiresInMinutes);

    return {
      userId,
      email: dto.email,
      name: dto.name,
      phone: dto.phone ?? null,
      isEmailVerified: false,
      message:
        'Pendaftaran berhasil. Silakan verifikasi email Anda menggunakan kode OTP 6-digit yang dikirim ke email Anda.',
    };
  }
}
