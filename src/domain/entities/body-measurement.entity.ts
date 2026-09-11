export enum BodyCompositionStatus {
  FAT_LOSS = 'FAT_LOSS',
  MUSCLE_GAIN = 'MUSCLE_GAIN',
  MAINTENANCE = 'MAINTENANCE',
  PR_COMPOSITION = 'PR_COMPOSITION',
}

export interface BodyMeasurementEntity {
  id: string;
  userId: string;
  measuredAt: Date;
  receiptNumber?: string | null;
  weightKg: number;
  skeletalMuscleKg?: number | null;
  bodyFatKg?: number | null;
  bodyFatPct?: number | null;
  fatFreeMassKg?: number | null;
  waterContentKg?: number | null;
  proteinKg?: number | null;
  mineralKg?: number | null;
  bmi?: number | null;
  status?: BodyCompositionStatus | null;
  evaluation?: string | null;
  notes?: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BodyCompositionDelta {
  weightDeltaKg: number;
  weightDeltaPct: number;
  smmDeltaKg?: number | null;
  smmDeltaPct?: number | null;
  bodyFatKgDelta?: number | null;
  bodyFatPctDelta?: number | null;
  waterContentKgDelta?: number | null;
  evaluation: string;
  status: BodyCompositionStatus;
}

export interface BodyCompositionSummary {
  currentWeightKg: number;
  weightDeltaKg: number;
  weightDeltaPct: number;
  latestEvaluationDate: Date | null;
  
  currentSmmKg: number | null;
  smmDeltaKg: number | null;
  smmDeltaPct: number | null;
  smmNormalRefMin: number | null;
  smmNormalRefMax: number | null;

  currentBodyFatKg: number | null;
  bodyFatKgDelta: number | null;
  currentBodyFatPct: number | null;
  bodyFatPctDelta: number | null;
  currentFatFreeMassKg: number | null;

  currentWaterContentKg: number | null;
  waterContentKgDelta: number | null;
  currentProteinKg: number | null;
  currentMineralKg: number | null;

  // Struk detail snapshot
  receiptNumber: string | null;
  receiptTimestamp: Date | null;
  bmi: number | null;
  bmiNormalRefMin: number;
  bmiNormalRefMax: number;
  status: BodyCompositionStatus;
  evaluation: string;
}

export interface BodyCompositionChartPoint {
  date: string; // ISO date or display date
  displayDate: string;
  weightKg: number;
  smmKg: number | null;
  bodyFatKg: number | null;
  bodyFatPct: number | null;
  fatFreeMassKg: number | null;
  waterContentKg: number | null;
}

export interface BodyCompositionAnalyticsResult {
  summary: BodyCompositionSummary;
  chartPeriod: {
    startWeightKg: number;
    currentWeightKg: number;
    totalWeightChangeKg: number;
    trendEvaluation: string;
    classification: string;
  };
  chartData: BodyCompositionChartPoint[];
}
