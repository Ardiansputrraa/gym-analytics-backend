import {
  Controller,
  Get,
  Post,
  Put,
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
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  GetExercisesUseCase,
  GetExerciseByIdUseCase,
  CreateExerciseUseCase,
  UpdateExerciseUseCase,
  DeleteExerciseUseCase,
  GetMuscleGroupsUseCase,
  GetEquipmentsUseCase,
} from '../../application/exercises';
import {
  GetExercisesQueryDto,
  CreateExerciseDto,
  UpdateExerciseDto,
  PaginatedExercisesResponseDto,
  ExerciseResponseDto,
  MuscleGroupResponseDto,
  EquipmentCategoryOptionDto,
} from './schemas/exercise.schema';

@ApiTags('Exercises Master Data & Catalog')
@Controller('exercises')
export class ExercisesController {
  constructor(
    private readonly getExercisesUseCase: GetExercisesUseCase,
    private readonly getExerciseByIdUseCase: GetExerciseByIdUseCase,
    private readonly createExerciseUseCase: CreateExerciseUseCase,
    private readonly updateExerciseUseCase: UpdateExerciseUseCase,
    private readonly deleteExerciseUseCase: DeleteExerciseUseCase,
    private readonly getMuscleGroupsUseCase: GetMuscleGroupsUseCase,
    private readonly getEquipmentsUseCase: GetEquipmentsUseCase,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get paginated list of gym exercises with search & filters',
    description:
      'Fetches exercises with server-side pagination, search by name/description/muscle group, and filter by muscle group & equipment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated exercises retrieved successfully.',
  })
  async getExercises(
    @Query() query: GetExercisesQueryDto,
    @CurrentUser() user?: JwtPayload,
  ): Promise<PaginatedExercisesResponseDto> {
    return this.getExercisesUseCase.execute(query, user?.sub);
  }

  @Get('muscle-groups')
  @ApiOperation({
    summary: 'Get all master muscle groups',
    description: 'Retrieves all available master muscle groups for filters and exercise categorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Muscle groups retrieved successfully.',
  })
  async getMuscleGroups(): Promise<MuscleGroupResponseDto[]> {
    return this.getMuscleGroupsUseCase.execute();
  }

  @Get('equipments')
  @ApiOperation({
    summary: 'Get all gym equipment categories',
    description: 'Retrieves all standard equipment filter options.',
  })
  @ApiResponse({
    status: 200,
    description: 'Equipment categories retrieved successfully.',
  })
  getEquipments(): EquipmentCategoryOptionDto[] {
    return this.getEquipmentsUseCase.execute();
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get exercise details by ID',
    description: 'Retrieves a single exercise details by UUID.',
  })
  @ApiParam({ name: 'id', description: 'Exercise UUID' })
  @ApiResponse({
    status: 200,
    description: 'Exercise details retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Exercise not found.',
  })
  async getExerciseById(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<ExerciseResponseDto> {
    return this.getExerciseByIdUseCase.execute(id, user?.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a custom exercise',
    description: 'Creates a user-defined custom exercise/movement associated with the authenticated user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Custom exercise created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 409,
    description: 'Exercise with this name already exists in user catalog.',
  })
  async createExercise(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateExerciseDto,
  ): Promise<ExerciseResponseDto> {
    return this.createExerciseUseCase.execute(dto, user.sub);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a custom exercise',
    description: 'Updates a custom exercise. Restricted to the owner or admin.',
  })
  @ApiParam({ name: 'id', description: 'Exercise UUID' })
  @ApiResponse({
    status: 200,
    description: 'Exercise updated successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You do not own this exercise.',
  })
  @ApiResponse({
    status: 404,
    description: 'Exercise not found.',
  })
  async updateExercise(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateExerciseDto,
  ): Promise<ExerciseResponseDto> {
    return this.updateExerciseUseCase.execute(id, dto, user.sub, user.isAdmin);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a custom exercise (Soft Delete)',
    description: 'Soft deletes a custom exercise. Restricted to the owner or admin.',
  })
  @ApiParam({ name: 'id', description: 'Exercise UUID' })
  @ApiResponse({
    status: 200,
    description: 'Exercise deleted successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You do not own this exercise.',
  })
  @ApiResponse({
    status: 404,
    description: 'Exercise not found.',
  })
  async deleteExercise(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; message: string }> {
    return this.deleteExerciseUseCase.execute(id, user.sub, user.isAdmin);
  }
}
