import { NutritionEntryEntity } from '../entities/nutrition-entry.entity';
import { NutritionType } from '../enums/nutrition-type.enum';

export interface CreateNutritionEntryData {
  userId: string;
  consumedAt: Date;
  type: NutritionType;
  name: string;
  calories: number;
  quantity?: number;
  unit?: string;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  waterMl?: number | null;
  notes?: string | null;
}

export interface UpdateNutritionEntryData {
  consumedAt?: Date;
  type?: NutritionType;
  name?: string;
  calories?: number;
  quantity?: number;
  unit?: string;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  waterMl?: number | null;
  notes?: string | null;
}

export interface INutritionRepository {
  create(data: CreateNutritionEntryData): Promise<NutritionEntryEntity>;
  findById(id: string): Promise<NutritionEntryEntity | null>;
  findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<NutritionEntryEntity[]>;
  update(id: string, data: UpdateNutritionEntryData): Promise<NutritionEntryEntity>;
  delete(id: string): Promise<void>;
}

export const NUTRITION_REPOSITORY_TOKEN = Symbol('INutritionRepository');
