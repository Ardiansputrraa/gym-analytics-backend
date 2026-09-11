import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateBodyMeasurementSchema = z.object({
  measuredAt: z.string().datetime().optional().nullable(),
  receiptNumber: z.string().trim().max(50).optional().nullable(),
  weightKg: z.coerce.number().min(20, 'Berat badan minimal 20 kg').max(350, 'Berat badan maksimal 350 kg'),
  skeletalMuscleKg: z.coerce.number().min(0).max(150).optional().nullable(),
  bodyFatKg: z.coerce.number().min(0).max(200).optional().nullable(),
  bodyFatPct: z.coerce.number().min(0).max(100).optional().nullable(),
  fatFreeMassKg: z.coerce.number().min(0).max(300).optional().nullable(),
  waterContentKg: z.coerce.number().min(0).max(200).optional().nullable(),
  proteinKg: z.coerce.number().min(0).max(100).optional().nullable(),
  mineralKg: z.coerce.number().min(0).max(50).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export class CreateBodyMeasurementDto extends createZodDto(CreateBodyMeasurementSchema) {}

export const GetBodyMeasurementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export class GetBodyMeasurementsQueryDto extends createZodDto(GetBodyMeasurementsQuerySchema) {}

export const GetBodyCompositionAnalyticsQuerySchema = z.object({
  timeframe: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
});

export class GetBodyCompositionAnalyticsQueryDto extends createZodDto(
  GetBodyCompositionAnalyticsQuerySchema,
) {}
