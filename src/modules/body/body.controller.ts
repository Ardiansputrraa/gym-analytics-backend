import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  LogBodyMeasurementUseCase,
  GetBodyMeasurementsUseCase,
  GetBodyCompositionAnalyticsUseCase,
  DeleteBodyMeasurementUseCase,
} from '../../application/body';
import {
  CreateBodyMeasurementDto,
  GetBodyMeasurementsQueryDto,
  GetBodyCompositionAnalyticsQueryDto,
} from './schemas/body-measurement.schema';

@ApiTags('Body Composition')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('body')
export class BodyController {
  constructor(
    private readonly logBodyMeasurementUseCase: LogBodyMeasurementUseCase,
    private readonly getBodyMeasurementsUseCase: GetBodyMeasurementsUseCase,
    private readonly getBodyCompositionAnalyticsUseCase: GetBodyCompositionAnalyticsUseCase,
    private readonly deleteBodyMeasurementUseCase: DeleteBodyMeasurementUseCase,
  ) {}

  @Get('analytics')
  @ApiOperation({
    summary: 'Get body composition analytics, KPI summaries & chart series',
    description:
      'Calculates 4 Hero KPI Telemetry summaries, latest InBody receipt details, progress evaluation deltas, and time-series chart data for 7D, 30D, 90D, or 1Y.',
  })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully.' })
  async getAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetBodyCompositionAnalyticsQueryDto,
  ) {
    return this.getBodyCompositionAnalyticsUseCase.execute({
      userId: user.sub,
      timeframe: query.timeframe,
    });
  }

  @Get('measurements')
  @ApiOperation({
    summary: 'Get paginated list of historical InBody / body scan measurements',
    description: 'Retrieves scan history with pagination, date filtering, and search.',
  })
  @ApiResponse({ status: 200, description: 'Measurements retrieved successfully.' })
  async getMeasurements(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetBodyMeasurementsQueryDto,
  ) {
    return this.getBodyMeasurementsUseCase.execute({
      userId: user.sub,
      page: query.page,
      limit: query.limit,
      search: query.search,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }

  @Post('measurements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Log a new body measurement / InBody scan',
    description:
      'Records a new scan, computes derivative metrics, evaluates progress status, and automatically syncs to user profile & daily calorie targets.',
  })
  @ApiResponse({ status: 201, description: 'Measurement recorded and profile synced successfully.' })
  async logMeasurement(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBodyMeasurementDto,
  ) {
    return this.logBodyMeasurementUseCase.execute({
      userId: user.sub,
      measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : undefined,
      receiptNumber: dto.receiptNumber || undefined,
      weightKg: dto.weightKg,
      skeletalMuscleKg: dto.skeletalMuscleKg,
      bodyFatKg: dto.bodyFatKg,
      bodyFatPct: dto.bodyFatPct,
      fatFreeMassKg: dto.fatFreeMassKg,
      waterContentKg: dto.waterContentKg,
      proteinKg: dto.proteinKg,
      mineralKg: dto.mineralKg,
      notes: dto.notes || undefined,
    });
  }

  @Delete('measurements/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a body measurement record' })
  @ApiParam({ name: 'id', description: 'Measurement UUID' })
  @ApiResponse({ status: 200, description: 'Measurement deleted successfully.' })
  async deleteMeasurement(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const success = await this.deleteBodyMeasurementUseCase.execute(user.sub, id);
    return { success };
  }
}
