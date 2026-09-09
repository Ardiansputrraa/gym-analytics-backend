import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository.interface';
import { OtpType } from '../../domain/enums/otp-type.enum';
import { OtpService } from './otp.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import type {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
} from '../../modules/auth/schemas';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException({
        message: 'No account found with this email address.',
        code: 'USER_NOT_FOUND',
        errors: [],
      });
    }

    const { otp, expiresInMinutes } = await this.otpService.createOtp(
      user.id,
      OtpType.PASSWORD_RESET,
    );

    await this.mailService.sendPasswordResetEmail(
      user.email,
      otp,
      expiresInMinutes,
    );

    return {
      message: 'Password reset code has been sent to your email.',
    };
  }
}
