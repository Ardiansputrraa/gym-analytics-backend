import { Inject, Injectable } from '@nestjs/common';
import {
  IAnalyticsRepository,
  ANALYTICS_REPOSITORY_TOKEN,
} from '../../domain/repositories/analytics.repository.interface';
import { DeterministicInsight } from '../../domain/calculators/deterministic-insights.engine';

export interface GetInsightsQuery {
  userId: string;
}

@Injectable()
export class GetInsightsUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_TOKEN)
    private readonly analyticsRepository: IAnalyticsRepository,
  ) {}

  async execute(query: GetInsightsQuery): Promise<DeterministicInsight[]> {
    return this.analyticsRepository.getDeterministicInsights(query.userId);
  }
}
