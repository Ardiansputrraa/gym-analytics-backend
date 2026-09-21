import { MuscleRecoveryStatus } from '../calculators/muscle-recovery.calculator';
import { DeterministicInsight } from '../calculators/deterministic-insights.engine';

export type AnalyticsTimeframe = '7D' | '30D' | '90D';

export interface HeroMetricsData {
  volume: {
    totalKg: number;
    trendPct: number;
    isPositive: boolean;
  };
  protein: {
    consumedG: number;
    targetG: number;
    remainingG: number;
    pct: number;
  };
  fat: {
    consumedG: number;
    targetG: number;
    remainingG: number;
    pct: number;
  };
  carbs: {
    consumedG: number;
    targetG: number;
    remainingG: number;
    pct: number;
  };
  weight: {
    currentKg: number;
    trendKg: number;
    trendPct: number;
    isAlignedWithGoal: boolean;
  };
  activeRatio: {
    activePct: number;
    restPct: number;
    totalActiveMinutes: number;
    totalRestMinutes: number;
  };
}

export interface RadialGaugesData {
  calorieProgress: {
    consumedKcal: number;
    targetKcal: number;
    deltaKcal: number;
    deficitPct: number;
    macroSplit: {
      proteinPct: number;
      fatPct: number;
      carbsPct: number;
    };
  };
  hydrationProgress: {
    consumedMl: number;
    targetMl: number;
    remainingMl: number;
    pct: number;
  };
}

export interface VolumeByMuscleGroupItem {
  muscle: string;
  name: string;
  volumeKg: number;
  sets: number;
  pct: number;
}

export interface StrengthProgressionItem {
  exerciseId: string;
  exerciseName: string;
  category: string;
  current1RM: number;
  previous1RM: number;
  deltaPct: number;
  history: {
    date: string;
    oneRepMaxKg: number;
    weightKg: number;
    reps: number;
  }[];
}

export interface CalorieWeightCorrelationItem {
  date: string;
  calories: number;
  targetCalories: number;
  weightKg: number | null;
}

export interface WorkRestRatioItem {
  date: string;
  activeMin: number;
  restMin: number;
  totalMin: number;
}

export interface HeatmapDayItem {
  day: number;
  date: string;
  hasWorkout: boolean;
  volume: number;
  durationMinutes: number;
}

export interface ConsistencyHeatmapData {
  items: HeatmapDayItem[];
  completedSessions: number;
  targetSessions: number;
  adherencePct: number;
  activeStreakWeeks: number;
}

export interface RecentPRItem {
  exerciseId: string;
  exercise: string;
  date: string;
  metric: string;
  e1rm: string;
}

export interface LastWorkoutSessionData {
  id: string;
  name: string;
  completedAt: string;
  totalVolumeKg: number;
  durationMinutes: number;
  activeRatioPct: number;
  totalExercises: number;
  totalSets: number;
  newPrsCount: number;
  exercises: {
    exerciseName: string;
    muscleGroupName: string;
    totalSets: number;
    topSet: string;
    oneRepMaxEst: number;
    volumeKg: number;
    isPr: boolean;
  }[];
}

export interface ActiveWorkoutHeroData {
  id: string;
  name: string;
  startedAt: string;
  elapsedSeconds: number;
  totalExercises: number;
  totalSets: number;
}

export interface CheckInBannerData {
  daysRemaining: number;
  isOverdue: boolean;
  intervalDays: number;
  lastCheckInDate: string | null;
}

export interface DashboardSummaryData {
  timeframe: AnalyticsTimeframe;
  checkInBanner: CheckInBannerData;
  activeWorkout: ActiveWorkoutHeroData | null;
  heroMetrics: HeroMetricsData;
  radialGauges: RadialGaugesData;
  charts: {
    volumeByMuscleGroup: VolumeByMuscleGroupItem[];
    strengthProgression: StrengthProgressionItem[];
    calorieVsWeight: CalorieWeightCorrelationItem[];
    workRestRatio: WorkRestRatioItem[];
  };
  muscleRecovery: MuscleRecoveryStatus[];
  consistencyHeatmap: ConsistencyHeatmapData;
  lastWorkoutSession: LastWorkoutSessionData | null;
  recentPRs: RecentPRItem[];
  deterministicInsights: DeterministicInsight[];
}

export interface DailyTimelineEvent {
  id: string;
  time: string;
  type: 'WORKOUT' | 'FOOD' | 'DRINK';
  title: string;
  subtitle: string;
  rawTimestamp: Date;
}

export interface IAnalyticsRepository {
  getDashboardSummary(
    userId: string,
    timeframe: AnalyticsTimeframe,
    referenceDate?: Date,
  ): Promise<DashboardSummaryData>;
  getDailyTimeline(userId: string, targetDate: Date): Promise<DailyTimelineEvent[]>;
  getDeterministicInsights(userId: string, referenceDate?: Date): Promise<DeterministicInsight[]>;
}

export const ANALYTICS_REPOSITORY_TOKEN = Symbol('IAnalyticsRepository');
