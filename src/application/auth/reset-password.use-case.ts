import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository.interface';
import { OtpType } from '../../domain/enums/otp-type.enum';
import { OtpService } from './otp.service';
import type {
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from '../../modules/auth/schemas';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly otpService: OtpService,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException({
        message: 'No account found with this email address.',
        code: 'USER_NOT_FOUND',
        errors: [],
      });
    }

    // Verify OTP for password reset
    await this.otpService.verifyOtp(user.id, OtpType.PASSWORD_RESET, dto.otp);

    // Hash the new password with argon2
    const passwordHash = await argon2.hash(dto.newPassword);

    // Update password in database
    await this.userRepository.updatePassword(user.id, passwordHash);

    return {
      message:
        'Password has been reset successfully. You can now login with your new password.',
    };
  }
}
