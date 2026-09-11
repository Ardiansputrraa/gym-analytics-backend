import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LogNutritionEntryUseCase } from '../../application/nutrition/log-nutrition-entry.use-case';
import { GetDailyNutritionSummaryUseCase } from '../../application/nutrition/get-daily-nutrition-summary.use-case';
import { GetNutritionHistoryUseCase } from '../../application/nutrition/get-nutrition-history.use-case';
import { UpdateNutritionEntryUseCase } from '../../application/nutrition/update-nutrition-entry.use-case';
import { DeleteNutritionEntryUseCase } from '../../application/nutrition/delete-nutrition-entry.use-case';
import {
  CreateNutritionEntryDto,
  createNutritionEntrySchema,
} from '../../application/nutrition/dtos/create-nutrition-entry.dto';
import {
  UpdateNutritionEntryDto,
  updateNutritionEntrySchema,
} from '../../application/nutrition/dtos/update-nutrition-entry.dto';

@ApiTags('Nutrition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nutrition')
export class NutritionController {
  constructor(
    private readonly logNutritionEntryUseCase: LogNutritionEntryUseCase,
    private readonly getDailyNutritionSummaryUseCase: GetDailyNutritionSummaryUseCase,
    private readonly getNutritionHistoryUseCase: GetNutritionHistoryUseCase,
    private readonly updateNutritionEntryUseCase: UpdateNutritionEntryUseCase,
    private readonly deleteNutritionEntryUseCase: DeleteNutritionEntryUseCase,
  ) {}

  @Post('entries')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mencatat entri makanan atau minuman' })
  @ApiResponse({ status: 201, description: 'Entri nutrisi berhasil dicatat.' })
  async createEntry(
    @CurrentUser('sub') userId: string,
    @Body() body: unknown,
  ) {
    const validated = createNutritionEntrySchema.parse(body);
    const result = await this.logNutritionEntryUseCase.execute(userId, validated);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Catatan nutrisi berhasil disimpan.',
      data: result,
    };
  }

  @Get('daily')
  @ApiOperation({ summary: 'Mengambil ringkasan nutrisi harian terintegrasi kalori workout & target profil' })
  @ApiQuery({ name: 'date', required: false, description: 'Tanggal YYYY-MM-DD (default: hari ini)' })
  @ApiResponse({ status: 200, description: 'Ringkasan nutrisi harian berhasil diambil.' })
  async getDailySummary(
    @CurrentUser('sub') userId: string,
    @Query('date') date?: string,
  ) {
    const result = await this.getDailyNutritionSummaryUseCase.execute(userId, date);
    return {
      statusCode: HttpStatus.OK,
      message: 'Ringkasan nutrisi harian berhasil diambil.',
      data: result,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Mengambil riwayat nutrisi & data grafik multi-rentang' })
  @ApiQuery({ name: 'timeframe', required: false, enum: ['TODAY', 'WEEK', 'MONTH', 'YEAR'] })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiResponse({ status: 200, description: 'Riwayat nutrisi berhasil diambil.' })
  async getHistory(
    @CurrentUser('sub') userId: string,
    @Query('timeframe') timeframe?: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR',
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const result = await this.getNutritionHistoryUseCase.execute(userId, timeframe, year, month);
    return {
      statusCode: HttpStatus.OK,
      message: 'Riwayat nutrisi berhasil diambil.',
      data: result,
    };
  }

  @Patch('entries/:id')
  @ApiOperation({ summary: 'Memperbarui entri makanan atau minuman' })
  @ApiResponse({ status: 200, description: 'Entri nutrisi berhasil diperbarui.' })
  async updateEntry(
    @CurrentUser('sub') userId: string,
    @Param('id') entryId: string,
    @Body() body: unknown,
  ) {
    const validated = updateNutritionEntrySchema.parse(body);
    const result = await this.updateNutritionEntryUseCase.execute(userId, entryId, validated);
    return {
      statusCode: HttpStatus.OK,
      message: 'Catatan nutrisi berhasil diperbarui.',
      data: result,
    };
  }

  @Delete('entries/:id')
  @ApiOperation({ summary: 'Menghapus entri makanan atau minuman' })
  @ApiResponse({ status: 200, description: 'Entri nutrisi berhasil dihapus.' })
  async deleteEntry(
    @CurrentUser('sub') userId: string,
    @Param('id') entryId: string,
  ) {
    await this.deleteNutritionEntryUseCase.execute(userId, entryId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Catatan nutrisi berhasil dihapus.',
    };
  }
}
