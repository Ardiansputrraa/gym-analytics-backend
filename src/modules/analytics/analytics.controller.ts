import {
  Controller,
  Get,
  Query,
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
import { JwtAuthGuard, JwtPayload } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  GetDashboardSummaryUseCase,
  GetInsightsUseCase,
  GetDailyTimelineUseCase,
} from '../../application/analytics';
import {
  GetDashboardSummaryQueryDto,
  GetDailyTimelineQueryDto,
} from './schemas/dashboard-analytics.schema';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly getDashboardSummaryUseCase: GetDashboardSummaryUseCase,
    private readonly getInsightsUseCase: GetInsightsUseCase,
    private readonly getDailyTimelineUseCase: GetDailyTimelineUseCase,
  ) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dapatkan agregat lengkap analitik dashboard',
    description:
      'Mengembalikan seluruh data KPI metrik, gauges kalori & hidrasi, charts per kelompok otot, 1RM progression, heatmap 28 hari, status pemulihan otot, dan insight deterministik.',
  })
  @ApiResponse({
    status: 200,
    description: 'Data summary dashboard berhasil diambil.',
  })
  async getDashboardSummary(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetDashboardSummaryQueryDto,
  ) {
    const summary = await this.getDashboardSummaryUseCase.execute({
      userId: user.sub,
      timeframe: query.timeframe,
    });
    return {
      success: true,
      message: 'Data analitik dashboard berhasil diambil',
      data: summary,
    };
  }

  @Get('insights')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dapatkan daftar rekomendasi & insight deterministik',
    description:
      'Evaluasi aturan PRD deterministik (komposisi tubuh, progressive overload, hidrasi/nutrisi, dan pemulihan otot).',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar insight deterministik berhasil diambil.',
  })
  async getInsights(@CurrentUser() user: JwtPayload) {
    const insights = await this.getInsightsUseCase.execute({ userId: user.sub });
    return {
      success: true,
      message: 'Daftar insight deterministik berhasil diambil',
      data: insights,
    };
  }

  @Get('timeline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dapatkan kronologi timeline aktivitas harian',
    description:
      'Mengembalikan urutan kronologis pencatatan aktivitas hari ini (sesi latihan, makanan, dan hidrasi).',
  })
  @ApiResponse({
    status: 200,
    description: 'Timeline aktivitas harian berhasil diambil.',
  })
  async getTimeline(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetDailyTimelineQueryDto,
  ) {
    const timeline = await this.getDailyTimelineUseCase.execute({
      userId: user.sub,
      date: query.date,
    });
    return {
      success: true,
      message: 'Timeline aktivitas harian berhasil diambil',
      data: timeline,
    };
  }
}
