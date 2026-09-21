import { Inject, Injectable } from '@nestjs/common';
import {
  IAnalyticsRepository,
  ANALYTICS_REPOSITORY_TOKEN,
  AnalyticsTimeframe,
  DashboardSummaryData,
} from '../../domain/repositories/analytics.repository.interface';

export interface GetDashboardSummaryQuery {
  userId: string;
  timeframe?: AnalyticsTimeframe;
}

@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_TOKEN)
    private readonly analyticsRepository: IAnalyticsRepository,
  ) {}

  async execute(query: GetDashboardSummaryQuery): Promise<DashboardSummaryData> {
    const timeframe = query.timeframe || '7D';
    return this.analyticsRepository.getDashboardSummary(query.userId, timeframe);
  }
}
