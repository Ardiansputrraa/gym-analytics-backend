import { Inject, Injectable } from '@nestjs/common';
import {
  IAnalyticsRepository,
  ANALYTICS_REPOSITORY_TOKEN,
  DailyTimelineEvent,
} from '../../domain/repositories/analytics.repository.interface';

export interface GetDailyTimelineQuery {
  userId: string;
  date?: string;
}

@Injectable()
export class GetDailyTimelineUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_TOKEN)
    private readonly analyticsRepository: IAnalyticsRepository,
  ) {}

  async execute(query: GetDailyTimelineQuery): Promise<DailyTimelineEvent[]> {
    const targetDate = query.date ? new Date(query.date) : new Date();
    return this.analyticsRepository.getDailyTimeline(query.userId, targetDate);
  }
}
