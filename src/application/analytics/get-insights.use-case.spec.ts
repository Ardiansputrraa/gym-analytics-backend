import { Test, TestingModule } from '@nestjs/testing';
import { GetInsightsUseCase } from './get-insights.use-case';
import {
  ANALYTICS_REPOSITORY_TOKEN,
  IAnalyticsRepository,
} from '../../domain/repositories/analytics.repository.interface';
import { DeterministicInsight } from '../../domain/calculators/deterministic-insights.engine';

describe('GetInsightsUseCase', () => {
  let useCase: GetInsightsUseCase;
  let mockAnalyticsRepository: jest.Mocked<IAnalyticsRepository>;

  const mockInsights: DeterministicInsight[] = [
    {
      id: 'insight-1',
      type: 'INFO',
      category: 'BODY_COMPOSITION',
      title: 'Progres Komposisi Tubuh Terpantau',
      description: 'Body fat turun 1% dengan massa otot stabil.',
      generatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    mockAnalyticsRepository = {
      getDashboardSummary: jest.fn(),
      getDailyTimeline: jest.fn(),
      getDeterministicInsights: jest.fn().mockResolvedValue(mockInsights),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetInsightsUseCase,
        {
          provide: ANALYTICS_REPOSITORY_TOKEN,
          useValue: mockAnalyticsRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetInsightsUseCase>(GetInsightsUseCase);
  });

  it('should call repository.getDeterministicInsights with correct userId', async () => {
    const result = await useCase.execute({ userId: 'user-123' });

    expect(mockAnalyticsRepository.getDeterministicInsights).toHaveBeenCalledWith('user-123');
    expect(result).toEqual(mockInsights);
  });
});
