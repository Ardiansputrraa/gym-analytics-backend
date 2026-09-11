import { NutritionType } from '../enums/nutrition-type.enum';

export interface NutritionEntryEntity {
  id: string;
  userId: string;
  consumedAt: Date;
  type: NutritionType;
  name: string;
  calories: number;
  quantity: number;
  unit: string;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  waterMl?: number | null;
  notes?: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
