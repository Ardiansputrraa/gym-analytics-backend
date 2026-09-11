import { Injectable, Inject } from '@nestjs/common';
import {
  IBodyMeasurementRepository,
  BODY_MEASUREMENT_REPOSITORY_TOKEN,
} from '../../domain/repositories/body-measurement.repository.interface';
import {
  IUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from '../../domain/repositories/user-profile.repository.interface';
import { BodyCompositionCalculator } from '../../domain/calculators/body-composition.calculator';
import {
  BodyCompositionAnalyticsResult,
  BodyCompositionSummary,
  BodyCompositionChartPoint,
  BodyCompositionStatus,
} from '../../domain/entities/body-measurement.entity';

export interface GetBodyCompositionAnalyticsInput {
  userId: string;
  timeframe?: '7d' | '30d' | '90d' | '1y';
}

@Injectable()
export class GetBodyCompositionAnalyticsUseCase {
  constructor(
    @Inject(BODY_MEASUREMENT_REPOSITORY_TOKEN)
    private readonly bodyMeasurementRepository: IBodyMeasurementRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profileRepository: IUserProfileRepository,
  ) {}

  async execute(input: GetBodyCompositionAnalyticsInput): Promise<BodyCompositionAnalyticsResult> {
    const timeframe = input.timeframe || '30d';
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    // 1. Determine timeframe start date
    const startDate = new Date(now);
    if (timeframe === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (timeframe === '1y') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    startDate.setHours(0, 0, 0, 0);

    // 2. Fetch User Profile for baseline reference
    const profile = await this.profileRepository.findByUserId(input.userId);
    const gender = profile?.gender === 'FEMALE' ? 'FEMALE' : 'MALE';
    const heightCm = profile ? profile.heightCm : 170;
    const currentWeight = profile ? profile.weightKg : 70;

    // 3. Fetch latest scan and previous scan
    const latestScan = await this.bodyMeasurementRepository.findLatestByUserId(input.userId);
    const previousScan = latestScan
      ? await this.bodyMeasurementRepository.findPrevious(input.userId, latestScan.measuredAt, latestScan.id)
      : null;

    // Normal ranges
    const normalRanges = BodyCompositionCalculator.getNormalRanges(
      gender,
      heightCm,
      latestScan ? latestScan.weightKg : currentWeight,
    );

    // Compute progress deltas
    const currentMeasurement = latestScan || {
      weightKg: profile?.weightKg || 70,
      skeletalMuscleKg: profile?.skeletalMuscleKg || null,
      bodyFatKg: profile?.bodyFatKg || null,
      bodyFatPct: profile?.bodyFatPct || null,
      fatFreeMassKg: profile?.fatFreeMassKg || null,
      waterContentKg: profile?.waterContentKg || null,
      proteinKg: profile?.proteinKg || null,
      mineralKg: profile?.mineralKg || null,
    };

    const progress = BodyCompositionCalculator.evaluateProgress(
      currentMeasurement,
      previousScan,
    );

    // 4. Fetch history series within timeframe
    const historyScans = await this.bodyMeasurementRepository.findHistoryByDateRange(
      input.userId,
      startDate,
      endDate,
    );

    // Build chart data
    const chartData: BodyCompositionChartPoint[] = [];

    if (historyScans.length > 0) {
      for (const scan of historyScans) {
        const d = new Date(scan.measuredAt);
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const displayDate = `${d.getDate().toString().padStart(2, '0')} ${monthNames[d.getMonth()]}`;

        chartData.push({
          date: d.toISOString().split('T')[0],
          displayDate,
          weightKg: scan.weightKg,
          smmKg: scan.skeletalMuscleKg ?? null,
          bodyFatKg: scan.bodyFatKg ?? null,
          bodyFatPct: scan.bodyFatPct ?? null,
          fatFreeMassKg: scan.fatFreeMassKg ?? null,
          waterContentKg: scan.waterContentKg ?? null,
        });
      }
    } else if (profile) {
      // Fallback single point from current profile if no history scans yet
      const d = new Date(profile.updatedAt || now);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      chartData.push({
        date: d.toISOString().split('T')[0],
        displayDate: `${d.getDate().toString().padStart(2, '0')} ${monthNames[d.getMonth()]}`,
        weightKg: profile.weightKg,
        smmKg: profile.skeletalMuscleKg ?? null,
        bodyFatKg: profile.bodyFatKg ?? null,
        bodyFatPct: profile.bodyFatPct ?? null,
        fatFreeMassKg: profile.fatFreeMassKg ?? null,
        waterContentKg: profile.waterContentKg ?? null,
      });
    }

    // Chart period statistics
    const startWeight = chartData.length > 0 ? chartData[0].weightKg : (profile?.weightKg || 0);
    const endWeight = chartData.length > 0 ? chartData[chartData.length - 1].weightKg : (profile?.weightKg || 0);
    const totalWeightChangeKg = Math.round((endWeight - startWeight) * 10) / 10;

    let trendEvaluation = 'Komposisi tubuh stabil';
    let classification = 'Pemeliharaan stabil';

    if (totalWeightChangeKg < -0.3) {
      trendEvaluation = `Lemak menurun (${totalWeightChangeKg} kg)`;
      classification = 'Fase fat loss';
    } else if (totalWeightChangeKg > 0.3) {
      trendEvaluation = `Massa bertambah (+${totalWeightChangeKg} kg)`;
      classification = 'Fase surplus / bulking';
    }

    const summary: BodyCompositionSummary = {
      currentWeightKg: currentMeasurement.weightKg,
      weightDeltaKg: progress.weightDeltaKg ?? null,
      weightDeltaPct: progress.weightDeltaPct ?? null,
      latestEvaluationDate: latestScan ? latestScan.measuredAt : (profile?.updatedAt || null),

      currentSmmKg: currentMeasurement.skeletalMuscleKg ?? null,
      smmDeltaKg: progress.smmDeltaKg ?? null,
      smmDeltaPct: progress.smmDeltaPct ?? null,
      smmNormalRefMin: normalRanges.smmMin,
      smmNormalRefMax: normalRanges.smmMax,

      currentBodyFatKg: currentMeasurement.bodyFatKg ?? null,
      bodyFatKgDelta: progress.bodyFatKgDelta ?? null,
      currentBodyFatPct: currentMeasurement.bodyFatPct ?? null,
      bodyFatPctDelta: progress.bodyFatPctDelta ?? null,
      currentFatFreeMassKg: ('fatFreeMassKg' in currentMeasurement ? (currentMeasurement as any).fatFreeMassKg : null) ?? (profile?.fatFreeMassKg ?? null),

      currentWaterContentKg: currentMeasurement.waterContentKg ?? null,
      waterContentKgDelta: progress.waterContentKgDelta ?? null,
      currentProteinKg: ('proteinKg' in currentMeasurement ? (currentMeasurement as any).proteinKg : null) ?? (profile?.proteinKg ?? null),
      currentMineralKg: ('mineralKg' in currentMeasurement ? (currentMeasurement as any).mineralKg : null) ?? (profile?.mineralKg ?? null),

      receiptNumber: latestScan?.receiptNumber || '#20555-1',
      receiptTimestamp: latestScan ? latestScan.measuredAt : (profile?.updatedAt || null),
      bmi: (latestScan?.bmi) ?? (profile ? BodyCompositionCalculator.calculateBMI(profile.weightKg, profile.heightCm) : null),
      bmiNormalRefMin: normalRanges.bmiMin,
      bmiNormalRefMax: normalRanges.bmiMax,
      status: latestScan?.status || BodyCompositionStatus.MAINTENANCE,
      evaluation: latestScan?.evaluation || progress.evaluation,
    };

    return {
      summary,
      chartPeriod: {
        startWeightKg: startWeight,
        currentWeightKg: endWeight,
        totalWeightChangeKg,
        trendEvaluation,
        classification,
      },
      chartData,
    };
  }
}
