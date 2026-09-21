import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const DashboardTimeframeEnum = z.enum(['7D', '30D', '90D']);

export const GetDashboardSummaryQuerySchema = z.object({
  timeframe: DashboardTimeframeEnum.default('7D'),
});

export class GetDashboardSummaryQueryDto extends createZodDto(GetDashboardSummaryQuerySchema) {}

export const GetDailyTimelineQuerySchema = z.object({
  date: z.string().optional(),
});

export class GetDailyTimelineQueryDto extends createZodDto(GetDailyTimelineQuerySchema) {}
