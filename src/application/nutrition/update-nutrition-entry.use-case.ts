import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  INutritionRepository,
  NUTRITION_REPOSITORY_TOKEN,
} from '../../domain/repositories/nutrition.repository.interface';
import { NutritionEntryEntity } from '../../domain/entities/nutrition-entry.entity';
import { UpdateNutritionEntryDto } from './dtos/update-nutrition-entry.dto';

@Injectable()
export class UpdateNutritionEntryUseCase {
  constructor(
    @Inject(NUTRITION_REPOSITORY_TOKEN)
    private readonly nutritionRepository: INutritionRepository,
  ) {}

  async execute(
    userId: string,
    entryId: string,
    dto: UpdateNutritionEntryDto,
  ): Promise<NutritionEntryEntity> {
    const existing = await this.nutritionRepository.findById(entryId);
    if (!existing) {
      throw new NotFoundException('Catatan nutrisi tidak ditemukan.');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke catatan nutrisi ini.');
    }

    const consumedAt = dto.consumedAt ? new Date(dto.consumedAt) : undefined;

    return this.nutritionRepository.update(entryId, {
      consumedAt,
      type: dto.type,
      name: dto.name?.trim(),
      calories: dto.calories,
      quantity: dto.quantity,
      unit: dto.unit,
      proteinG: dto.proteinG,
      carbsG: dto.carbsG,
      fatG: dto.fatG,
      waterMl: dto.waterMl,
      notes: dto.notes,
    });
  }
}
