import {
  Controller,
  Get,
  Post,
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
  GetDailyCalorieTargetUseCase,
  CalculateCaloriePreviewUseCase,
} from '../../application/calorie';
import {
  CalculateCaloriePreviewDto,
  DailyCalorieTargetResponseDto,
} from './schemas';

@ApiTags('Calorie')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('calorie')
export class CalorieController {
  constructor(
    private readonly getDailyCalorieTargetUseCase: GetDailyCalorieTargetUseCase,
    private readonly calculateCaloriePreviewUseCase: CalculateCaloriePreviewUseCase,
  ) {}

  @Get('target/today')
  @ApiOperation({
    summary: 'Get daily calorie and macronutrient target for today',
    description:
      'Retrieves the active daily calorie target and macro breakdown (Protein, Carbs, Fats) for today. If not yet created for today, it auto-computes and saves a snapshot from the user profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily calorie target retrieved successfully.',
    type: DailyCalorieTargetResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Profile required. User must complete profile before calorie targets can be calculated.',
  })
  async getTodayTarget(
    @CurrentUser() user: JwtPayload,
  ): Promise<DailyCalorieTargetResponseDto> {
    return this.getDailyCalorieTargetUseCase.execute(user.sub);
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simulate BMR, TDEE, Calorie Target & Macros on-the-fly',
    description:
      'Instant simulator for calculating BMR, TDEE, deficit/surplus, and macro split based on custom inputs (e.g. testing different DietPace or ActivityLevel) without persisting to database.',
  })
  @ApiResponse({
    status: 200,
    description: 'Simulated calorie target and macro breakdown.',
    type: DailyCalorieTargetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (invalid age, height, weight, or enums).',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  calculatePreview(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CalculateCaloriePreviewDto,
  ): DailyCalorieTargetResponseDto {
    return this.calculateCaloriePreviewUseCase.execute(dto, user.sub);
  }
}
