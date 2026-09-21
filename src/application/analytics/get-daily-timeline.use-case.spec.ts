import { Test, TestingModule } from '@nestjs/testing';
import { GetDailyTimelineUseCase } from './get-daily-timeline.use-case';
import {
  ANALYTICS_REPOSITORY_TOKEN,
  IAnalyticsRepository,
  DailyTimelineEvent,
} from '../../domain/repositories/analytics.repository.interface';

describe('GetDailyTimelineUseCase', () => {
  let useCase: GetDailyTimelineUseCase;
  let mockAnalyticsRepository: jest.Mocked<IAnalyticsRepository>;

  const mockTimeline: DailyTimelineEvent[] = [
    {
      id: 'event-1',
      time: '18:30',
      type: 'WORKOUT',
      title: 'Sesi Latihan Gym',
      subtitle: 'Volume: 1.680 kg · 4 Gerakan',
      rawTimestamp: new Date(),
    },
  ];

  beforeEach(async () => {
    mockAnalyticsRepository = {
      getDashboardSummary: jest.fn(),
      getDailyTimeline: jest.fn().mockResolvedValue(mockTimeline),
      getDeterministicInsights: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDailyTimelineUseCase,
        {
          provide: ANALYTICS_REPOSITORY_TOKEN,
          useValue: mockAnalyticsRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetDailyTimelineUseCase>(GetDailyTimelineUseCase);
  });

  it('should call repository.getDailyTimeline with correct parameters', async () => {
    const result = await useCase.execute({ userId: 'user-123' });

    expect(mockAnalyticsRepository.getDailyTimeline).toHaveBeenCalled();
    expect(result).toEqual(mockTimeline);
  });
});
