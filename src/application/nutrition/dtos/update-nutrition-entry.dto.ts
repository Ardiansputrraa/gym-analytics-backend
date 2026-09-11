import { z } from 'zod';
import { NutritionType } from '../../../domain/enums/nutrition-type.enum';

export const updateNutritionEntrySchema = z.object({
  consumedAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  type: z.nativeEnum(NutritionType).optional(),
  name: z.string().min(1).max(255).optional(),
  calories: z.number().int().nonnegative().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().max(50).optional(),
  proteinG: z.number().nonnegative().optional().nullable(),
  carbsG: z.number().nonnegative().optional().nullable(),
  fatG: z.number().nonnegative().optional().nullable(),
  waterMl: z.number().int().nonnegative().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type UpdateNutritionEntryDto = z.infer<typeof updateNutritionEntrySchema>;
