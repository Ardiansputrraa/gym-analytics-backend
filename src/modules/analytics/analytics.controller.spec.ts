import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import {
  GetDashboardSummaryUseCase,
  GetInsightsUseCase,
  GetDailyTimelineUseCase,
} from '../../application/analytics';
import { JwtAuthGuard, JwtPayload } from '../../common/guards/jwt-auth.guard';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let mockGetDashboardSummaryUseCase: jest.Mocked<GetDashboardSummaryUseCase>;
  let mockGetInsightsUseCase: jest.Mocked<GetInsightsUseCase>;
  let mockGetDailyTimelineUseCase: jest.Mocked<GetDailyTimelineUseCase>;

  const mockUser: JwtPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    isAdmin: false,
  };

  beforeEach(async () => {
    mockGetDashboardSummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        timeframe: '7D',
        heroMetrics: {},
      }),
    } as unknown as jest.Mocked<GetDashboardSummaryUseCase>;

    mockGetInsightsUseCase = {
      execute: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<GetInsightsUseCase>;

    mockGetDailyTimelineUseCase = {
      execute: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<GetDailyTimelineUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: GetDashboardSummaryUseCase,
          useValue: mockGetDashboardSummaryUseCase,
        },
        {
          provide: GetInsightsUseCase,
          useValue: mockGetInsightsUseCase,
        },
        {
          provide: GetDailyTimelineUseCase,
          useValue: mockGetDailyTimelineUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it('should return dashboard summary on getDashboardSummary', async () => {
    const result = await controller.getDashboardSummary(mockUser, { timeframe: '7D' });
    expect(result.message).toBe('Data analitik dashboard berhasil diambil');
    expect(mockGetDashboardSummaryUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-123',
      timeframe: '7D',
    });
  });

  it('should return insights on getInsights', async () => {
    const result = await controller.getInsights(mockUser);
    expect(result.message).toBe('Daftar insight deterministik berhasil diambil');
    expect(mockGetInsightsUseCase.execute).toHaveBeenCalledWith({ userId: 'user-123' });
  });

  it('should return timeline on getTimeline', async () => {
    const result = await controller.getTimeline(mockUser, {});
    expect(result.message).toBe('Timeline aktivitas harian berhasil diambil');
    expect(mockGetDailyTimelineUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-123',
      date: undefined,
    });
  });
});
