import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  INutritionRepository,
  NUTRITION_REPOSITORY_TOKEN,
} from '../../domain/repositories/nutrition.repository.interface';
import { NutritionEntryEntity } from '../../domain/entities/nutrition-entry.entity';
import { CreateNutritionEntryDto } from './dtos/create-nutrition-entry.dto';

@Injectable()
export class LogNutritionEntryUseCase {
  constructor(
    @Inject(NUTRITION_REPOSITORY_TOKEN)
    private readonly nutritionRepository: INutritionRepository,
  ) {}

  async execute(userId: string, dto: CreateNutritionEntryDto): Promise<NutritionEntryEntity> {
    if (!dto.name || dto.name.trim() === '') {
      throw new BadRequestException('Nama makanan atau minuman tidak boleh kosong.');
    }

    const consumedAt = dto.consumedAt ? new Date(dto.consumedAt) : new Date();

    return this.nutritionRepository.create({
      userId,
      consumedAt,
      type: dto.type,
      name: dto.name.trim(),
      calories: dto.calories,
      quantity: dto.quantity ?? 1,
      unit: dto.unit ?? 'porsi',
      proteinG: dto.proteinG ?? null,
      carbsG: dto.carbsG ?? null,
      fatG: dto.fatG ?? null,
      waterMl: dto.waterMl ?? null,
      notes: dto.notes ?? null,
    });
  }
}
