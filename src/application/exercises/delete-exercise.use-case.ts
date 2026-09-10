import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  EXERCISE_REPOSITORY,
  type IExerciseRepository,
} from '../../domain/repositories/exercise.repository.interface';

@Injectable()
export class DeleteExerciseUseCase {
  constructor(
    @Inject(EXERCISE_REPOSITORY)
    private readonly exerciseRepository: IExerciseRepository,
  ) {}

  async execute(id: string, userId: string, isAdmin = false): Promise<{ success: boolean; message: string }> {
    const existing = await this.exerciseRepository.findById(id);

    if (!existing) {
      throw new NotFoundException({
        message: 'Gerakan atau alat gym tidak ditemukan.',
        code: 'EXERCISE_NOT_FOUND',
        errors: [],
      });
    }

    if (!isAdmin && existing.userId !== userId) {
      throw new ForbiddenException({
        message: 'Anda hanya dapat menghapus gerakan kustom milik Anda sendiri.',
        code: 'EXERCISE_FORBIDDEN',
        errors: [],
      });
    }

    await this.exerciseRepository.softDelete(id);

    return {
      success: true,
      message: 'Gerakan gym berhasil dihapus.',
    };
  }
}
