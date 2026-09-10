import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository.interface';
import { OtpType } from '../../domain/enums/otp-type.enum';
import { OtpService } from './otp.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { ResendOtpDto, ResendOtpResponseDto } from '../../modules/auth/schemas';

@Injectable()
export class ResendOtpUseCase {
  private readonly logger = new Logger(ResendOtpUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
  ) {}

  async execute(dto: ResendOtpDto): Promise<ResendOtpResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new NotFoundException({
        message: 'Akun tidak ditemukan.',
        code: 'USER_NOT_FOUND',
        errors: [],
      });
    }

    const type = dto.type ?? OtpType.EMAIL_VERIFICATION;

    if (type === OtpType.EMAIL_VERIFICATION && user.emailVerifiedAt) {
      throw new BadRequestException({
        message: 'Email sudah terverifikasi.',
        code: 'EMAIL_ALREADY_VERIFIED',
        errors: [],
      });
    }

    // Generate and store new OTP
    const { otp, expiresInMinutes } = await this.otpService.resendOtp(
      user.id,
      type,
    );

    // Send verification email via SMTP
    await this.mailService.sendOtpEmail(user.email, otp, expiresInMinutes);

    return {
      userId: user.id,
      email: user.email,
      message: 'Kode verifikasi baru telah dikirimkan ke email Anda.',
    };
  }
}
