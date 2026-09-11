import { z } from 'zod';
import { NutritionType } from '../../../domain/enums/nutrition-type.enum';

export const createNutritionEntrySchema = z.object({
  consumedAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  type: z.nativeEnum(NutritionType).default(NutritionType.FOOD),
  name: z.string().min(1, 'Nama makanan / minuman wajib diisi').max(255),
  calories: z.number().int().nonnegative('Kalori tidak boleh negatif'),
  quantity: z.number().positive().default(1),
  unit: z.string().max(50).default('porsi'),
  proteinG: z.number().nonnegative().optional().nullable(),
  carbsG: z.number().nonnegative().optional().nullable(),
  fatG: z.number().nonnegative().optional().nullable(),
  waterMl: z.number().int().nonnegative().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateNutritionEntryDto = z.infer<typeof createNutritionEntrySchema>;
