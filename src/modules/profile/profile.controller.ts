import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
  type JwtPayload,
} from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  UpsertProfileUseCase,
  GetProfileUseCase,
} from '../../application/profile';
import { UpsertProfileDto, ProfileResponseDto } from './schemas';

@ApiTags('Profile')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly upsertProfileUseCase: UpsertProfileUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
  ) {}

  @Get(['me', ''])
  @ApiOperation({
    summary: 'Get current user profile & 30-day check-in status',
    description:
      'Retrieves the biometric profile of the authenticated user, including age, gender, height, weight, activity level, fitness goal, and monthly check-in reminder status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully.',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (missing or invalid JWT).',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found. User has not yet completed profile setup.',
  })
  async getMyProfile(
    @CurrentUser() user: JwtPayload,
  ): Promise<ProfileResponseDto> {
    return this.getProfileUseCase.execute(user.sub);
  }

  @Put(['me', ''])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Create or update user profile and recalculate daily calorie target',
    description:
      'Upserts the biometric profile of the authenticated user. Automatically recalculates BMR, TDEE, macronutrient breakdown, and synchronizes today’s daily calorie target.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Profile saved and daily calorie target recalculated successfully.',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (invalid age, height, weight, or enums).',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  async updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.upsertProfileUseCase.execute(user.sub, dto);
  }
}
