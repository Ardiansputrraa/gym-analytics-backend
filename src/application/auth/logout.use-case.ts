import { Injectable, Logger } from '@nestjs/common';
import { LogoutDto, LogoutResponseDto } from '../../modules/auth/schemas';

@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name);

  async execute(dto?: LogoutDto): Promise<LogoutResponseDto> {
    this.logger.log('User logout processed successfully.');
    // In stateless JWT architectures, client drops tokens; if refresh token / blacklist is configured, it can be revoked here.
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
