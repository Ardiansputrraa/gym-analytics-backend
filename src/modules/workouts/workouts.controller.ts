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
  HttpCode,
  HttpStatus,
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
  StartWorkoutUseCase,
  GetActiveWorkoutUseCase,
  FinishWorkoutUseCase,
  CancelWorkoutUseCase,
  WorkoutExercisesUseCase,
  WorkoutSetsUseCase,
  GetWorkoutHistoryUseCase,
  GetWorkoutAnalyticsUseCase,
  GetRoutineTemplatesUseCase,
  GetWorkoutByIdUseCase,
} from '../../application/workouts';
import {
  StartWorkoutDto,
  AddWorkoutExerciseDto,
  CreateWorkoutSetDto,
  UpdateWorkoutSetDto,
  UpdateWorkoutNameDto,
  GetWorkoutHistoryQueryDto,
  GetWorkoutAnalyticsQueryDto,
} from './schemas/workout.schema';
import { WorkoutTimeframe } from '../../domain/enums/workout.enums';

@ApiTags('Workouts & Live Telemetry Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(
    private readonly startWorkoutUseCase: StartWorkoutUseCase,
    private readonly getActiveWorkoutUseCase: GetActiveWorkoutUseCase,
    private readonly finishWorkoutUseCase: FinishWorkoutUseCase,
    private readonly cancelWorkoutUseCase: CancelWorkoutUseCase,
    private readonly workoutExercisesUseCase: WorkoutExercisesUseCase,
    private readonly workoutSetsUseCase: WorkoutSetsUseCase,
    private readonly getWorkoutHistoryUseCase: GetWorkoutHistoryUseCase,
    private readonly getWorkoutAnalyticsUseCase: GetWorkoutAnalyticsUseCase,
    private readonly getRoutineTemplatesUseCase: GetRoutineTemplatesUseCase,
    private readonly getWorkoutByIdUseCase: GetWorkoutByIdUseCase,
  ) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start or retrieve today active workout session',
    description: 'Creates a new active workout session with status IN_PROGRESS. Idempotently returns today active session if already running.',
  })
  @ApiResponse({ status: 201, description: 'Sesi latihan aktif berhasil dimulai.' })
  async startWorkout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartWorkoutDto,
  ) {
    const workout = await this.startWorkoutUseCase.execute({
      userId: user.sub,
      name: dto.name,
      routineTemplateId: dto.routineTemplateId,
    });

    return {
      success: true,
      message: 'Sesi latihan aktif berhasil dimulai.',
      data: workout,
    };
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get current running active workout session',
    description: 'Returns active session for today. If previous session expired from yesterday, it auto-cancels and returns null.',
  })
  @ApiResponse({ status: 200, description: 'Sesi aktif berhasil dimuat.' })
  async getActiveWorkout(@CurrentUser() user: JwtPayload) {
    const workout = await this.getActiveWorkoutUseCase.execute(user.sub);
    return {
      success: true,
      message: workout ? 'Sesi latihan aktif ditemukan.' : 'Tidak ada sesi latihan yang sedang aktif hari ini.',
      data: workout,
    };
  }

  @Get('routines')
  @ApiOperation({
    summary: 'Get preset routine templates',
    description: 'Returns seeded master routine programs (Push Day, Pull Day, Leg Day, etc.)',
  })
  async getRoutines() {
    const templates = await this.getRoutineTemplatesUseCase.execute();
    return {
      success: true,
      message: 'Template rutinitas berhasil dimuat.',
      data: templates,
    };
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get historical workout sessions feed',
    description: 'Returns paginated completed workout sessions with exercise breakdowns and best sets.',
  })
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetWorkoutHistoryQueryDto,
  ) {
    const history = await this.getWorkoutHistoryUseCase.execute({
      userId: user.sub,
      page: query.page,
      limit: query.limit,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    return {
      success: true,
      message: 'Riwayat sesi latihan berhasil dimuat.',
      data: history,
    };
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get workout performance analytics & telemetry chart data',
    description: 'Returns aggregates (Volume, Sessions, Duration, Active Ratio, PRs) and Recharts time-series data.',
  })
  async getAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetWorkoutAnalyticsQueryDto,
  ) {
    const analytics = await this.getWorkoutAnalyticsUseCase.execute(
      user.sub,
      query.timeframe as WorkoutTimeframe,
      query.year,
      query.month,
    );

    return {
      success: true,
      message: 'Analitik telemetri latihan berhasil dimuat.',
      data: analytics,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get full workout session detail by ID',
    description: 'Returns workout session detail with full exercise sets breakdown, telemetry summary, and PRs.',
  })
  @ApiParam({ name: 'id', description: 'Workout UUID' })
  async getWorkoutById(
    @CurrentUser() user: JwtPayload,
    @Param('id') workoutId: string,
  ) {
    const result = await this.getWorkoutByIdUseCase.execute(user.sub, workoutId);
    return {
      success: true,
      message: 'Detail sesi latihan berhasil dimuat.',
      data: result,
    };
  }

  @Post(':id/exercises')
  @ApiOperation({
    summary: 'Add exercise to active workout session',
    description: 'Appends movement from exercise catalog and creates initial set (Set 1).',
  })
  async addExercise(
    @CurrentUser() user: JwtPayload,
    @Param('id') workoutId: string,
    @Body() dto: AddWorkoutExerciseDto,
  ) {
    const exercise = await this.workoutExercisesUseCase.addExercise({
      userId: user.sub,
      workoutId,
      exerciseId: dto.exerciseId,
    });

    return {
      success: true,
      message: 'Gerakan berhasil ditambahkan ke sesi latihan.',
      data: exercise,
    };
  }

  @Delete(':id/exercises/:exerciseId')
  @ApiOperation({
    summary: 'Remove exercise from active workout session',
  })
  async removeExercise(
    @CurrentUser() user: JwtPayload,
    @Param('id') workoutId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    const workout = await this.workoutExercisesUseCase.removeExercise({
      userId: user.sub,
      workoutId,
      exerciseId,
    });

    return {
      success: true,
      message: 'Gerakan berhasil dihapus dari sesi latihan.',
      data: workout,
    };
  }

  @Post(':id/sets')
  @ApiOperation({
    summary: 'Add a new set to an exercise in the active workout',
  })
  async addSet(
    @CurrentUser() user: JwtPayload,
    @Param('id') workoutId: string,
    @Body() dto: CreateWorkoutSetDto,
  ) {
    const set = await this.workoutSetsUseCase.addSet(dto);
    return {
      success: true,
      message: 'Set berhasil ditambahkan.',
      data: set,
    };
  }

  @Patch('sets/:setId')
  @ApiOperation({
    summary: 'Update set parameters or mark set completed',
    description: 'Updates weight (kg), reps, duration, or completion status.',
  })
  async updateSet(
    @CurrentUser() user: JwtPayload,
    @Param('setId') setId: string,
    @Body() dto: UpdateWorkoutSetDto,
  ) {
    const updated = await this.workoutSetsUseCase.updateSet({
      setId,
      ...dto,
    });

    return {
      success: true,
      message: 'Set berhasil diperbarui.',
      data: updated,
    };
  }

  @Delete('sets/:setId')
  @ApiOperation({
    summary: 'Remove a set from workout exercise',
  })
  async removeSet(
    @CurrentUser() user: JwtPayload,
    @Param('setId') setId: string,
  ) {
    await this.workoutSetsUseCase.removeSet(setId);
    return {
      success: true,
      message: 'Set berhasil dihapus.',
      data: null,
    };
  }

  @Patch(':id/finish')
  @ApiOperation({
    summary: 'Finish workout session',
    description: 'Transitions status to COMPLETED, evaluates and stores newly broken Personal Records, and calculates telemetry summary.',
  })
  async finishWorkout(
    @CurrentUser() user: JwtPayload,
    @Param('id') workoutId: string,
  ) {
    const result = await this.finishWorkoutUseCase.execute(user.sub, workoutId);
    return {
      success: true,
      message: 'Sesi latihan berhasil diselesaikan! Rekor performa tercatat.',
      data: result,
    };
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel workout session',
  })
  async cancelWorkout(
    @CurrentUser() user: JwtPayload,
    @Param('id') workoutId: string,
  ) {
    const result = await this.cancelWorkoutUseCase.execute(user.sub, workoutId);
    return {
      success: true,
      message: 'Sesi latihan telah dibatalkan.',
      data: result,
    };
  }
}
