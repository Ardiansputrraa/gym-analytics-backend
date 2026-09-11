import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  INutritionRepository,
  NUTRITION_REPOSITORY_TOKEN,
} from '../../domain/repositories/nutrition.repository.interface';

@Injectable()
export class DeleteNutritionEntryUseCase {
  constructor(
    @Inject(NUTRITION_REPOSITORY_TOKEN)
    private readonly nutritionRepository: INutritionRepository,
  ) {}

  async execute(userId: string, entryId: string): Promise<void> {
    const existing = await this.nutritionRepository.findById(entryId);
    if (!existing) {
      throw new NotFoundException('Catatan nutrisi tidak ditemukan.');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke catatan nutrisi ini.');
    }

    await this.nutritionRepository.delete(entryId);
  }
}
