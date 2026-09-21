import { GetDashboardSummaryUseCase } from './get-dashboard-summary.use-case';
import { GetInsightsUseCase } from './get-insights.use-case';
import { GetDailyTimelineUseCase } from './get-daily-timeline.use-case';

export * from './get-dashboard-summary.use-case';
export * from './get-insights.use-case';
export * from './get-daily-timeline.use-case';

export const ANALYTICS_USE_CASES = [
  GetDashboardSummaryUseCase,
  GetInsightsUseCase,
  GetDailyTimelineUseCase,
];
