import { Test, TestingModule } from '@nestjs/testing';
import { GetDashboardSummaryUseCase } from './get-dashboard-summary.use-case';
import {
  ANALYTICS_REPOSITORY_TOKEN,
  IAnalyticsRepository,
  DashboardSummaryData,
} from '../../domain/repositories/analytics.repository.interface';

describe('GetDashboardSummaryUseCase', () => {
  let useCase: GetDashboardSummaryUseCase;
  let mockAnalyticsRepository: jest.Mocked<IAnalyticsRepository>;

  const mockSummaryData: DashboardSummaryData = {
    timeframe: '7D',
    checkInBanner: {
      daysRemaining: 15,
      isOverdue: false,
      intervalDays: 30,
      lastCheckInDate: null,
    },
    activeWorkout: null,
    heroMetrics: {
      volume: { totalKg: 1000, trendPct: 10, isPositive: true },
      protein: { consumedG: 120, targetG: 150, remainingG: 30, pct: 80 },
      fat: { consumedG: 50, targetG: 60, remainingG: 10, pct: 83 },
      carbs: { consumedG: 200, targetG: 250, remainingG: 50, pct: 80 },
      weight: { currentKg: 70, trendKg: -0.5, trendPct: -0.7, isAlignedWithGoal: true },
      activeRatio: { activePct: 55, restPct: 45, totalActiveMinutes: 60, totalRestMinutes: 50 },
    },
    radialGauges: {
      calorieProgress: {
        consumedKcal: 1800,
        targetKcal: 2200,
        deltaKcal: 400,
        deficitPct: 18,
        macroSplit: { proteinPct: 30, fatPct: 25, carbsPct: 45 },
      },
      hydrationProgress: {
        consumedMl: 2000,
        targetMl: 2500,
        remainingMl: 500,
        pct: 80,
      },
    },
    charts: {
      volumeByMuscleGroup: [],
      strengthProgression: [],
      calorieVsWeight: [],
      workRestRatio: [],
    },
    muscleRecovery: [],
    consistencyHeatmap: {
      items: [],
      completedSessions: 4,
      targetSessions: 4,
      adherencePct: 100,
      activeStreakWeeks: 1,
    },
    lastWorkoutSession: null,
    recentPRs: [],
    deterministicInsights: [],
  };

  beforeEach(async () => {
    mockAnalyticsRepository = {
      getDashboardSummary: jest.fn().mockResolvedValue(mockSummaryData),
      getDailyTimeline: jest.fn(),
      getDeterministicInsights: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDashboardSummaryUseCase,
        {
          provide: ANALYTICS_REPOSITORY_TOKEN,
          useValue: mockAnalyticsRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetDashboardSummaryUseCase>(GetDashboardSummaryUseCase);
  });

  it('should call repository.getDashboardSummary with correct parameters', async () => {
    const result = await useCase.execute({ userId: 'user-123', timeframe: '7D' });

    expect(mockAnalyticsRepository.getDashboardSummary).toHaveBeenCalledWith('user-123', '7D');
    expect(result).toEqual(mockSummaryData);
  });
});
