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
import {
  VerifyEmailDto,
  VerifyEmailResponseDto,
} from '../../modules/auth/schemas';

@Injectable()
export class VerifyEmailUseCase {
  private readonly logger = new Logger(VerifyEmailUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly otpService: OtpService,
  ) {}

  async execute(dto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
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

    // Verify OTP token against database and business rules
    await this.otpService.verifyOtp(
      user.id,
      OtpType.EMAIL_VERIFICATION,
      dto.otp,
    );

    // Mark email as verified in user repository
    const now = new Date();
    await this.userRepository.markEmailVerified(user.id, now);

    return {
      userId: user.id,
      email: user.email,
      isEmailVerified: true,
      message: 'Email verified successfully. You can now log in.',
    };
  }
}
